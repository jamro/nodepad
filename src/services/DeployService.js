const fs = require('fs');
const DeploymentJob = require('./DeployService/DeploymentJob');
const path = require('path');
const AppLogger = require('./common/AppLogger');
const { ValidationError, EntityNotFoundError } = require('./common/errors');
const AbstractService = require('./common/AbstractService');
const AppLoggerTransport = require('./common/AppLoggerTransport');

class DeployService extends AbstractService {

  constructor(basePath) {
    super();
    this.basePath = basePath;
    this.debug = true;
    this.appLogger = new AppLogger(basePath);
    this.jobMap = {};
  }

  getDeployment(appId) {
    const app = fs.readdirSync(this.basePath, { withFileTypes: true })
      .filter(dir => dir.isDirectory())
      .map(dir => {
        let appData = dir.name.split('.');
        return {
          id: appData[0],
          port: Number(appData[1])
        };
      })
      .find(p => p.id === appId);
    
    if(!app) {
      throw new EntityNotFoundError('Project ' + appId + ' not found');
    }

    const binPath =  path.resolve(this.basePath, app.id + '.' + app.port, 'bin');

    const job = this.jobMap[appId] || null;
    let stats;
    try {
      stats = fs.statSync(binPath);
    } catch(err) {
      this.logger.debug(err);
      stats = {};
    }
    
    return  {
      status: job ? job.status : 'deployed',
      lastUpdate: stats.mtime ? new Date(stats.mtime).toISOString() : null
    };
  }

  async upload(appId, req) {
    this.logger.info(`Uploading new content to '${appId}'`);
    const app = fs.readdirSync(this.basePath, { withFileTypes: true })
      .filter(dir => dir.isDirectory())
      .map(dir => {
        let appData = dir.name.split('.');
        return {
          id: appData[0],
          port: Number(appData[1])
        };
      })
      .find(p => p.id === appId);

    const workspace = path.resolve(this.basePath, app.id + '.' + app.port);
    if(this.jobMap[appId]) {
      this.jobMap[appId].stop();
    }
    this.jobMap[appId] = new DeploymentJob(workspace);
    this.jobMap[appId].logger.configure({
      level: 'debug',
      transports: [
        new AppLoggerTransport(appId, this.appLogger)
      ]
    });
    await this.jobMap[appId].upload(req);
    this.logger.info(`Uploading of '${appId}' completed`);
  }

  async extract(appId) {
    this.logger.info(`Extracting '${appId}'...`);
    if(!this.jobMap[appId]) {
      throw new ValidationError(`No deployment jobs for application '${appId}'`);
    }
    await this.jobMap[appId].extract();
    this.logger.info(appId, `Content of '${appId}' extracted`);
  }

  async install(appId) {
    this.logger.info(`Installing '${appId}'...`);
    if(!this.jobMap[appId]) {
      throw new ValidationError(`No deployment jobs for application '${appId}'`);
    }

    await this.jobMap[appId].install();
    this.logger.info(`Content of '${appId}' installed`);
  }
}

module.exports = DeployService;