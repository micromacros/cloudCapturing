const express = require('express');
const { createProxyMiddleware} = require('http-proxy-middleware');
const fs = require('fs')
const path = require('path')
const crypto_process = require('./stream_encrypting');
const convertMP4 = require('./encryptAtRest/convertmp4')
const encrypt_segment = require('./atRest_encrypting')
const decrypt_atRest = require('./atRest_decrypting')
var rsaenc = require('./upload_Decrypt/rsaenc.js')
const decrypt = require('./upload_Decrypt/decrypt.js');
const verify = require('./upload_Decrypt/verify.js');
const bodyParser = require('body-parser');	
var multer = require('multer')
const axios = require('axios');

const app = express();
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }));

//* Multer Upload
let storage = multer.diskStorage({
	destination: function (req, file, callback) {
		console.log(file)
		callback(null,"./upload_Decrypt/public/encryptedFiles")
	},
	filename: function (req, file, cb) {
		req.filename = file.originalname
		cb(null, req.filename);

	}
});
let upload = multer({
	storage: storage, limits: { fileSize: 5000 * 1024 * 1024 }
});//limits check if he file size is equal to or below 5mb


//* Function for encrypting segments during upload
const encryptSegments = async (HLSFilePath, DASHFilePath, fileNameNew, callback) => {
  try {
    //* Reading the Directories of both HLS and DASH Converted Segments
    const [hlsFiles, dashFiles] = await Promise.all([
      readDirectory(HLSFilePath),
      readDirectory(DASHFilePath)
    ])

    //* Request to get the encryption list
    axios.get('https://creamsecurity.cloud/api/encryption-list/AR')
    .then(response => {
      
      const data = response.data
      const dataList = data.split(',')
      var newData = ''
      for (i = 0; i <dataList.length; i++){
        if (dataList[i] == 'AES-256'){
          newData += 'aes'
        }
        if (dataList[i] == 'Triple-DES'){
          newData += "des"
        }
        if (dataList[i] == 'ChaCha20'){
          newData += "cha"
        }
        if (dataList[i] == 'Blowfish'){
          newData += "bfe"
        }
        if (i != dataList.length-1){
          newData += ','
        }
      }
      
      //* Writing new list of encryptions into text file
      fs.writeFile('./encryptAtRest/encryption-list/encryptionLst.txt', newData, async () => {
        //* Looping through each file in the HLS Directory
        for(const file of hlsFiles){
          const filePath = path.join(HLSFilePath, file);
          const filenameList = filePath.split('/');
          //* Getting Filename of the file (e.g. from 'samplevideo-001.ts' you get 'samplevideo-001')
          const filename = filenameList[filenameList.length - 1];
          //* Check if file exists
          if (fs.statSync(filePath).isFile()) {
            const encryptFileAtRestPath = `./encryptAtRest/HLSEncrypted/${fileNameNew}`;
            //* Encrypting the Segment
            await encrypt_segment(filePath, encryptFileAtRestPath, file, (err, encryptedBuffer) => {
              if (err){
                console.log(err)
              }
              else{
                //* Creating headers to send to streaming service uploading API
                const targetHeaders = {
                  'content-type': 'application/json',
                  'dataType': 'json',
                  'filename': fileNameNew,
                  'segmentname':filename,
                  'type': 'HLS'
                };
                //* Placing Buffer into the body object
                const encryptedFileObject = {
                  "fileData": encryptedBuffer
                } 
                //* Target API URL
                const targetUrl = 'https://streamerpro.xyz/api/uploadVideo'; 
                axios.post(targetUrl, encryptedFileObject, { headers: targetHeaders })
                  .then((response) => {
                    // Handle the response
                    console.log(`response status: ${response.status}`)
                    console.log('Segment is uploaded'); 
                  })
                  .catch((error) => {
                    // Handle the error
                    console.log(`response status: ${error.response.status}`)
                    console.error(error);
                    return callback(error, null)
                  });
                }
            });
          }
        }
        //* Looping through each file in the DASH Directory
        for (const file of dashFiles) {
          const filePath = path.join(DASHFilePath, file);
          const filenameList = filePath.split('/');
          //* Getting Filename of the file (e.g. from 'samplevideo-001.mp4' you get 'samplevideo-001')
          const filename = filenameList[filenameList.length - 1];
          //* Encrypting the Segment

          if (fs.statSync(filePath).isFile()) {
            const encryptFileAtRestPath = `./encryptAtRest/DASHEncrypted/${fileNameNew}`;
            await encrypt_segment(filePath, encryptFileAtRestPath, file, (err, encryptedBuffer) => {
              if(err){
                console.log(err)
              }
              else{
                //* Creating headers to send to streaming service uploading API
                const targetHeaders = {
                  'content-type': 'application/json',
                  'dataType': 'json',
                  'filename': fileNameNew,
                  'segmentname':filename,
                  'type': 'DASH'
                };
                //* Placing Buffer into the body object
                const encryptedFileObject = {
                  "fileData": encryptedBuffer
                } 
                //* Target API URL
                const targetUrl = 'https://streamerpro.xyz/api/uploadVideo';
                axios.post(targetUrl, encryptedFileObject, { headers: targetHeaders })
                  .then((response) => {
                    // Handle the response
                    console.log(`response status: ${response.status}`)
                    console.log('Segment is uploaded');
                  })
                  .catch((error) => {
                    // Handle the error
                    console.log(`response status: ${error.response.status}`)
                    console.error(error);
                    return callback(error, null)
                  });
                }
            });
          }
        }
        return callback(null, null)
      })
    })
    .catch(error => {
      // Handle the error
      console.error(error);
    });
  } catch (err) {
    console.error(err);
    // Handle errors here
  }
};

//* Function to read a directory
function readDirectory(directory) {
  return new Promise((resolve, reject) => {
    fs.readdir(directory, (err, files) => {
      if (err) {
        reject(err);
      } else {
        resolve(files);
      }
    });
  });
}


//* Proxy listening function for encryption during video streaming
const listenResponse = async (proxyRes, req, res) => {
  const headers = proxyRes.headers // Read Headers
  const fileHeader = proxyRes.headers.cream_encrypt// Check 'cream_encrypt' Header has value True
  const manifest_type = proxyRes.headers.manifest_type // Read Type of Manifest file
  const filename = proxyRes.headers.filename
  
  //* Checks whether response requires encryption using 
  //* custom file header 
  if (fileHeader){ 
    console.log('This file needs encryption')

    if (manifest_type == 'HLS'){ //If Manifest File is HLS
      console.log('This is a HLS file segment/manifest')
      console.log(filename)
    }
    else if (manifest_type == 'DASH'){ //If Manifest File is DASH
      console.log('This is a DASH file segment/manifest')
      console.log(filename)
    }
    //* Decrypting Segments at Rest
    console.log('decrypting segment encrypted at rest...')

    const encKeyFilePath = `../key_cloudCapturing/atRestKeyFile/encKey_${filename}.bin`
    const segmentSig = `../key_cloudCapturing/atRestSig/${filename}.sig`    

    await decrypt_atRest(proxyRes,segmentSig, encKeyFilePath, async (err, decryptedFile) => {
      if (err){
        if (err == 401){
          console.log('File Verification Failed')
          res.status(401)
          res.send()
        }
        else if (err){
          console.log(err)
        }
      }
      else{
        console.log('Segment Decrypted At Rest')
        //* Encrypting segments in transit
        await crypto_process(proxyRes, decryptedFile, async (encryptedJSON) => {
    
          // Send the new response with the encrypted file content
          // Preserve the original headers from proxyRes
          const preservedHeaders = { ...headers };
    
          // Set the appropriate headers for the new response
          res.set(preservedHeaders);
          // Send the new response with the encrypted file content
          res.send(encryptedJSON);
          console.log('encrypted file sent successfully')
        })
      
        
      }

    })


  }
  else{
    console.log('This does not need encryption')
    // res.send()
    proxyRes.pipe(res)
    
  }

};


//* API for video uploading
app.post('/getVideo',upload.single('file'), function(req,res) {

  var ipaddr = req.body.ip_addr //* IP ADDR
  var pubKey = `../cloud-dashboard/Cloud-Page/Backend/RSA_Local_Software/${ipaddr}/public_key.pem`
  var privKey = '../cloud-dashboard/Cloud-Page/Backend/RSA_Cloud/private_key.pem'
  var encKey = req.body.Key //* ENCRYPTED KEY FILE
  key = rsaenc.decryptKey(encKey,privKey) //* DECRYPTING ENC KEY FILE
  var keySig =req.body.Key_Signature
  var signature = req.body.Signature
  fs.writeFileSync('./upload_Decrypt/sig/sign.sig',signature)
  var uploadFile = req.body.FileInformation
  var uploadSig = req.body.Upload_Signature
  //* CHECK TO SEE IF KEY FILE AND UPLOAD INFORMATION IS LEGITIMATE USING SIGNATURE
  if (verify(key,keySig,pubKey) == true&&verify(uploadFile,uploadSig,pubKey)==true){ 
    fs.writeFileSync('./upload_Decrypt/key/key.bin', key);
    fs.writeFileSync('./upload_Decrypt/public/uploads/upload.bin', uploadFile);
    // Decrypt
    const keyDic = './upload_Decrypt/key/key.bin'
    const encpath = './upload_Decrypt/public/encryptedFiles/';
    var files = fs.readdirSync(encpath);
    var file = encpath+files[0];
    var inputFile = file
    var outputFile = './upload_Decrypt/public/decryptedFiles/'
    //* DECRYPTING ENC FILE AND CHECKING SIGNATURE
    decrypt(inputFile,outputFile,keyDic,pubKey, async (verify, decryptedFile) => {
      if (verify) {
        console.log('File Decrypted Successfully')
        console.log('Converting to HLS/DASH...')
        var filenameList = decryptedFile.split('/')
        var filename = filenameList[filenameList.length-1]
        var filenameWOExt = path.parse(filename).name
        //* New file name to avoid filename problems
        var fileNameNew = filenameWOExt.split(' ').join('-');
        
        //* Converting the MP4 File into HLS and DASH Formatted Videos (Segments and Manifests)
        await convertMP4(decryptedFile, fileNameNew, async (err, HLSFilePath, DASHFilePath) => {
          if (err) {
            console.log(err)
            res.status(500).send()
            //send error response for inability to convert
          }
          else{
            console.log('Video has been converted to HLS/DASH.')
            //* Encrypting the segments
            await encryptSegments(HLSFilePath, DASHFilePath,fileNameNew, async (err, complete) => {
              if (err){
                console.log(err)
                res.status(500).send('An error occurred during upload');
              }
              else{
                //TODO figure out how to not use timer to delay response
                await new Promise((resolve) => setTimeout(resolve, 10000));
                res.status(200).send('Upload Complete')
                
                const encryptFileAtRestHLS = `./encryptAtRest/HLSEncrypted/${fileNameNew}`;
                const encryptFileAtRestDASH = `./encryptAtRest/DASHEncrypted/${fileNameNew}`;

                fs.rmSync(HLSFilePath, { recursive: true, force: true });
                fs.rmSync(DASHFilePath, { recursive: true, force: true });
                fs.rmSync(encryptFileAtRestHLS, { recursive: true, force: true });
                fs.rmSync(encryptFileAtRestDASH, { recursive: true, force: true });

              }
              
            }) 
          }
        })
      }
      else{
        console.log('file verification failed')
        res.status(500).send('authfail')
      }
    })

  }else{
    res.status(500).send('authfail')
  }


})


// Proxy middleware
const proxyOptions = {
  target: 'https://streamerpro.xyz',
  changeOrigin: true,
  selfHandleResponse: true,
  onProxyRes:listenResponse
};

const proxy = createProxyMiddleware(proxyOptions);

// Apply the proxy middleware to all requests
app.use('/', proxy);

// Start the server
const port = 9090; // Replace with your desired port
app.listen(port, () => {
  console.log(`Proxy server is running on port ${port}`);
});



      // res.writeHead(200, {
      //   'cream_encrypted_file': 'encrypted',
      //   // 'Content-Length': Buffer.byteLength(encryptedJSON),
      //   // Add any other desired headers here
      // });
