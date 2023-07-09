const fs = require('fs');
const path = require('path')

async function delFile(directory){
  const pathToDelete = directory;

  fs.rm(pathToDelete, { recursive: true }, (error) => {
    if (error) {
      console.error('Error removing directory:', error);
    } else {
      console.log(pathToDelete ,' removed successfully.');
    }
  })
}

module.exports = delFile