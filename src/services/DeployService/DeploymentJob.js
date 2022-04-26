const path = require('path');
const winston = require('winston');
const busboy = require('busboy');
const fs = require('fs');
const fsPromises = require('fs').promises;
const { spawn } = require('child_process');
const ncp = require('ncp').ncp;
const EventEmitter = require('events');
const extract = require('extract-zip');

const { EntityNotFoundError } = require('../common/errors');

const PENDING = 'pending';
const UPLOAD = 'upload';
const EXTRACT = 'extract';
const INSTALL = 'install';
const DONE = 'deployed';

function bytesToSize(bytes) {
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  if (bytes == 0) return '0 Byte';
  const i = parseInt(Math.floor(Math.log(bytes) / Math.log(1024)));
  return Math.round(bytes / Math.pow(1024, i), 2) + ' ' + sizes[i];
}

class DeploymentJob extends EventEmitter {

  constructor(workspace) {
    super();
    this.workspace = workspace;
    this.busboy = null;
    this.state = PENDING;
    this.description = '';
    this.errorState = false;
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

  updateStatus(state, description, isError) {
    this.state = state;
    this.description = description || state;
    this.errorState = !!isError;
    this.emit('status', {
      state: this.state,
      description: this.description,
      errorState: this.errorState
    });
  }

  onUploadError(err) {
    this.logger.error(err);
    this.updateStatus(UPLOAD, 'upload error', true);
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
          fs.rmSync(path.resolve(this.workspace, f), { recursive: true });
        } catch (err) { } // eslint-disable-line no-empty
        try {
          fs.unlinkSync(path.resolve(this.workspace, f));
        } catch (err) { }  // eslint-disable-line no-empty
      });
  }

  upload(req) {
    return new Promise((resolve, reject) => {
      this.logger.debug('uploading new content...');
      this.updateStatus(UPLOAD, 'uploading');
      this.busboy = busboy({ 
        headers: req.headers,
        highWaterMark: 2 * 1024 * 1024, // Set 2MiB buffer
      });
      this.req = req;
      
      this.busboy.on('file', (fieldname, file) => {
        this.logger.info('Writing uploaded file to ' + this.uploadFilePath);
        this.file = file;
        file.on('data', (data) => {
          if(this.errorState) {
            return;
          }
          this.uploadedBytes += data.length;
          this.updateStatus(UPLOAD, 'uploading (' + bytesToSize(this.uploadedBytes) + ')');
          this.logger.debug(this.description);
        });
        file.on('error', (err) => {
          this.onUploadError(err);
          reject(err);
        });
        const writeStream = fs.createWriteStream(this.uploadFilePath);
        file.pipe(writeStream);
      });

      this.busboy.on('finish', () => {
        if(this.errorState) {
          return;
        }
        this.logger.info('Upload completed');
        this.updateStatus(UPLOAD, 'uploaded');
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
    if(!fs.existsSync(this.uploadFilePath)) {
      this.logger.error('nothing to extract');
      throw new EntityNotFoundError('nothing to extract');
    }
    this.updateStatus(EXTRACT, 'extracting');
    this.logger.debug('clear old artifacts');
    if(fs.existsSync(this.tmpPath)) {
      fs.rmSync(this.tmpPath, {recursive: true});
    }
    this.logger.debug('create temporary location');
    fs.mkdirSync(this.tmpPath);

    // unzip -----------------------------------------------------------
    try {
      await extract(this.uploadFilePath, { dir: this.tmpPath });
      this.updateStatus(EXTRACT, 'extracted');
      this.logger.info('files extracted');
    } catch (err) {
      this.logger.error(err);
      this.updateStatus(EXTRACT, 'extract error', true);
      throw err;
    }
    // ------------------------------------------------------------------
    
    if(fs.existsSync(this.uploadFilePath)) {
      fs.unlinkSync(this.uploadFilePath);
    }

    const hasPackageJson = fs.existsSync(path.resolve(this.tmpPath, 'package.json'));
    const hasIndexHtml = fs.existsSync(path.resolve(this.tmpPath, 'index.html'));
    const hasIndexJs = fs.existsSync(path.resolve(this.tmpPath, 'index.js'));

    this.logger.debug('package.json ' + (hasPackageJson ? 'found' : 'NOT found'));
    this.logger.debug('index.html ' + (hasIndexHtml ? 'found' : 'NOT found'));
    this.logger.debug('index.js ' + (hasIndexJs ? 'found' : 'NOT found'));

    this.updateStatus(INSTALL, 'installing');
    try {
      if(hasIndexHtml) {
        this.updateStatus(INSTALL, 'installing (STATIC)');
        this.logger.debug('Application Bundle Type: STATIC');
        this.logger.debug('index.html found. Installing static server');
        await this.hostStatic();
        await this.installPackageJson();
      } else if(hasPackageJson && hasIndexJs) {
        this.updateStatus(INSTALL, 'installing (NPM)');
        this.logger.debug('Application Bundle Type: NPM');
        this.logger.debug('package.json found. Installing dependencies');
        await this.installPackageJson();
      } else if (hasIndexJs) {
        this.updateStatus(INSTALL, 'installing (NODEJS)');
        this.logger.debug('Application Bundle Type: NODEJS');
      } else {
        throw new Error('Unknown application type');
      }
      
    } catch(err) {
      this.logger.error(err);
      this.updateStatus(EXTRACT, 'extract error', true);
      return;
    }
  }

  async install() { 
    this.logger.info('installing...');
    this.updateStatus(INSTALL, 'copying');
    if(!fs.existsSync(this.tmpPath)) {
      throw new EntityNotFoundError('nothing to install');
    }
    
    try {
      await this.copyToBin();
      this.logger.info('installation completed');
      this.updateStatus(DONE, 'deployed');
      this.stop();
      this.emit('completed');
    } catch(err) {
      console.log(err);
      this.logger.error(err);
      this.updateStatus(INSTALL, 'install error', true);
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
    await fsPromises.rm(binTmpPath, { recursive: true });
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

    await fsPromises.rm(wwwTmpPath, { recursive: true });

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

DeploymentJob.UPLOAD = UPLOAD;
DeploymentJob.EXTRACT = EXTRACT;
DeploymentJob.INSTALL = INSTALL;
DeploymentJob.DONE = DONE;
DeploymentJob.PENDING = PENDING;

module.exports = DeploymentJob;