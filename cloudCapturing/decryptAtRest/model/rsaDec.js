const { json } = require("body-parser");
const crypto = require("crypto");
const fs = require("fs");
async function decryptKey(input,output,keyFile){ 
    //* Read Server's Private Key    
    const privateKey = fs.readFileSync(keyFile); 

    //* Get Dictionary of Encryption Keys
    const encDic = JSON.parse(fs.readFileSync(input))
    var enc = Object.keys(encDic)
    var keyDic = {}

    //* Looping through each encryption key to
    //* decrypt with RSA
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
    var myjson = JSON.stringify(keyDic)
    fs.writeFileSync(output, myjson);
    console.log(`Decrypted file written to ${output}`);
}
module.exports = {decryptKey}
