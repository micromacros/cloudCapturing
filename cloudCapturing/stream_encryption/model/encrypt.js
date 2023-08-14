const fs = require("fs");
const path = require('path')
const async = require('async')

var encAlgo = require('../encryptions/encAlgo.js')
var delFile = require('./delFile.js')


function newName(inputFile,outputFile,enc){
  var file = inputFile.split('/')
  var fileName = file[file.length-1]
  var filenameLst = fileName.split('.')
  var ext = filenameLst[filenameLst.length-1]
  var newName = ''
  for(var i=0;i<(filenameLst.length-1);i++){
    if(file[2]=='uploads'){
      newName += filenameLst[i].replace('__','')
    }else{
      newName += filenameLst[i]
    }
  }
  newName += '-'+enc + '.' + ext
  outputFile += newName
  return outputFile
}


const loopAlgo = async function (filePath, outputFilePath, enc, callback) {
  var newoutputFile = newName(filePath,outputFilePath,enc[0])
  var inputFile = filePath

  for (let i = 0; i < enc.length; i++) {
    console.log(enc[i])
    await encAlgo[enc[i]].encrypt(inputFile, newoutputFile, '');
    var inputFile = newName(inputFile,outputFilePath,enc[i])
    var newoutputFile = newName(inputFile,outputFilePath,enc[i+1])
    await new Promise((resolve) => setTimeout(resolve, 50));
  }

  return callback(inputFile)

}

async function encrypt(inputFileStream,encFile, callback) {
  var enc = fs.readFileSync(encFile).toString().split(',')
  var filename = inputFileStream.headers.filename
  var filenameWOExt = path.parse(filename).name
  
  var filePath = `./stream_encryption/public/unencryptedFile/${filename}`
  var outputFilePath = `./stream_encryption/public/encryptedFiles/${filenameWOExt}/` 
  fs.mkdir(outputFilePath, { recursive: true}, (err) => {
    if (err) {
      console.log(err);
      return;
    }
  })

  // fs.writeFile()
  const keys = JSON.parse(fs.readFileSync('./key/key.bin'));
  for (var algoKey in keys) {
    for (var algo in enc){
      if (algo == algoKey){
        break
      }
      keys[algoKey] = ''
      const myjson = JSON.stringify(keys)
      fs.writeFileSync('./key/key.bin',myjson)
    }
  }
  

  loopAlgo(filePath, outputFilePath, enc, (inputFile) => {
    let data = Buffer.alloc(0); // Initialize an empty buffer

    const readableStream = fs.createReadStream(inputFile);
    
    readableStream.on('data', (chunk) => {
      // Concatenate each chunk of data to the existing data buffer
      data = Buffer.concat([data, chunk]);
    });
    
    readableStream.on('end', () => {
      // End of the stream, all data has been read
      console.log('Finished reading encrypted file.');
      // console.log(data)
      console.log('encrypted data is being returned...')
      return callback(null, data)
      // console.log('Data:', data.toString()); // Use data as needed
    });


    readableStream.on('error', (err) => {
      // Error occurred while reading the file
      console.error('Error reading the file:', err);
    });


  })



}
module.exports = encrypt
