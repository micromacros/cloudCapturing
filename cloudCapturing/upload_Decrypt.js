var rsaenc = require('./rsaenc.js')
const decrypt = require('./decrypt.js');
const verify = require('./verify.js');
const delFile = require('./delFile.js')

const upload_decrypt = function (body,callback){
    var ipaddr = body.ip_addr
    var pubKey = `../cloud-dashboard/Cloud-Page/Backend/RSA_Local_Software/${ipaddr}/public_key.pem`
    var privKey = '../cloud-dashboard/Cloud-Page/Backend/RSA_Cloud/private_key.pem'
    var encKey = body.Key
    // decrypting key file
    key = rsaenc.decryptKey(encKey,privKey)

    var keySig = body.Key_Signature
	var signature = body.Signature
	fs.writeFileSync('./upload_Decrypt/sig/sign.sig',signature)
	var uploadFile = body.FileInformation
	var uploadSig = body.Upload_Signature

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