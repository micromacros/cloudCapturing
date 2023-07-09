const fs = require('fs');

function delFile(directory,exception){
  const path = directory;
  var files = fs.readdirSync(path);
  for(var i = 0;i<files.length;i++){
    var file = path+files[i];
    console.log(file,exception)
    if(file!=exception){
      try {
        fs.unlinkSync(file);
        console.log("File removed:", files[i]);
      } catch (err) {
          console.log(err)
      }
    }
  }
}
module.exports = delFile