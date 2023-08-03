const fs = require('fs');
const crypto = require('crypto');

//* Verifying signature
function verify(input,signature,keyFile){
    //* Reading Server's public key
    const publicKey = fs.readFileSync(keyFile);

    //* Creating Hash of decrypted file
    const hash = crypto.createHash('sha256').update(input).digest();
    const verify = crypto.createVerify('RSA-SHA256');
    verify.write(hash);
    //* Verify the signature
    const isVerified = verify.verify(publicKey, signature.toString(), 'base64');
    console.log('Verification result:', isVerified);
    return isVerified
}
module.exports = verify; 