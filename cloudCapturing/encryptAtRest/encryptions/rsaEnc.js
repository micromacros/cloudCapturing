const { json } = require("body-parser");
const crypto = require("crypto");
const fs = require("fs");
// function isObjectEmpty(obj) {
//     return Object.keys(obj).length === 0;
//   }
function encryptKey(input,output,keyFile ,callback){
    const publicKey = fs.readFileSync(keyFile);
    const keyDic = JSON.parse(fs.readFileSync(input))
    var enc = Object.keys(keyDic)
    var encDic = {}

    for (let i = 0; i < enc.length; i++) {
        // Gets the needed keys
        var value = keyDic[enc[i]]
        if (value === null || value === "" || (Array.isArray(value) && value.length === 0) || (typeof value === 'object' && Object.keys(value).length === 0)) {
            console.log(`${enc[i]} is empty`)
        }
        else {
            if(enc[i] == 'des'){
                // Des key is stored in plaintext
                var key = keyDic[enc[i]]
            }else{
                // The other keys are stored as Buffer but in plain text, need to change it back to buffer
                var key = Buffer.from(keyDic[enc[i]].data)
                
            }
            const encryptedData = crypto.publicEncrypt(
                {
                key: publicKey,
                padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
                oaepHash: "sha256",
                },
                // plainText
                key
            );
            encDic[enc[i]]=encryptedData
        }
    }
    // console.log(encDic)
    var myjson = JSON.stringify(encDic)
    fs.writeFileSync(output, myjson);
    console.log(`Encrypted Key File written to ${output}`);
    return callback()
}
module.exports = {encryptKey}
// // Load the RSA key pair from the PEM files
// const privateKeyfile = fs.readFileSync("./private-key/private_key.pem");
// const publicKeyfile = fs.readFileSync("./public-key/public_key.pem");
// // Encrypt the media file
// const plainTextFilePath = "testkey.bin";
// const encryptedFilePath = "./encryptedFiles/enc.enc";
// const decryptedFilePath = "./decryptedFiles/key.bin";