const fs = require('fs');
const crypto = require('crypto');

function verify(input,signature,keyFile){
    const publicKey = fs.readFileSync(keyFile);
    const video = fs.readFileSync(input);
    const hash = crypto.createHash('sha256').update(video).digest();
    const signatureData = fs.readFileSync(signature).toString();
    const verify = crypto.createVerify('RSA-SHA256');
    verify.write(hash);
    // Verify the signature
    const isVerified = verify.verify(publicKey, signatureData, 'base64');
    console.log('Verification result:', isVerified);
}
module.exports = verify; 