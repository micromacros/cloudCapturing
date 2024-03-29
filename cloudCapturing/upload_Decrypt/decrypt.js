const fs = require("fs");
var decAlgo = require('./decAlgo');
var delFile = require('./delFile.js')
const verify = require('./verify.js')

//* NEW NAME FUNCTION (to remove enc algo from name)
function newName(inputFile,outputFile){
    var file = inputFile.split('/')
    var fileName = file[file.length-1]
    var filenameLst = fileName.split('.')
    var ext = filenameLst[filenameLst.length-1]
    var encList = (filenameLst[0].split('__'))
    var newName = ''
    for(var i=0;i<(encList.length-1);i++){
        if(i == 0 ){
            newName += encList[i]
        }else{
            newName += '__'+ encList[i]
        }
    }
    newName += '.' + ext
    outputFile += newName
    console.log(outputFile)
    return outputFile
}

//* GET LIST OF ALGORITHMS FROM FILENAME (eg. videofile-aes-des.mp4 -> [aes,des])
function getDec(inputFile){
    var file = inputFile.split('/')
    var fileName = file[file.length-1]
    var filenameLst = fileName.split('.')
    var encList = (filenameLst[0].split('__'))
    encList.splice(0,1)
    return encList.reverse();
}

//* MAIN DECRYPTION FUNCTION
async function decrypt(inputFile,outputFile,keyFile,pubKey,callback) {
    //* Get the encryption layers from the file name
    var enc =  getDec(inputFile)
    //* Get the key dictionary
    const keyDic = JSON.parse(fs.readFileSync(keyFile))
    //* Start decryption
    var newoutputFile = newName(inputFile,outputFile)
    //* Decrypt according to last algorithm to encrypt to first
    var time = 1000
    fs.stat(inputFile, (err, stats) => {
      if (!err) {
        var fileSize = stats.size
        time = 700*Math.ceil(fileSize/10000000)
        console.log(time)
      }
    })
    await new Promise((resolve) => setTimeout(resolve, 100));

    //* Loop through encryption algorithms
    for (let i = 0; i < enc.length; i++) {
        if(enc[i] == 'des'){
            //? Des key is stored in plaintext

            var key = keyDic[enc[i]]
        }else{
            //? The other keys are stored as Buffer but in plain text, need to change it back to buffer

            var key = Buffer.from(keyDic[enc[i]].data)
        }
        //* Decrypting with said algorithm
        decAlgo[enc[i]].decrypt(inputFile, newoutputFile, key);
        //* Writing new file name
        var inputFile = newName(inputFile,outputFile)
        var newoutputFile = newName(inputFile,outputFile)
        await new Promise((resolve) => setTimeout(resolve, time));
    }
    var sig = fs.readFileSync('./upload_Decrypt/sig/sign.sig')
    console.log('*****Decrypted File is written in '+ inputFile)

    //* Deleting the videos, keys and signatures
    delFile(outputFile,inputFile)
    delFile('./upload_Decrypt/public/encryptedFiles/','')
    delFile('./upload_Decrypt/key/','')
    delFile('./upload_Decrypt/sig/', '')


    var video = fs.readFileSync(inputFile);
    //* Check if video is legitimate with signature
    if(verify(video,sig,pubKey)){
        return callback(true, inputFile)
    }else{
        delFile('./upload_Decrypt/public/decryptedFiles/','')
        delFile('./upload_Decrypt/public/uploads/','')
        console.log('no file saved cz sus')
        return (false,null)
    }
}
module.exports = decrypt
