const { json } = require("body-parser");
const crypto = require("crypto");
const fs = require("fs");
async function decryptKey(input,output,keyFile){     
    const privateKey = fs.readFileSync(keyFile); 
    // console.log(privateKey)  
    const encDic = JSON.parse(fs.readFileSync(input))
    // const encFile = fs.readFileSync(input)
    // console.log(encDic)
    var enc = Object.keys(encDic)
    var keyDic = {}
    for (let i = 0; i < enc.length; i++) {
        var key = Buffer.from(encDic[enc[i]].data)
        const decryptedData = crypto.privateDecrypt(
            {
                key: privateKey,
                padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
                oaepHash: "sha256",
            },
            key
        );
        if(enc[i] == 'des'){
            keyDic[enc[i]]=decryptedData.toString()
        }else{
            keyDic[enc[i]]=decryptedData
        }
    }
    // console.log(keyDic)
    var myjson = JSON.stringify(keyDic)
    fs.writeFileSync(output, myjson);
    console.log(`Decrypted file written to ${output}`);
}
module.exports = {decryptKey}
// // Load the RSA key pair from the PEM files
// const privateKeyfile = fs.readFileSync("./private-key/private_key.pem");
// const publicKeyfile = fs.readFileSync("./public-key/public_key.pem");
// // Encrypt the media file
// const plainTextFilePath = "testkey.bin";
// const encryptedFilePath = "./encryptedFiles/enc.enc";
// const decryptedFilePath = "./decryptedFiles/key.bin";