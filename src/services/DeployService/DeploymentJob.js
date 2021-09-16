const path = require('path');
const winston = require('winston');
const Busboy = require('busboy');
const fs = require('fs');
const fsPromises = require('fs').promises;
const { spawn } = require('child_process');
const ncp = require('ncp').ncp;

const AdmZip = require('adm-zip');
const { EntityNotFoundError } = require('../common/errors');

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

    this.logger = winston.createLogger({
      transports: [
        new winston.transports.Console({silent: true})
      ]
    });
  }

  onUploadError(err) {
    this.logger.error(err);
    this.status = UPLOAD_ERROR;
    this.stop();
  }

  stop() {
    this.logger.debug('Stopping depoyment job');
    if(this.req) {
      try {
        this.req.pause();
      } catch(err) {
        this.logger.error(err);
      }
    }
    if(this.file) {
      try {
        this.file.pause();
      } catch(err) {
        this.logger.error(err);
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
      this.logger.debug('uploading new content...');
      this.busboy = new Busboy({ 
        headers: req.headers,
        highWaterMark: 2 * 1024 * 1024, // Set 2MiB buffer
      });
      this.req = req;
      
      this.busboy.on('file', (fieldname, file) => {
        this.logger.info('Writing uploaded file to ' + this.uploadFilePath);
        this.file = file;
        file.on('data', (data) => {
          if(this.status === UPLOAD_ERROR) {
            return;
          }
          this.uploadedBytes += data.length;
          this.status = 'uploading (' + bytesToSize(this.uploadedBytes) + ')';
          this.logger.debug(this.status);
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
        this.logger.info('Upload completed');
        this.status = 'uploaded';
        setTimeout(() => resolve(this.uploadFilePath), 100);
      });

      this.busboy.on('error', (err) => {
        this.onUploadError(err);
        reject(err);
      });
      req.pipe(this.busboy);
    });
  }

  async extract() {
    this.logger.debug('extracting...');
    if(!fs.existsSync(this.uploadFilePath)) {
      this.logger.error('nothing to extract');
      throw new EntityNotFoundError('nothing to extract');
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
          this.logger.error(err);
          this.status = 'extract error';
          return reject(err);
        }
        this.status = 'extracted';
        this.logger.info('files extracted');
        resolve();
      });
    });
    
    if(fs.existsSync(this.uploadFilePath)) {
      fs.unlinkSync(this.uploadFilePath);
    }
  }

  async install() { 
    this.logger.info('installing...');
    if(!fs.existsSync(this.tmpPath)) {
      throw new EntityNotFoundError('nothing to install');
    }
    this.status = 'installing';

    const hasPackageJson = fs.existsSync(path.resolve(this.tmpPath, 'package.json'));
    const hasIndexHtml = fs.existsSync(path.resolve(this.tmpPath, 'index.html'));
    const hasIndexJs = fs.existsSync(path.resolve(this.tmpPath, 'index.js'));

    try {
      if(hasIndexHtml) {
        this.logger.debug('Application Bundle Type: STATIC');
        this.logger.debug('index.html found. Installing static server');
        await this.hostStatic();
        await this.installPackageJson();
      } else if(hasPackageJson && hasIndexJs) {
        this.logger.debug('Application Bundle Type: NPM');
        this.logger.debug('package.json found. Installing dependencies');
        await this.installPackageJson();
      } else if (hasIndexJs) {
        this.logger.debug('Application Bundle Type: NODEJS');
      } else {
        throw new Error('Unknown application type');
      }

      await this.copyToBin();
      this.logger.info('installation completed');
      this.status = 'deployed';
      this.stop();
    } catch(err) {
      this.logger.error(err);
      this.status = 'install error';
      return;
    }
    
  }

  async installPackageJson() {
    await new Promise((resolve) => {
      const child = spawn('npm', ['install'], {cwd: this.tmpPath});
      
      child.on('exit', (code, signal) => {
        const msg = `child process exited with code ${code} and signal ${signal}`;
        this.logger.debug(`[npm i] ${msg}`);
        resolve();
      });
      
      child.stdout.on('data', (data) => {
        const msg = data.toString('utf8').replace(/(\n$|^\n)/g, '');
        this.logger.debug(`[npm i] ${msg}`);
      });
      
      child.stderr.on('data', (data) => {
        const msg = data.toString('utf8').replace(/(\n$|^\n)/g, '');
        this.logger.error(`[npm i] ${msg}`);
      });
    });
  }

  async copyToBin() { 
    this.logger.info('moving files to target destination');

    const binTmpPath = path.resolve(this.workspace, 'tmp-bin' + Math.round(Math.random()*0xffffff).toString(16));
    const binPath = path.resolve(this.workspace, 'bin');

    await fsPromises.rename(binPath, binTmpPath);
    await new Promise(resolve => setTimeout(resolve, 50));
    await fsPromises.rename(this.tmpPath, binPath);
    await fsPromises.rmdir(binTmpPath, { recursive: true });
  }

  async hostStatic(){
    const wwwPath = path.resolve(this.tmpPath, 'www');
    const indexPath = path.resolve(this.tmpPath, 'index.js');
    const packageJsonPath = path.resolve(this.tmpPath, 'package.json');
    const wwwTmpPath = path.resolve(this.workspace, 'tmp-www' + Math.round(Math.random()*0xffffff).toString(16));
    this.logger.info('moving public files to www location');
    
    fs.renameSync(this.tmpPath, wwwTmpPath);
    fs.mkdirSync(this.tmpPath);

    fs.mkdirSync(wwwPath);
    await new Promise((resolve, reject) => {
      ncp(wwwTmpPath, wwwPath, (err) => {
        if (err) {
          return reject(err);
        }
        resolve();
      });
    });

    await fsPromises.rmdir(wwwTmpPath, { recursive: true });

    this.logger.info('adding static server');
    fs.writeFileSync(
      indexPath,
      `#!/usr/bin/env node
      const StaticServer = require('static-server');
      const path = require('path');
      const port = process?.env?.port;

      var server = new StaticServer({
        rootPath: path.resolve(__dirname, 'www'),
        port: port
      });
      
      server.start(function () {
        console.log('Static server listening on', server.port);
      })
      
      server.on('response', function (req, res) {
        console.log(req.method + ' ' + req.path + ' ' + res.status)
      });
    `);
    
    fs.writeFileSync(
      packageJsonPath,
      `{
        "name": "nodepad-static-wrapper",
        "description": "",
        "version": "1.0.0",
        "dependencies": {
          "static-server": "latest"
        },
        "devDependencies": {}
      }`);
  }
}

module.exports = DeploymentJob;