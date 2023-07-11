const cryptoFunctions = require("./stream_encryption/streamEncrypt_cryptoFunction")
const fs = require('fs')
const path = require('path')
var delFile = require('./stream_encryption/model/delFile')


const crypto_process = async (proxyRes, decryptedFile, callback) => {

    // get list of encryptions
    const encryptionListFile = './stream_encryption/encryption-list/encryptionLst.txt'

    // get private key of server
    const serverPrivateKey = '../cloud-dashboard/Cloud-Page/Backend/RSA_Cloud/private_key.pem'

    //get public key of client
    var ipaddr = proxyRes.headers.ipaddr
    const clientPublicKey = `../cloud-dashboard/Cloud-Page/Backend/RSA_Local_Software/${ipaddr}/public_key.pem`

    var filename = proxyRes.headers.filename
    var filenameWOExt = path.parse(filename).name

    // File Path to write unencrypted file data to
    var filePath = `./stream_encryption/public/unencryptedFile/${filename}`

    // File directory to write encrypted file to
    var outputFilePath = `./stream_encryption/public/encryptedFiles/${filenameWOExt}/` 

    // Create the directory for the above file directory
    fs.mkdir(outputFilePath, { recursive: true}, (err) => {
        if (err) {
            console.log(err);
            return;
        }
    })



    try {
        fs.readFile(decryptedFile, async(err, data) => {
            if (err) {
                console.log(err)
                return
            }
            else{
                fs.writeFile(filePath,data, async (err) => {
                    if (err) {
                        console.log(err)
                        return
                    }
                    else{
                        console.log('File is written')
                        // generate digital signature
                        console.log('generating signature...')
                        await cryptoFunctions.signFile(filePath, serverPrivateKey, async (err, signatureFilePath) => {
                            if (err) {
                                console.log(err)
                            }
                            else{
                                var fileSigPath = signatureFilePath 
                                var fileSigData = fs.readFileSync(fileSigPath)
        
                                
                                // encrypt segments
                                console.log('Encrypting segment...')
                                await cryptoFunctions.encryptFile(encryptionListFile, proxyRes, async (err, encryptedBuffer) => {
                                    if (err) {
                                        console.log(err)
                                    }
                                    else{
                                        
                                        // console.log('\n\nencrypted buffer\n\n', encryptedBuffer, '\n\n') 
                                        
                                        // encrypt keyFile with RSA
                                        console.log('Encrypting Key File...')
                                        const encryptedKeyFilePath = './key/encKey.bin'
                                        const unencryptedKeyFile = './key/key.bin'
                                        
                                        
                                        await cryptoFunctions.keyEncryption(unencryptedKeyFile, encryptedKeyFilePath, clientPublicKey)
                                        const encryptedKeyFile = fs.readFileSync(encryptedKeyFilePath)
                                        
                                        const encryptedKeyFileBuffer = Buffer.from(encryptedKeyFile)
                                        // console.log("Key File Buffer: \n\n",encryptedKeyFileBuffer)
        
                                        
        
                                        fs.readFile('./stream_encryption/encryption-list/encryptionLst.txt', async (err, data) => {
                                            if (err) {
                                                console.log(err)
                                                
                                            }
                                            else{
                                                var encryption_list = data
                                                const encryptedObject = {
                                                    "signaturebuffer" : fileSigData,
                                                    "encryptedbuffer": encryptedBuffer,
                                                    "encryptedkeyfilebuffer": encryptedKeyFileBuffer,
                                                    "encryptionlist": encryption_list
                                                }
                                                // console.log(encryptedObject)
                                                delFile(outputFilePath)
                                                fs.unlinkSync(filePath)
                                                // await new Promise((resolve) => setTimeout(resolve, 500));
                        
                                                return callback(encryptedObject);
                                                }
                                        })
        
        
        
                                        // console.log(encryptedObject)
        
                            
                                    }
                                })
        
                            }
                        })
        
        
                    }
                })
        
            }
        })
        // Writing the response data to a file

  
    
    }
    catch (error) {
        console.log(error)
        return
    }

    



}

module.exports = crypto_process