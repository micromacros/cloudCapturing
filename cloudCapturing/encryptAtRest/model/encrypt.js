const fs = require("fs");
const path = require('path')
const async = require('async')

var encAlgo = require('../encryptions/encAlgo.js')
var delFile = require('./delFile.js')

//* Function to create a new name for file with the encryption that is being performed
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
  //* Adding the encryption applied to the name
  newName += '-'+enc + '.' + ext
  outputFile += `/${newName}`
  return outputFile
}

//* Function to loop through the specified algorithms 
const loopAlgo = async function (filePath, outputFilePath, enc, filename, callback) {
  //* Creating the new name for first encryption
  var newoutputFile = newName(filePath,outputFilePath,enc[0])
  var inputFile = filePath
  //* Looping across the specified encryption algorithms
  for (let i = 0; i < enc.length; i++) {
    console.log(`Encrypting with ${enc[i]}...`)
    //* Encrypting the file
    await encAlgo[enc[i]].encrypt(inputFile, newoutputFile, filename, '');
    //* Changing the new input and output file names
    var inputFile = newName(inputFile,outputFilePath,enc[i])
    var newoutputFile = newName(inputFile,outputFilePath,enc[i+1])
    //* Timeout to give enough time to complete encryption for each file before moving 
    //* on to next algorithm
    await new Promise((resolve) => setTimeout(resolve, 1300));
  }

  //* Returning the final encrypted file path
  return callback(inputFile)

}

//* Main Function
async function encrypt(inputFile,encFile,outputFilePath,filename, callback) {
  //* Putting encryption list into a list
  var enc = fs.readFileSync(encFile).toString().split(',')

  fs.mkdir(outputFilePath, { recursive: true}, (err) => {
    if (err) {
      console.log(err);
      return;
    }
  })

  const keys = JSON.parse(fs.readFileSync(`./key/atRestKeyFile/key.bin`));
  //* Checking the keys file to clear encryptions that are not used.
  for (var algoKey in keys) {
    for (var algo in enc){
      if (algo == algoKey){
        break
      }
      keys[algoKey] = ''
      const myjson = JSON.stringify(keys)
      //* Writing into a specific key file for segment
      fs.writeFileSync(`./key/atRestKeyFile/${filename}.bin`,myjson)
    }
  }
  
  //* Run loop Algo function
  loopAlgo(inputFile, outputFilePath, enc, filename, (encryptedFile) => {
    let data = Buffer.alloc(0); // Initialize an empty buffer

    const readableStream = fs.createReadStream(encryptedFile);
    
    //* Convert File into Buffer to send to backend
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
      return callback(err, null)
    });


  })


}
module.exports = encrypt
