const cryptoFunctions = require("./encryptAtRest/encryptAtRest_cryptoFunction")
const fs = require('fs')
const path = require('path')
var delFile = require('./encryptAtRest/model/delFile')


const readFileStream = async (filePath) => {
    // Create a readable stream from the file
    const fileStream = fs.createReadStream(filePath);

    // Handle events emitted by the stream
    fileStream.on('data', (chunk) => {
        // Process each chunk of data
        console.log(`Received ${chunk.length} bytes`);
    });
    
    fileStream.on('end', () => {
        // File reading is complete
        console.log('File reading complete');
        return fileStream
    });
    
    fileStream.on('error', (error) => {
        // Handle any errors that occur during file reading
        console.error('An error occurred:', error);
    });
  
}




const crypto_process = async (segmentPath, outputFilePath, filename, callback) => {
    var filenameWOExt = path.parse(filename).name
    // console.log(filename)
    // console.log(filenameWOExt)
    
    // console.log(req)

    var unencryptFilePath = segmentPath
    // File directory to write encrypted file to
    // get list of encryptions
    const encryptionListFile = './encryptAtRest/encryption-list/encryptionLst.txt'

    // get private key of server
    const serverPrivateKey = './key/server-private-key/private_key.pem'

    //get public key of client
    const clientPublicKey = './key/server-public-key/public_key.pem'

    // generate digital signature
    console.log('generating signature...')
    await cryptoFunctions.signFile(unencryptFilePath,serverPrivateKey, filename, async (err, signatureFilePath) => {
        if (err) {
            console.log(err)
        }
        else{            
            // encrypt segments
            console.log('Encrypting segment...')
            // unencryptedFileStream = await readFileStream(unencryptFilePath)
            await cryptoFunctions.encryptFile(encryptionListFile, unencryptFilePath, outputFilePath,filename, 
                async (err, encryptedBuffer) => {
                    if (err) {
                        console.log(err)
                    }
                    else{
                            
                        // console.log('\n\nencrypted buffer\n\n', encryptedBuffer, '\n\n') 
                        
                        // encrypt keyFile with RSA
                        console.log('Encrypting Key File...')
                        const encryptedKeyFilePath = `./key/atRestKeyFile/encKey_${filename}.bin`
                        const unencryptedKeyFile = `./key/atRestKeyFile/${filename}.bin`
                                                
                        await cryptoFunctions.keyEncryption(unencryptedKeyFile, encryptedKeyFilePath, clientPublicKey, () => {
                            console.log('Key file has been encrypted')
                            fs.rmSync(unencryptedKeyFile)
                            return callback(encryptedBuffer);
                        })
                        // const encryptedKeyFile = fs.readFileSync(encryptedKeyFilePath)
                        
                        // const encryptedKeyFileBuffer = Buffer.from(encryptedKeyFile)
                        // console.log("Key File Buffer: \n\n",encryptedKeyFileBuffer)

                        


                        // fs.readFile('./encryptAtRest/encryption-list/encryptionLst.txt', async (err, data) => {
                        //     if (err) {
                        //         console.log(err)
                                
                        //     }
                        //     else{
                        //         var encryption_list = data

                        //         const encryptedObject = {
                        //             // "signaturebuffer" : fileSigData,
                        //             "encryptedbuffer": encryptedBuffer,
                        //             // "encryptedkeyfilebuffer": encryptedKeyFileBuffer,
                        //             // "encryptionlist": encryption_list
                        //         }
                        //         console.log(encryptedObject)


                        //         // delFile(outputFilePath)
                        //         // fs.unlinkSync(unencryptFilePath)
                        //         // await new Promise((resolve) => setTimeout(resolve, 500));
        
                        //         }
                        // })



                        // console.log(encryptedObject)

            
                    }
            })

        }
    })


}

module.exports = crypto_process