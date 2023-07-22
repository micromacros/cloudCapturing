const { json } = require("body-parser");
const crypto = require("crypto");
const fs = require("fs");

//* Encrypting Key File Main Function
function encryptKey(input,output,keyFile ,callback){
    const publicKey = fs.readFileSync(keyFile);
    const keyDic = JSON.parse(fs.readFileSync(input))
    var enc = Object.keys(keyDic)
    var encDic = {}

    //* Looping through algorithm keys to encrypt
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
                key
            );
            encDic[enc[i]]=encryptedData
        }
    }
    var myjson = JSON.stringify(encDic)
    fs.writeFileSync(output, myjson);
    console.log(`Encrypted Key File written to ${output}`);
    return callback()
}
module.exports = {encryptKey}
