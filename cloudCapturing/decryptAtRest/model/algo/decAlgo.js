//all the decryptions here
const crypto = require('crypto');
const fs = require('fs');

var bfe = {
    decrypt:function (inputFile, outputFile,key) {
      let cipher = crypto.createDecipheriv('bf-ecb', key, '');
      let input = fs.createReadStream(inputFile);
      let output = fs.createWriteStream(outputFile);
      input.pipe(cipher).pipe(output).on('finish', () => {
        //console.log(`####Decrypted BlowFish file written to ${outputFile}`);
      });
    },
};
var aes = {
    decrypt: (inputFile, outputFile, key) => {
        const readStream = fs.createReadStream(inputFile);
        const writeStream = fs.createWriteStream(outputFile);
        // const iv = Buffer.alloc(16, 0);
        const cipher = crypto.createDecipher('aes-256-cbc', key);
        // const cipher = crypto.createDecipheriv('aes-256-cbc', key,iv);
        readStream.pipe(cipher).pipe(writeStream).on('finish', () => {
            console.log(`AES File Decryption Completed`);
            console.log(`File ${outputFile} written and stored`)
        });
    },
};
var cha = {
    decrypt: (inputFile, outputFile, key) => {
        const readStream = fs.createReadStream(inputFile);
        const writeStream = fs.createWriteStream(outputFile);
        // const iv = Buffer.alloc(16, 0);
        const cipher = crypto.createDecipher("chacha20", key);
        // const cipher = crypto.createDecipheriv("chacha20", key, iv);        
        readStream.pipe(cipher).pipe(writeStream).on('finish', () => {
            console.log(`ChaCha20 File Decryption Completed`);
            console.log(`File ${outputFile} written and stored`)
        });
    },
};
var des = {
    // Decrypt a media file with 3DES
    decrypt: function(inputFile, outputFile, key) {
        const CHUNK_SIZE = 64 * 1024;
        const inputStream = fs.createReadStream(inputFile, { highWaterMark: CHUNK_SIZE });
        const outputStream = fs.createWriteStream(outputFile);

        const md5Key = crypto.createHash('md5').update(key).digest('hex').substr(0, 24);
        const decipher = crypto.createDecipheriv('des-ede3', md5Key, '');
        // decipher.setAutoPadding(false);

        inputStream.on('data', (chunk) => {
            const decryptedChunk = decipher.update(chunk);
            outputStream.write(decryptedChunk);
        });

        inputStream.on('end', () => {
            const finalChunk = decipher.final();
            outputStream.write(finalChunk);
            outputStream.end();
            console.log(`DES File Decryption Completed`);
            console.log(`File ${outputFile} written and stored`)
        });
    }
}
module.exports = {bfe,aes,cha,des}