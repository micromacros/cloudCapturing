const fs = require("fs");
var decAlgo = require('./algo/decAlgo');
var delFile = require('./delFile')
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
    return outputFile
}
function getDec(inputFile){
    var file = inputFile.split('/')
    var fileName = file[file.length-1]
    var filenameLst = fileName.split('.')
    var encList = (filenameLst[0].split('__'))
    encList.splice(0,1)
    return encList.reverse();
}

async function decrypt(inputFile,outputFile,keyFile, callback) {
    // Get the encryption layers from the file name
    try{
        var enc =  getDec(inputFile)
        // console.log(enc)
        // Get the key dictionary
        const keyDic = JSON.parse(fs.readFileSync(keyFile))
        // console.log(keyDic)
        // Start decryption
        var newoutputFile = newName(inputFile,outputFile)
        // Decrypt according to last algorithm to encrypt to first
        for (let i = 0; i < enc.length; i++) {
            // Gets the needed keys
            if(enc[i] == 'des'){
                // Des key is stored in plaintext
                var key = keyDic[enc[i]]
            }else{
                // The other keys are stored as Buffer but in plain text, need to change it back to buffer
                var key = Buffer.from(keyDic[enc[i]].data)
            }
            decAlgo[enc[i]].decrypt(inputFile, newoutputFile, key);
            var inputFile = newName(inputFile,outputFile)
            var newoutputFile = newName(inputFile,outputFile)
            await new Promise((resolve) => setTimeout(resolve, 1500));
        }
        console.log('*****Decrypted File is written in '+ inputFile)
        delFile(outputFile,inputFile)
        return callback(null, inputFile)
        }
    catch(err){
        console.log(err)
        return callback(err, null)
    }
    // console.log(fs.readFileSync(inputFile).toString())
}
module.exports = decrypt