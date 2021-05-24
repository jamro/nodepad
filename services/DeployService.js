const fs = require('fs');
const DeploymentJob = require('./DeployService/DeploymentJob');
const path = require('path');

class DeployService {

  constructor(basePath) {
    this.basePath = basePath;
    this.debug = true;
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

  async deploy(projectId, req) {
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
  }

}

module.exports = DeployService;