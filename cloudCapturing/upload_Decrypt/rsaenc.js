const { json } = require("body-parser");
const crypto = require("crypto");
const fs = require("fs");
var rsa = {
    encryptKey: function(input,output,pubkeyFile){
        const publicKey = fs.readFileSync(pubkeyFile);
        const plainText = fs.readFileSync(input);
        const urmom = {key:plainText}
        const myjson = JSON.stringify(urmom)
        const encryptedData = crypto.publicEncrypt(
            {
            key: publicKey,
            padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
            oaepHash: "sha256",
            },
            // plainText
            myjson
        );
        fs.writeFileSync(output, encryptedData);
        console.log(`Encrypted file written to ${output}`);
    },
    decryptKey: function(input,keyFile){     
        const privateKey = fs.readFileSync(keyFile);   
        const encDic = JSON.parse(input)
        console.log(encDic)
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
        console.log(keyDic)
        var myjson = JSON.stringify(keyDic)
        return myjson
    },
    decryptText: function(input,privatekeyFile){
        encText = Buffer.from(input)
        const privateKey = fs.readFileSync(privatekeyFile);   
        const decryptedData = crypto.privateDecrypt(
            {
                key: privateKey,
                padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
                oaepHash: "sha256",
            },
            encText
        );
        console.log(decryptedData)
        return decryptedData
    },
    encryptText: function(input,pubkeyFile){
        const publicKey = fs.readFileSync(pubkeyFile);
        const encryptedData = crypto.publicEncrypt(
            {
            key: publicKey,
            padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
            oaepHash: "sha256",
            },
            // plainText
            input
        );
        return(encryptedData)
    },
}
module.exports = rsa;