//all the encryptions here
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
        const cipher = crypto.createDecipher('aes-256-cbc', key);
        readStream.pipe(cipher).pipe(writeStream).on('finish', () => {
            //console.log(`####Deypted AES file written to ${outputFile}`);
        });
    },
};
var cha = {
    decrypt: (inputFile, outputFile, key) => {
        const readStream = fs.createReadStream(inputFile);
        const writeStream = fs.createWriteStream(outputFile);
        const cipher = crypto.createDecipher("chacha20", key);
        readStream.pipe(cipher).pipe(writeStream).on('finish', () => {
            //console.log(`####Decrypted ChaCha file written to ${outputFile}`);
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

        inputStream.on('data', (chunk) => {
            const decryptedChunk = decipher.update(chunk);
            outputStream.write(decryptedChunk);
        });

        inputStream.on('end', () => {
            const finalChunk = decipher.final();
            outputStream.write(finalChunk);
            outputStream.end();
            //console.log(`####Decrypted DES file written to ${outputFile}`);
        });
    }
}
module.exports = {bfe,aes,cha,des}