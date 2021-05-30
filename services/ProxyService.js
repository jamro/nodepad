const proxy = require('express-http-proxy');
const AbstractService = require('./common/AbstractService');


class ProxyService extends AbstractService {

  constructor(projectService, cacheTimeout) {
    super();
    this.projectService = projectService;
    this.loop = null;
    this.cache = [];
    this.cacheTime = 0;
    this.cacheTimeout = cacheTimeout || 5000;
  }


  getTargetProjectId(req) {
    const host = req.headers['x-forwarded-host'] ? req.headers['x-forwarded-host'] : req.hostname;
    let projectId = host.split('.');
    if(projectId[0] === 'www') {
      projectId.shift();
    }
    projectId = projectId[0];
    return projectId;
  }

  getTargetHost(projectId) {
    const now = new Date().getTime();
    if(now - this.cacheTime > this.cacheTimeout) {
      this.logger.debug('Refreshing project cache');
      this.cache = this.projectService.getProjectFolders();
      this.cacheTime = now;
    }
    
    const folders = this.cache;
    const proj = folders.map(dir => dir.split('.'))
      .find(dir => dir[0]  === projectId);
    if(!proj) {
      return null;
    }
    return 'localhost:' + proj[1];
  }
  
  getProxy() {
    return proxy(
      (req) => {
        let projectId = this.getTargetProjectId(req);
        const targetHost = this.getTargetHost(projectId);
        this.logger.info(`Redirecting '${req.url} to project '${projectId}' at '${targetHost}'`);
        return targetHost;
      }, 
      { 
        filter: (req) => {
          let projectId = this.getTargetProjectId(req);
          const targetHost = this.getTargetHost(projectId);
          return !!targetHost;
        },
        proxyErrorHandler: (err, res) => {
          this.logger.error(err);
          res.status(502).send('502 Bad Gateway');
        }
      }
    );
  }
}

module.exports = ProxyService;