const cryptoFunctions = require("./upload_decryption/uploadDecrypt_cryptoFunction")
const fs = require('fs')
const path = require('path')

const delDirectory = (fileDirectory) => {
    const pathToDelete = fileDirectory;

    fs.rm(pathToDelete, { recursive: true }, (error) => {
      if (error) {
        console.error('Error removing directory:', error);
      } else {
        console.log(pathToDelete ,' removed successfully.');
      }
    })
}

const createFileName = async (encFileName, encList, ext) => {
    for (var i = 0; i < encList.length ; i++){
        encFileName += `__${encList[i]}`
    }
    var encFileNameFinal = `${encFileName}${ext}`
    return encFileNameFinal

}

const createDir = async (encFileDirectory) => {
    fs.mkdir(encFileDirectory, { recursive: true}, (err) => {
        if (err) {
          console.log(err);
          return;
        }
    })
}

const decrypt_process = async (proxyReq, encryptedObject, callback) => {

    // console.log(encryptedObject)

    const sigBuffer = Buffer.from(encryptedObject.signaturebuffer.data)
    const encFileBuffer = Buffer.from(encryptedObject.encryptedbuffer.data)
    const encKeyFileBuffer = Buffer.from(encryptedObject.encryptedkeyfilebuffer.data)
    const encryption_list = Buffer.from(encryptedObject.encryptionlist.data)
    const encryption_list_String = encryption_list.toString()
    

    var filename = proxyReq.getHeader('filename')
    var filenameWOExt = path.parse(filename).name
    var ext = path.extname(filename)

    // console.log(sigBuffer)
    // console.log(encFileBuffer)
    // console.log(encKeyFileBuffer)
    // console.log(encryption_list_String)

    var encKeyFilePath = './key/uploadKeyFile/encKey.bin' 

    const encList = encryption_list_String.split(',')
    // console.log(encList)
    var encFileName = ''
    encFileName += filenameWOExt
    var encFileNameFinal = await createFileName(encFileName, encList, ext)


    var encFileDirectory = `./upload_decryption/public/encryptedFiles/${filenameWOExt}/`
    await createDir(encFileDirectory)
    var decFileDirectory = `./upload_decryption/public/decryptedFile/`
    await createDir(decFileDirectory)
    var encFilePath = encFileDirectory+encFileNameFinal

    var sigFilePath = './upload_decryption/public/signature/dec.sig'

    fs.writeFile(sigFilePath, sigBuffer, async (err)=> {
        if (err) {
            console.log(err)
        }
        else{
            console.log('signature file written')
            fs.writeFile(encKeyFilePath, encKeyFileBuffer, async (err) => {
                if (err) {
                    console.log(err)
                }
                else{
                    console.log('Encrypted Key File Written')
                    fs.writeFile(encFilePath, encFileBuffer, async (err) => {
                        if (err) {
                            console.log(err)
                        }
                        else{
                            console.log('Encrypted File Written')
        
                            var decKeyFilePath = './key/uploadKeyFile/key.bin'
                            var serverPrivateKey = './key/server-private-key/private_key.pem'
                            var clientPublicKey = './key/client-public-key/public_key.pem'
                            await cryptoFunctions.keyDecryption(encKeyFilePath, decKeyFilePath, serverPrivateKey)
                            await cryptoFunctions.decryptFile(encFilePath,decFileDirectory,decKeyFilePath,sigFilePath,clientPublicKey, 
                                (fileVerify, decryptedFile) => {
                                    if (fileVerify){
                                        console.log('File Verification pass!')
                                        delDirectory(encFileDirectory)
                                        return callback(null, decryptedFile)
                                    }
                                    else{
                                        console.log('File Verification Failed')
                                        return callback(401, null)
                                    }
                                })
        
                        }
                    })
                }
            })
        
        }
    })

}

module.exports = decrypt_process