const fs = require('fs');
const crypto = require('crypto');

async function verify(input,signature,keyFile){
    const publicKey = fs.readFileSync(keyFile);
    const videoFile = fs.readFileSync(input)
    
    const hash = crypto.createHash('sha256').update(videoFile).digest();
    const signatureData = fs.readFileSync(signature).toString();
    const verify = crypto.createVerify('RSA-SHA256');
    verify.write(hash);
    // Verify the signature
    const isVerified = verify.verify(publicKey, signatureData, 'base64');
    // console.log('Verification result:', isVerified);
    return isVerified;


    // let data = Buffer.alloc(0)
    // const readableStream = fs.createReadStream(input)

    // readableStream.on('data', (chunk) => {
    //     // Concatenate each chunk of data to the existing data buffer
    //     data = Buffer.concat([data, chunk]);
    // });

        
    // readableStream.on('error', (err) => {
    //     // Error occurred while reading the file
    //     console.error('Error reading the file:', err);
    // });

    // readableStream.on('end', () => {
    //     console.log('Finished reading the file.');
    // })

}
module.exports = verify; 