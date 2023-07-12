const express = require('express');
const { createProxyMiddleware} = require('http-proxy-middleware');
const fs = require('fs')
const path = require('path')
const crypto_process = require('./stream_encrypting');
const convertMP4 = require('./encryptAtRest/convertmp4')
const encrypt_segment = require('./atRest_encrypting')
const decrypt_atRest = require('./atRest_decrypting')
const { json } = require('stream/consumers');
const http = require('http')
const upload_decrypt = require('./upload_Decrypt')
var rsaenc = require('./upload_Decrypt/rsaenc.js')
const decrypt = require('./upload_Decrypt/decrypt.js');
const verify = require('./upload_Decrypt/verify.js');
const delFile = require('./upload_Decrypt/delFile.js');
const bodyParser = require('body-parser');	
var multer = require('multer')

const app = express();
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }));


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

const encryptSegments = async (HLSFilePath, DASHFilePath, encryptedSegmentsBuffer, fileNameNew, callback) => {
  try {
    const [hlsFiles, dashFiles] = await Promise.all([
      readDirectory(HLSFilePath),
      readDirectory(DASHFilePath)
    ])

    for(const file of hlsFiles){
      const filePath = path.join(HLSFilePath, file);
      console.log(filePath);
      const filenameList = filePath.split('\\');
      console.log(filenameList);
      const filename = filenameList[filenameList.length - 1];

      if (fs.statSync(filePath).isFile()) {
        const encryptFileAtRestPath = `./encryptAtRest/HLSEncrypted/${fileNameNew}`;
        await encrypt_segment(filePath, encryptFileAtRestPath, file, (encryptedBuffer) => {
          encryptedSegmentsBuffer.HLS.push({ [filename]: encryptedBuffer });
        });
      }
    }

    // await Promise.all(hlsFiles.map(async (file) => {

    // }))

    for (const file of dashFiles) {
      const filePath = path.join(DASHFilePath, file);
      console.log(filePath);
      const filenameList = filePath.split('\\');
      console.log(filenameList);
      const filename = filenameList[filenameList.length - 1];

      if (fs.statSync(filePath).isFile()) {
        const encryptFileAtRestPath = `./encryptAtRest/DASHEncrypted/${fileNameNew}`;
        await encrypt_segment(filePath, encryptFileAtRestPath, file, (encryptedBuffer) => {
          encryptedSegmentsBuffer.DASH.push({ [filename]: encryptedBuffer });
        });
      }
    }

    // await Promise.all(dashFiles.map(async (file) => {
    // }))

    return callback()
    
    // Call the callback or perform other operations here after both readdir operations are completed

  } catch (err) {
    console.error(err);
    // Handle errors here
  }
};

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



const listenResponse = async (proxyRes, req, res) => {
  const headers = proxyRes.headers // Read Headers
  const fileHeader = proxyRes.headers.cream_encrypt// Check 'cream_encrypt' Header has value True
  const manifest_type = proxyRes.headers.manifest_type // Read Type of Manifest file
  const filename = proxyRes.headers.filename



  if (fileHeader){ //Check if Header ('File', 'Header') is present in response (header will change)
    console.log('This file needs encryption')

    if (manifest_type == 'HLS'){ //If Manifest File is HLS
      console.log('This is a HLS file segment/manifest')
      console.log(filename)
    }
    else if (manifest_type == 'DASH'){ //If Manifest File is DASH
      console.log('This is a DASH file segment/manifest')
      console.log(filename)
    }

    console.log('decrypting segment encrypted at rest...')

    const encKeyFilePath = `./key/atRestKeyFile/encKey_${filename}.bin`
    const segmentSig = `./encryptAtRest/public/atRestSig/${filename}.sig`
    const atRestList = `./encryptAtRest/encryption-list/encryptionLst.txt`
    

    await decrypt_atRest(proxyRes,segmentSig, encKeyFilePath,atRestList, async (err, decryptedFile) => {
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

app.post('/getVideo',upload.single('file'), function(req,res) {

  var ipaddr = req.body.ip_addr
  var pubKey = `../cloud-dashboard/Cloud-Page/Backend/RSA_Local_Software/${ipaddr}/public_key.pem`
  var privKey = '../cloud-dashboard/Cloud-Page/Backend/RSA_Cloud/private_key.pem'
  var encKey = req.body.Key
  // decrypting key file
  key = rsaenc.decryptKey(encKey,privKey)
  var keySig =req. body.Key_Signature
  var signature = req.body.Signature
  fs.writeFileSync('./upload_Decrypt/sig/sign.sig',signature)
  var uploadFile = req.body.FileInformation
  var uploadSig = req.body.Upload_Signature

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
    decrypt(inputFile,outputFile,keyDic,pubKey, async (verify, decryptedFile) => {
      if (verify) {
          console.log('decryption completed')
          console.log('File Decrypted Successfully')
          console.log(decryptedFile)
          console.log('Converting to HLS/DASH...')
          var filenameList = decryptedFile.split('/')
          var filename = filenameList[filenameList.length-1]
          console.log(filename)
          var filenameWOExt = path.parse(filename).name
          var ext = path.extname(filename)
          var fileNameNew = filenameWOExt.split(' ').join('-');
          // const filePath = `./upload_Decrypt/public/decryptedFiles/${filename}`
          await convertMP4(decryptedFile, fileNameNew, async (err, HLSFilePath, DASHFilePath) => {
            if (err) {
              console.log(err)
              //send error response for inability to convert
            }
            else{
              console.log('Video has been converted to HLS/DASH.')
              const encryptedSegmentsBuffer = {
                "HLS": [],
                "DASH": []
              }
    
              await encryptSegments(HLSFilePath, DASHFilePath,encryptedSegmentsBuffer,fileNameNew, async () => {
                await new Promise((resolve) => setTimeout(resolve, 15000));
                console.log(encryptedSegmentsBuffer)
                const targetOptions = {
                  host: '54.179.171.7',
                  path: '/api/uploadVideo', // Replace with the appropriate endpoint on the target server
                  method: 'POST', // Replace with the appropriate HTTP method
                  headers: {
                    'content-type': 'application/json',
                    'dataType': 'json',
                    'segment_encrypted': 'true',
                    'filename': filename
                  },
                };
        
                const targetReq = http.request(targetOptions, (targetRes) => {
                  targetRes.pipe(res);
                });
        
                // Write the encrypted object to the request body
                targetReq.write(JSON.stringify(encryptedSegmentsBuffer));
                targetReq.end();
                console.log('New Request sent successfully')
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
  target: 'http://54.179.171.7', // Replace with your server's URL
  changeOrigin: true,
  selfHandleResponse: true,
  onProxyRes:listenResponse,
  // onProxyReq: listenRequest
  // Additional options if needed
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