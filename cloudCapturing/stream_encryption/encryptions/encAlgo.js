//all the encryptions here
const crypto = require('crypto');
const fs = require('fs');

var bfe = {
    encrypt: async function (inputFile, outputFile,key) {
        if (key == null || key == ''){
            key = crypto.randomBytes(32);
            var keyobj = JSON.parse(fs.readFileSync('./key/key.bin'));
            keyobj.bfe = key
            const myjson = JSON.stringify(keyobj)
            fs.writeFileSync('./key/key.bin',myjson)
            //console.log(`####New Blowfish key generated and saved to key.bin`)
        }
        let cipher = crypto.createCipheriv('bf-ecb', key, '');
        let input = fs.createReadStream(inputFile);
        let output = fs.createWriteStream(outputFile);
        input.pipe(cipher).pipe(output).on('finish', () => {
            //console.log(`####Encrypted BlowFish file written to ${outputFile}`);
        });
    },
};
var aes = {
    encrypt: async (inputFile, outputFile, key) => {
        if (key == null || key == ''){
            //create key
            key = crypto.randomBytes(32);
            var keyobj = JSON.parse(fs.readFileSync('./key/key.bin'));

            // write key into key.bin file
            keyobj.aes = key
            const myjson = JSON.stringify(keyobj)
            fs.writeFileSync('./key/key.bin',myjson)
        }
        const readStream = fs.createReadStream(inputFile);
        const writeStream = fs.createWriteStream(outputFile);
        
        // Creating cipher object
        const cipher = crypto.createCipher('aes-256-cbc', key);
        // var iv = crypto.randomBytes(16)
        // const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);

        // Encrypting the file stream into a new output file
        readStream.pipe(cipher).pipe(writeStream).on('finish', async () => {
          console.log('AES Encryption completed')
          return
        });
    },
};
var cha = {
    encrypt: async (inputFile, outputFile, key) => {
        if (key == null || key == ''){
            //create key
            key = crypto.randomBytes(32);
            var keyobj = JSON.parse(fs.readFileSync('./key/key.bin'));

            // write key into key.bin file
            keyobj.cha = key
            const myjson = JSON.stringify(keyobj)
            fs.writeFileSync('./key/key.bin',myjson)

        }
        const readStream = fs.createReadStream(inputFile);
        const writeStream = fs.createWriteStream(outputFile);

        // creating cipher object
        const cipher = crypto.createCipher("chacha20", key);
        // var iv = crypto.randomBytes(16)
        // const cipher = crypto.createCipheriv("chacha20", key, iv);

        // encrypting the file stream and writing into new output file
        readStream.pipe(cipher).pipe(writeStream).on('finish', () => {
            console.log('chacha20 Encryption completed')
            return
          });
    },
};
var des = {
    encrypt: async function(inputFile, outputFile, key) {
        if (key == null || key == ''){
            // create key
            key = crypto.randomBytes(24).toString('hex');
            var keyobj = JSON.parse(fs.readFileSync('./key/key.bin'));

            // write key into file
            keyobj.des = key
            const myjson = JSON.stringify(keyobj)
            fs.writeFileSync('./key/key.bin',myjson)
            //console.log(`####New DES key generated and saved to key.bin`)
        }
        const CHUNK_SIZE = 64 * 1024;
        const inputStream = fs.createReadStream(inputFile, { highWaterMark: CHUNK_SIZE });
        const outputStream = fs.createWriteStream(outputFile);

        const md5Key = crypto.createHash('md5').update(key).digest('hex').substr(0, 24);
        // creating cipher object
        const cipher = crypto.createCipheriv('des-ede3', md5Key, '');
        // cipher.setAutoPadding(false); // Disable automatic padding

        // encrypting file stream and write into new output file
        inputStream.on('data', async (chunk) => {
            const encryptedChunk = cipher.update(chunk);
            outputStream.write(encryptedChunk);
        });

        inputStream.on('end', async () => {
            const finalChunk = cipher.final();
            outputStream.write(finalChunk);
            outputStream.end();
            console.log('DES Encryption completed')
            return

        });
    },
}
module.exports = {bfe,aes,cha,des}