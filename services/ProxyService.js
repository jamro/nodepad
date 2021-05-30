const proxy = require('express-http-proxy');
const AbstractService = require('./common/AbstractService');


class ProxyService extends AbstractService {

  constructor(projectService, cacheTimeout) {
    super();
    this.projectService = projectService;
    this.cache = [];
    this.loop = null;

    if(cacheTimeout !== -1) {
      this.loop = setInterval(async () => await this.refreshCache(), cacheTimeout || 5000);
    }
    this.refreshCache();
  }

  destroy() {
    if(this.loop) {
      clearInterval(this.loop);
    }
  }

  async refreshCache() {
    this.logger.debug('Refreshing project cache');
    this.cache = await this.projectService.read();
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
    const proj = this.cache.find(p => p.id === projectId);
    if(!proj) {
      return null;
    }
    return 'localhost:' + proj.port;
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
          const proj = this.cache.find(p => p.id === projectId);
          return !!proj;
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