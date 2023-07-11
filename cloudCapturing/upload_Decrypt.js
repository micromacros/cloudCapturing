var rsaenc = require('./upload_Decrypt/rsaenc.js')
const decrypt = require('./upload_Decrypt/decrypt.js');
const verify = require('./upload_Decrypt/verify.js');
const delFile = require('./upload_Decrypt/delFile.js')

const upload_decrypt = function (req,callback){
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
		const path = './upload_Decrypt/public/encryptedFiles/';
		var files = fs.readdirSync(path);
		var file = path+files[0];
		var inputFile = file
		var outputFile = './upload_Decrypt/public/decryptedFiles/'
		decrypt(inputFile,outputFile,keyDic, (verify, file) => {
            if (verify) {
                console.log('decryption completed')
                return callback(null, file)
            }
            else{
                console.log('file verification failed')
                return callback(err, null)
            }

        })
			// res.status(201).send('decryption completed')

		
        // else{
		// 	res.status(500).send('authfail')
		// }
	}else{
		res.status(500).send('authfail')
	}


}

module.exports = upload_decrypt