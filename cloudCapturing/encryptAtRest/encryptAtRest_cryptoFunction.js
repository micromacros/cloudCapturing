
const fs = require('fs')
const encrypt = require('./model/encrypt.js');
const sign = require('./model/sign.js');
const keyGen = require('./encryptions/keyGen.js');
const rsaEnc = require('./encryptions/rsaEnc.js');

// Encrypt

const cryptoFunctions = {

    // Encrypt
    encryptFile: async (encryptionList, unencryptedFile, outputFilePath, filename, callback) => {
        // const encryptionList = encryptionList // list of encryption algorithms'./key/encryptionLst.txt'
        const inputFile = unencryptedFile; // unencrypted file
        // const outputFile = outputFile; // encrypted file stream
        encrypt(inputFile,encryptionList,outputFilePath,filename, (err, encryptedFileStream) => {
            if (err) {
                console.log('Error encrypting stream')
                console.log(err)
                return callback(err, null)
            }
            else{
                return callback(null, encryptedFileStream);
            }
        })

    },

    // Sign hash
    signFile:async (unencryptedFile, serverPrivateKey, filename, callback) => {
        var inputFile = unencryptedFile; //unencrypted File
        // var sigFile = sigFile; //Signature File (or File Stream?) './public/signature/video.sig'
        var privKey = serverPrivateKey; // Private Key created by streaming service
        sign(inputFile,privKey, filename, (err, signature) => {
            if (err) {
                console.log('Error in creating signature')
                console.log(err)
                return callback(err, null)
            }
            else {
                console.log('Signature created');
                // console.log(signature)
                return callback(null, signature)
            }
        });     

        //          ORIGINAL
        // var inputFile = './public/uploads/2p1-1683363340433.mkv';
        // var sigFile = './public/signature/video.sig'
        // var privKey = './key/private-key/private_key.pem'
        // // sign(inputFile,sigFile,privKey)        
    },

    //Encrypt Keys
    keyEncryption: async (keyFile, encryptedKeyFile, clientPublicKey, callback) => {
        var input = keyFile // unencrypted key file
        var output = encryptedKeyFile // encrypted key file path
        var keyfile = clientPublicKey // Public Key of User
        rsaEnc.encryptKey(input,output,keyfile, () => {
            return callback()
        })

        //          ORIGINAL
        // var input = './key/key.bin'
        // var output = './key/enc.bin'
        // var keyfile = './key/public-key/public_key.pem'
        // // rsaEnc.encryptKey(input,output,keyfile)
    },


    // Decrypt
    // decryptFile: (key, encryptedFile, outputFile) => {
    //     const key = key;    //encryption symmetric key
    //     const inputFile = encryptedFile; //encrypted file
    //     const outputFile = outputFile; // decrypted file stream
    //     decrypt(inputFile, outputFile, key);

    //     //          ORIGINAL
    //     // const keyDic = './key/key.bin'
    //     // const path = './public/encryptedFiles/';
    //     // var files = fs.readdirSync(path);
    //     // var file = path+files[0];
    //     // var inputFile = file
    //     // var outputFile = './public/decryptedFiles/'
    //     // decrypt(inputFile,outputFile,keyDic)
    // },



    // Verify Hash
    // verifyHash: (decryptedFile, sigFile, clientPublicKey) => {
    //     var inputFile = decryptedFile //decrypted file
    //     var sigFile = sigFile //signature file
    //     var pubKey = clientPublicKey //public key of streaming service
    //     verify(inputFile,sigFile,pubKey)

    //     //          ORIGINAL
    //     // var inputFile = './public/uploads/2p1-1683363340433.mkv';
    //     // var sigFile = './public/signature/video.sig'
    //     // var pubKey ='./key/public-key/public_key.pem'
    //     // // verify(inputFile,sigFile,pubKey)
    // },

    // Key generation
    keyGen: () => {
        keyGen.rsa()
    },



    // //Decrypt Keys
    // keyDecryption: (encryptedKeyFile, decryptedKeyFile, clientPrivateKey) => {
    //     var input = encryptedKeyFile //encrypted key file
    //     var output = decryptedKeyFile // decrypted key file
    //     var keyfile = clientPrivateKey // private key of user
    //     rsaDec.decryptKey(input,output,keyfile)


    //     //          ORIGINAL
    //     // var input = './key/enc.bin'
    //     // var output = './key/newkey.bin'
    //     // var keyfile = './key/private-key/private_key.pem'
    //     // rsaDec.decryptKey(input,output,keyfile)
    // }


}

module.exports = cryptoFunctions