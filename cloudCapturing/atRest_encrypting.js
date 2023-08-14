const cryptoFunctions = require("./encryptAtRest/encryptAtRest_cryptoFunction")
const fs = require('fs')
const path = require('path')
var delFile = require('./encryptAtRest/model/delFile')



const crypto_process = async (segmentPath, outputFilePath, filename, callback) => {
    var unencryptFilePath = segmentPath
    // File directory to write encrypted file to
    //* get list of encryptions
    const encryptionListFile = './encryptAtRest/encryption-list/encryptionLst.txt'

    //* get private key of server
    const serverPrivateKey = '../cloud-dashboard/Cloud-Page/Backend/RSA_Cloud/private_key.pem'

    //* get public key of client
    const clientPublicKey = '../cloud-dashboard/Cloud-Page/Backend/RSA_Cloud/public_key.pem'

    //* generate digital signature
    console.log('generating signature...')
    await cryptoFunctions.signFile(unencryptFilePath,serverPrivateKey, filename, async (err, signatureFilePath) => {
        if (err) {
            console.log(err)
        }
        else{            
            //* encrypt segments
            console.log('Encrypting segment...')
            //* unencryptedFileStream = await readFileStream(unencryptFilePath)
            await cryptoFunctions.encryptFile(encryptionListFile, unencryptFilePath, outputFilePath,filename, 
                async (err, encryptedBuffer) => {
                    if (err) {
                        console.log(err)
                    }
                    else{
                        
                        //* encrypt keyFile with RSA
                        console.log('Encrypting Key File...')
                        const encryptedKeyFilePath = `../key_cloudCapturing/atRestKeyFile/encKey_${filename}.bin`
                        const unencryptedKeyFile = `./key/atRestKeyFile/${filename}.bin`
                                                
                        await cryptoFunctions.keyEncryption(unencryptedKeyFile, encryptedKeyFilePath, clientPublicKey, () => {
                            console.log('Key file has been encrypted')
                            fs.rmSync(unencryptedKeyFile)
                            return callback(null, encryptedBuffer);
                        })

            
                    }
            })

        }
    })


}

module.exports = crypto_process