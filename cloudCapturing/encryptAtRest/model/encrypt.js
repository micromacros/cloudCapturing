const fs = require("fs");
const path = require('path')
const async = require('async')

var encAlgo = require('../encryptions/encAlgo.js')
var delFile = require('./delFile.js')


function newName(inputFile,outputFile,enc){
  // inputFile.split('\\').join('/')
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


const loopAlgo = async function (filePath, outputFilePath, enc, filename, callback) {
  console.log(filePath)
  var newoutputFile = newName(filePath,outputFilePath,enc[0])
  var inputFile = filePath
  console.log(newoutputFile)

  for (let i = 0; i < enc.length; i++) {
    console.log(enc[i])
    await encAlgo[enc[i]].encrypt(inputFile, newoutputFile, filename, '');
    var inputFile = newName(inputFile,outputFilePath,enc[i])
    var newoutputFile = newName(inputFile,outputFilePath,enc[i+1])
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }

  return callback(inputFile)

}

async function encrypt(inputFile,encFile,outputFilePath,filename, callback) {
  var enc = fs.readFileSync(encFile).toString().split(',')
  var filenameWOExt = path.parse(filename).name
  
  // var filePath = `./encryptAtRest/public/unencryptedFile/${filename}`
  fs.mkdir(outputFilePath, { recursive: true}, (err) => {
    if (err) {
      console.log(err);
      return;
    }
  })

  // fs.writeFile()
  const keys = JSON.parse(fs.readFileSync(`./key/atRestKeyFile/key.bin`));
  for (var algoKey in keys) {
    for (var algo in enc){
      if (algo == algoKey){
        break
      }
      keys[algoKey] = ''
      const myjson = JSON.stringify(keys)
      fs.writeFileSync(`./key/atRestKeyFile/${filename}.bin`,myjson)
    }
  }
  
  const inputFileNew = inputFile.split('\\').join('/')

  loopAlgo(inputFileNew, outputFilePath, enc, filename, (encryptedFile) => {
    let data = Buffer.alloc(0); // Initialize an empty buffer

    const readableStream = fs.createReadStream(encryptedFile);
    
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
