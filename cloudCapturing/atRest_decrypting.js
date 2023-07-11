const cryptoFunctions = require("./decryptAtRest/decryptAtRest_cryptoFunction")
const fs = require('fs')
const path = require('path')

const writeToFile = function(inputFileStream, outputFilePath){
    return new Promise((resolve, reject) => {
        var writeStream = fs.createWriteStream(outputFilePath)
        // inputFileStream.pipe(writeStream)
        
        inputFileStream.on('data', (chunk) => {
            writeStream.write(chunk);
        });
        
        inputFileStream.on('end', () => {
            writeStream.end();
            console.log('File write completed.');
        });
        
        inputFileStream.on('error', (error) => {
            reject(error)
        });
        
        writeStream.on('error', (error) => {
            reject(error)
        });
        
        
        writeStream.on('finish', () => {
            resolve()
        })
    
    })
}

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
    mode = 0o777
    fs.mkdir(encFileDirectory, { recursive: true, mode}, (err) => {
        if (err) {
          console.log(err);
          return;
        }
    })
}

const decrypt_process = async (proxyRes, sigFile, encKeyFile,atRestList, callback) => {


    var filename = proxyRes.headers.filename
    var filenameWOExt = path.parse(filename).name
    var ext = path.extname(filename)

    var encKeyFilePath = encKeyFile 

    const enc = JSON.parse(fs.readFileSync(encKeyFilePath))
    console.log(enc)
    const encList = Object.keys(enc)
    var encFileName = ''
    encFileName += filenameWOExt
    var encFileNameFinal = await createFileName(encFileName, encList, ext)

    var encFileDirectory = `./decryptAtRest/public/encryptedFiles/${filenameWOExt}/`
    await createDir(encFileDirectory)
    var decFileDirectory = `./decryptAtRest/public/decryptedFile/`
    await createDir(decFileDirectory)
    var encFilePath = encFileDirectory+encFileNameFinal

    var sigFilePath = sigFile

    await writeToFile(proxyRes, encFilePath)   
    console.log('Encrypted File Written')

    var decKeyFilePath = './key/uploadKeyFile/key.bin'
    var serverPrivateKey = './key/server-private-key/private_key.pem'
    var clientPublicKey = './key/server-public-key/public_key.pem'
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

        
    
    //             }
    //         })
        
    //     }
    // })

}

module.exports = decrypt_process