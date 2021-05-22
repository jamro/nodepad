const proxy = require('express-http-proxy');


class ProxyService {

  constructor(projectService, cacheTimeout) {
    this.projectService = projectService;
    this.cache = [];

    if(cacheTimeout !== -1) {
      setInterval(async () => await this.refreshCache(), cacheTimeout || 5000);
    }
    this.refreshCache();
  }

  async refreshCache() {
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
        console.log({projectId, targetHost});
        return targetHost;
      }, 
      { 
        filter: (req) => {
          let projectId = this.getTargetProjectId(req);
          const proj = this.cache.find(p => p.id === projectId);
          return !!proj;
        },
        proxyErrorHandler: (err, res) => {
          console.log(err);
          res.status(502).send('502 Bad Gateway');
        }
      }
    );
  }
}

module.exports = ProxyService;