const fs = require('fs');
const DeploymentJob = require('./DeployService/DeploymentJob');
const path = require('path');
const ProjectLogger = require('./common/ProjectLogger');

class DeployService {

  constructor(basePath) {
    this.basePath = basePath;
    this.debug = true;
    this.logger = new ProjectLogger(basePath);
    this.jobMap = {};
  }

  log(...args) {
    if(this.debug) {
      console.log(...args);
    }
  }

  getDeployment(projectId) {
    let job = this.jobMap[projectId] || null;
    return  {
      status: job ? job.status : 'done'
    };
  }

  async upload(projectId, req) {
    this.logger.log(projectId, `Uploading new content to '${projectId}'`);
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
    this.jobMap[projectId].debug = this.debug;
    await this.jobMap[projectId].upload(req);
    this.logger.log(projectId, `Uploading of '${projectId}' completed`);
  }

  async extract(projectId) {
    if(!this.jobMap[projectId]) {
      throw new Error(`No deployment jobs for project '${projectId}'`);
    }

    this.logger.log(projectId, `Extracting '${projectId}'...`);
    await this.jobMap[projectId].extract();
    this.logger.log(projectId, `Content of '${projectId}' extracted`);
  }

  async install(projectId) {
    if(!this.jobMap[projectId]) {
      throw new Error(`No deployment jobs for project '${projectId}'`);
    }

    this.logger.log(projectId, `Installing '${projectId}'...`);
    await this.jobMap[projectId].install();
    this.logger.log(projectId, `Content of '${projectId}' installed`);
  }
}

module.exports = DeployService;