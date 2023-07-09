const crypto = require("crypto");
const fs = require("fs");

// To create neccesary folders
function mkdirFN(dir){
  if (!fs.existsSync(dir)){
    fs.mkdirSync(dir);
  }
}
var keygen = {
    rsa: function(){
        mkdirFN('./key/server-private-key')
        mkdirFN('./key/server-public-key')
        
        // Public/Private key generation
        console.log("Generating new RSA key pair...");
        
        const { publicKey, privateKey } = crypto.generateKeyPairSync("rsa", {
          modulusLength: 2048,
        });
        
        fs.writeFileSync("./key/server-private-key/private_key.pem", privateKey.export({ type: "pkcs1", format: "pem" }));
        fs.writeFileSync("./key/server-public-key/public_key.pem", publicKey.export({ type: "pkcs1", format: "pem" }));
        
        console.log("New RSA key pair generated and saved to PEM files.");
    },
    ecc: function(){
        
    }
}
module.exports = keygen;