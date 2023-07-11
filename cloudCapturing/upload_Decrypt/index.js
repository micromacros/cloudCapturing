const express = require('express');
var serveStatic = require('serve-static');
const app = express();
var path = require("path");
var multer = require('multer')
var cors = require('cors');//Just use(security feature)
app.options('*',cors())
const bodyParser = require('body-parser');	
//create dir
const fs = require("fs");
function mkdirFN(dir){
  if (!fs.existsSync(dir)){
    fs.mkdirSync(dir);
  }
}
// mkdirFN('./decryptedFiles')
// mkdirFN('./encryptedFiles')
// mkdirFN('./public')
// app.use(cors(corsOptions))
app.use(cors())
app.use(serveStatic(__dirname + '/public')); 

app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }));
//encryptions
var rsalol= require('./keyGen.js');



app.get('/', (req, res) => {
  res.send('Hello, World!');
});

const port = process.env.PORT || 8035;
app.listen(port, () => {
  console.log('NEWW Web App Hosted at http://localhost:%s', port);
});

let storage = multer.diskStorage({
	destination: function (req, file, callback) {
		console.log(file)
		callback(null,"./public/encryptedFiles")
	},
	filename: function (req, file, cb) {
		req.filename = file.originalname
		cb(null, req.filename);

	}
});
let upload = multer({
	storage: storage, limits: { fileSize: 5000 * 1024 * 1024 }
});//limits check if he file size is equal to or below 5mb

function encrypt(enc,input,output,key){
	const crypts = {
		'aes':encAlgo.aes.encryptAES(input,output,key),
		'blowfish':encAlgo.blowfish.encryptBF(input,output),
		'chacha':encAlgo.chacha.encryptCHA(input,output,key),
		'des':encAlgo.des.encryptDES(input,output,key)
	}
	
}

app.get('/getkey',function (req, res) {
	console.log(req.body.key)
	file_path = './client/public_key.pem' 
	fs.writeFileSync(file_path,req.body.key)
	let ipaddr = req.socket.remoteAddress;
	console.log(ipaddr)
  	rsalol();
	var publicKey = fs.readFileSync("./public-key/public_key.pem").toString();
	console.log(publicKey)
	res.status(200).send(publicKey)
});

app.get('/getencryption',function (req, res) {
  var encryptionLst = fs.readFileSync('./encryption.txt').toString()
  console.log(encryptionLst)
  res.send(encryptionLst)
});
var rsaenc = require('./rsaenc.js')
const decrypt = require('./decrypt.js');
const verify = require('./verify.js');
const delFile = require('./delFile.js')
app.post('/getVideo',upload.single('file'),function (req, res) {
    // delFile('./public/encryptedFiles/',req.filename)
	delFile('./public/decryptedFiles/','')
	var pubKey ='./client/public_key.pem'
	var privKey ='./private-key/private_key.pem'
	var encKey = req.body.Key
	key = rsaenc.decryptKey(encKey,privKey)
	var keySig = req.body.Key_Signature
	var signature = req.body.Signature
	fs.writeFileSync('./key+sigs/sign.sig',signature)
	var uploadFile = req.body.FileInformation
	var uploadSig = req.body.Upload_Signature
	if (verify(key,keySig,pubKey) == true&&verify(uploadFile,uploadSig,pubKey)==true){
		fs.writeFileSync('./key+sigs/key.bin', key);
		fs.writeFileSync('./public/uploads/upload.bin', uploadFile);
		// Decrypt
		const keyDic = './key+sigs/key.bin'
		const path = './public/encryptedFiles/';
		var files = fs.readdirSync(path);
		var file = path+files[0];
		var inputFile = file
		var outputFile = './public/decryptedFiles/'
		if(decrypt(inputFile,outputFile,keyDic)){
			res.status(201).send('yay')
		}else{
			res.status(500).send('authfail')
		}
	}else{
		res.status(500).send('authfail')
	}
});
app.post('/getFiles',function (req, res) {
});
app.post('/login',function (req, res) {
	var privkey = './private-key/private_key.pem'
	var encPwd = req.body.pwd
	var encUsr = req.body.user
	// just put wtv sql shit idk but thats basically it hehe
	if (rsaenc.decryptText(encUsr,privkey)=='pebis' && rsaenc.decryptText(encPwd,privkey) == 'pebis'){
		res.status(200).send('yay')
	}else{
		res.status(404).send('wronglol')
	}
});
app.get('/local_software/get-video',function (req, res) {
	APIlink = req.body.API_Link
});
//GET
// const userActiona = async () => {
//   const response = await fetch('http://example.com/movies.json');
//   const myJson = await response.json(); //extract JSON from the http response
//   // do something with myJson
// }


//POST
// const userAction = async () => {
//   const response = await fetch('http://example.com/movies.json', {
//     method: 'POST',
//     body: myBody, // string or object
//     headers: {
//       'Content-Type': 'application/json'
//     }
//   });
//   const myJson = await response.json(); //extract JSON from the http response
//   // do something with myJson
// }