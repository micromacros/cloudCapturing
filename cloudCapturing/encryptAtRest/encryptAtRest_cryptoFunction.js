const fs = require('fs')
const encrypt = require('./model/encrypt.js');
const sign = require('./model/sign.js');
const keyGen = require('./encryptions/keyGen.js');
const rsaEnc = require('./encryptions/rsaEnc.js');


const cryptoFunctions = {

    //* Function for Encrypting File
    encryptFile: async (encryptionList, unencryptedFile, outputFilePath, filename, callback) => {
        // const encryptionList = encryptionList // list of encryption algorithms'./key/encryptionLst.txt'
        const inputFile = unencryptedFile; // unencrypted file
        // const outputFile = outputFile; // encrypted file stream
        encrypt(inputFile,encryptionList,outputFilePath,filename, (err, encryptedFileStream) => {
            if (err) {
                console.log('Error encrypting stream')
                return callback(err, null)
            }
            else{
                return callback(null, encryptedFileStream);
            }
        })

    },

    //* Function to Sign hash
    signFile:async (unencryptedFile, serverPrivateKey, filename, callback) => {
        var inputFile = unencryptedFile; // unencrypted File
        var privKey = serverPrivateKey; // Private Key created by streaming service
        sign(inputFile, privKey, filename, (err, signature) => {
            if (err) {
                console.log('Error in creating signature')
                console.log(err)
                return callback(err, null)
            }
            else {
                console.log('Signature created');
                return callback(null, signature)
            }
        });     

    },

    //* Function to Encrypt Key File
    keyEncryption: async (keyFile, encryptedKeyFile, clientPublicKey, callback) => {
        var input = keyFile // unencrypted key file
        var output = encryptedKeyFile // encrypted key file path
        var keyfile = clientPublicKey // Public Key of User
        rsaEnc.encryptKey(input,output,keyfile, () => {
            return callback()
        })

    },




}

module.exports = cryptoFunctions