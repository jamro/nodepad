const path = require('path');
const Busboy = require('busboy');
const fs = require('fs');

const UPLOAD_ERROR = 'upload error';

function bytesToSize(bytes) {
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  if (bytes == 0) return '0 Byte';
  const i = parseInt(Math.floor(Math.log(bytes) / Math.log(1024)));
  return Math.round(bytes / Math.pow(1024, i), 2) + ' ' + sizes[i];
}

class DeploymentJob {

  constructor(workspace) {
    this.workspace = workspace;
    this.busboy = null;
    this.status = 'started';
    this.req = null;
    this.file = null;
    this.uploadFilePath = null;
    this.uploadedBytes = 0;
    this.debug = true;
  }

  log(...args) {
    if(this.debug) {
      console.log(...args);
    }
  }

  onUploadError(err) {
    this.log('ERR', err);
    this.status = UPLOAD_ERROR;
    this.stop();
  }

  stop() {
    if(this.req) {
      try {
        this.req.pause();
      } catch(err) {
        this.log(err);
      }
    }
    if(this.file) {
      try {
        this.file.pause();
      } catch(err) {
        this.log(err);
      }
    }
    if(this.uploadFilePath) {
      fs.unlinkSync(this.uploadFilePath);
    }
  }

  upload(req) {
    return new Promise((resolve, reject) => {
      this.busboy = new Busboy({ 
        headers: req.headers,
        highWaterMark: 2 * 1024 * 1024, // Set 2MiB buffer
      });
      this.req = req;
      
      
      this.busboy.on('file', (fieldname, file, filename) => {
        this.uploadFilePath = path.resolve(this.workspace, 'bin', filename);
        this.log('Writing uploaded file to ' + this.uploadFileDir);
        this.file = file;
        file.on('data', (data) => {
          if(this.status === UPLOAD_ERROR) {
            return;
          }
          this.uploadedBytes += data.length;
          this.status = 'uploading (' + bytesToSize(this.uploadedBytes) + ')';
        });
        file.on('error', (err) => {
          this.onUploadError(err);
          reject(err);
        });
        const writeStream = fs.createWriteStream(this.uploadFilePath);
        file.pipe(writeStream);
      });

      this.busboy.on('finish', () => {
        if(this.status === UPLOAD_ERROR) {
          return;
        }
        this.log('Upload completed');
        this.status = 'done';
        setTimeout(resolve, 100);
      });

      this.busboy.on('error', (err) => {
        this.onUploadError(err);
        reject(err);
      });
      req.pipe(this.busboy);
    });
  }
  
}

module.exports = DeploymentJob;