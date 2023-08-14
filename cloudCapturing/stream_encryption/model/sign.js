const fs = require('fs');
const crypto = require('crypto');
const path = require('path')
var delFile = require('./delFile.js');

async function sign (inputFile, keyFile, callback){
    try{
        //* Retrieve Cloud's Private Key
        const privateKey = fs.readFileSync(keyFile);

        //* Read the unencrypted media segment/manifest
        const video = fs.readFileSync(inputFile);

        //* Creating a Hash of the segment/manifest
        const hash = crypto.createHash('sha256').update(video).digest();

        //* Creating Signature object
        const sign = crypto.createSign('RSA-SHA256');
        sign.write(hash);
        sign.end();

        //* Creating the Signature
        const signature = sign.sign(privateKey, 'base64');

        //* Writing the signature into a file
        const sigFilePath = './stream_encryption/public/signature/video.sig'
        fs.writeFileSync(sigFilePath, signature);
        console.log(`Signature File written to ${sigFilePath}`)
        
        return callback(null, sigFilePath);   
    }
    catch (error) {
        console.log(error)
    }

}
module.exports = sign;
