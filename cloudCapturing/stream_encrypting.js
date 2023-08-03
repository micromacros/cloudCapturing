const cryptoFunctions = require("./stream_encryption/streamEncrypt_cryptoFunction")
const fs = require('fs')
const path = require('path')
var delFile = require('./stream_encryption/model/delFile')
const axios = require('axios')

const crypto_process = async (proxyRes, decryptedFile, callback) => {

    // get list of encryptions
    const encryptionListFile = './stream_encryption/encryption-list/encryptionLst.txt'
    axios.get('https://creamsecurity.cloud/api/encryption-list/IT')
    .then(response => {
      // Handle the response data
      const data = response.data
      console.log(data);
      const dataList = data.split(',')
      var newData = ''
      for (i = 0; i <dataList.length; i++){
        if (dataList[i] == 'AES-256'){
          newData += 'aes'
        }
        if (dataList[i] == 'Triple-DES'){
          newData += "des"
        }
        if (dataList[i] == 'ChaCha20'){
          newData += "cha"
        }
        if (dataList[i] == 'Blowfish'){
          newData += "bfe"
        }
        if (i != dataList.length-1){
          newData += ','
        }

        fs.writeFileSync(encryptionListFile, newData)
      }
    }).catch(error => {
        console.error(err);
    })



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

    //* Create the directory for the above file directory
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
                        //* generate digital signature
                        console.log('generating signature...')
                        await cryptoFunctions.signFile(filePath, serverPrivateKey, async (err, signatureFilePath) => {
                            if (err) {
                                console.log(err)
                            }
                            else{
                                var fileSigPath = signatureFilePath 
                                var fileSigData = fs.readFileSync(fileSigPath)
        
                                
                                // *encrypt segments
                                console.log('Encrypting segment...')
                                await cryptoFunctions.encryptFile(encryptionListFile, proxyRes, async (err, encryptedBuffer) => {
                                    if (err) {
                                        console.log(err)
                                    }
                                    else{
                                        // *encrypt keyFile with RSA
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
