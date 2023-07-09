const decrypt = require('./model/decrypt');
const verify = require('./model/verify');
const rsaDec = require('./model/rsaDec');

const cryptoFunctions = {
    // Decrypt
    decryptFile: async (encryptedFile, outputFile, key, signatureFile, clientPublicKey, callback) => {
        // const key = key;    //encryption symmetric key
        const inputFile = encryptedFile; //encrypted file
        // const outputFile = outputFile; // decrypted file stream
        await decrypt(inputFile, outputFile, key, async (err, decFile) => {
            if (err) {
                console.log(err)
            }
            else{
                var sigFile = signatureFile
                var pubKey = clientPublicKey
                if (await verify(decFile,sigFile,pubKey)){
                    return callback(true, decFile)
                }
                else{
                    return callback(false, null)
                }

            }
        });

    },

    keyDecryption: async (encryptedKeyFile, decryptedKeyFile, clientPrivateKey) => {
        var input = encryptedKeyFile //encrypted key file
        var output = decryptedKeyFile // decrypted key file
        var keyfile = clientPrivateKey // private key of user
        await rsaDec.decryptKey(input,output,keyfile)


        //          ORIGINAL
        // var input = './key/enc.bin'
        // var output = './key/newkey.bin'
        // var keyfile = './key/private-key/private_key.pem'
        // rsaDec.decryptKey(input,output,keyfile)
    }

}

module.exports = cryptoFunctions