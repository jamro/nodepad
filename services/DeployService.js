const fs = require('fs');
const DeploymentJob = require('./DeployService/DeploymentJob');
const path = require('path');
const ProjectLogger = require('./common/ProjectLogger');
const { ValidationError, EntityNotFoundError } = require('./common/errors');
const AbstractService = require('./common/AbstractService');

class DeployService extends AbstractService {

  constructor(basePath) {
    super();
    this.basePath = basePath;
    this.debug = true;
    this.projectLogger = new ProjectLogger(basePath);
    this.jobMap = {};
  }

  getDeployment(projectId) {
    const proj = fs.readdirSync(this.basePath, { withFileTypes: true })
      .filter(dir => dir.isDirectory())
      .map(dir => {
        let projData = dir.name.split('.');
        let proj = {
          id: projData[0],
          port: Number(projData[1])
        };
        return proj;
      })
      .find(p => p.id === projectId);
    
    if(!proj) {
      throw new EntityNotFoundError('Project ' + projectId + ' not found');
    }

    const binPath =  path.resolve(this.basePath, proj.id + '.' + proj.port, 'bin');

    const job = this.jobMap[projectId] || null;
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

  async upload(projectId, req) {
    this.logger.info(`Uploading new content to '${projectId}'`);
    this.projectLogger.log(projectId, `Uploading new content to '${projectId}'`);
    const proj = fs.readdirSync(this.basePath, { withFileTypes: true })
      .filter(dir => dir.isDirectory())
      .map(dir => {
        let projData = dir.name.split('.');
        let proj = {
          id: projData[0],
          port: Number(projData[1])
        };
        return proj;
      })
      .find(p => p.id === projectId);

    const workspace = path.resolve(this.basePath, proj.id + '.' + proj.port);
    if(this.jobMap[projectId]) {
      this.jobMap[projectId].stop();
    }
    this.jobMap[projectId] = new DeploymentJob(workspace);
    this.jobMap[projectId].logger = this.logger.child({service: 'deploymmentJob', projectId: projectId});
    await this.jobMap[projectId].upload(req);
    this.projectLogger.log(projectId, `Uploading of '${projectId}' completed`);
    this.logger.info(`Uploading of '${projectId}' completed`);
  }

  async extract(projectId) {
    this.logger.info(`Extracting '${projectId}'...`);
    if(!this.jobMap[projectId]) {
      throw new ValidationError(`No deployment jobs for project '${projectId}'`);
    }
    this.projectLogger.log(projectId, `Extracting '${projectId}'...`);
    await this.jobMap[projectId].extract();
    this.projectLogger.log(projectId, `Content of '${projectId}' extracted`);
    this.logger.info(projectId, `Content of '${projectId}' extracted`);
  }

  async install(projectId) {
    this.logger.info(`Installing '${projectId}'...`);
    if(!this.jobMap[projectId]) {
      throw new ValidationError(`No deployment jobs for project '${projectId}'`);
    }

    this.projectLogger.log(projectId, `Installing '${projectId}'...`);
    await this.jobMap[projectId].install();
    this.projectLogger.log(projectId, `Content of '${projectId}' installed`);
    this.logger.info(`Content of '${projectId}' installed`);
  }
}

module.exports = DeployService;