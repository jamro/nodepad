const path = require('path');
const Busboy = require('busboy');
const fs = require('fs');
const fsPromises = require('fs').promises;

const AdmZip = require('adm-zip');

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
    this.uploadFilePath = path.resolve(this.workspace, 'content-' + Math.round(Math.random()*0xffffff).toString(16) + '.zip');
    this.tmpPath = path.resolve(this.workspace, 'tmp-' + Math.round(Math.random()*0xffffff).toString(16));
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
    fs.readdirSync(this.workspace)
      .filter(f => f.match(/content-[0-9a-z]+\.zip/) ||  f.match(/tmp-[0-9a-z]+/))
      .forEach(f => {
        try {
          fs.rmdirSync(path.resolve(this.workspace, f), { recursive: true });
        } catch (err) { } // eslint-disable-line no-empty
        try {
          fs.unlinkSync(path.resolve(this.workspace, f));
        } catch (err) { }  // eslint-disable-line no-empty
      });
  }

  upload(req) {
    return new Promise((resolve, reject) => {
      this.busboy = new Busboy({ 
        headers: req.headers,
        highWaterMark: 2 * 1024 * 1024, // Set 2MiB buffer
      });
      this.req = req;
      
      
      this.busboy.on('file', (fieldname, file) => {
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
        this.status = 'uploaded';
        setTimeout(resolve, 100);
      });

      this.busboy.on('error', (err) => {
        this.onUploadError(err);
        reject(err);
      });
      req.pipe(this.busboy);
    });
  }

  async extract() {
    if(!fs.existsSync(this.uploadFilePath)) {
      throw new Error('nothing to extract');
    }
    this.status = 'extracting';
    if(fs.existsSync(this.tmpPath)) {
      fs.rmdirSync(this.tmpPath, {recursive: true});
    }
    fs.mkdirSync(this.tmpPath);
    let zip;
    try {
      zip = new AdmZip(this.uploadFilePath);
    } catch(err) {
      this.status = 'extract error';
      throw err;
    }
    await new Promise((resolve, reject) => {
      zip.extractAllToAsync(this.tmpPath, true, (err) => {
        if(err) {
          console.log(err);
          this.log(err);
          this.status = 'extract error';
          console.log({s: this.status});
          return reject(err);
        }
        this.status = 'extracted';
        resolve();
      });
    });
    
    if(fs.existsSync(this.uploadFilePath)) {
      fs.unlinkSync(this.uploadFilePath);
    }
  }

  async install() { 
    if(!fs.existsSync(this.tmpPath)) {
      throw new Error('nothing to install');
    }
    const binTmpPath = path.resolve(this.workspace, 'tmp-bin' + Math.round(Math.random()*0xffffff).toString(16));
    const binPath = path.resolve(this.workspace, 'bin');
    this.status = 'installing';
    try {
      await fsPromises.rename(binPath, binTmpPath);
      await new Promise(resolve => setTimeout(resolve, 50));
      await fsPromises.rename(this.tmpPath, binPath);
      await fsPromises.rmdir(binTmpPath, { recursive: true });
      this.stop();
    } catch(err) {
      this.log(err);
      this.status = 'install error';
      return;
    }
    this.status = 'deployed';
  }
  
}

module.exports = DeploymentJob;