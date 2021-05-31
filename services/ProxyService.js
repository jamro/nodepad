const proxy = require('express-http-proxy');
const AbstractService = require('./common/AbstractService');


class ProxyService extends AbstractService {

  constructor(appService, defaultApp, cacheTimeout) {
    super();
    this.appService = appService;
    this.defaultApp = defaultApp || null;
    this.loop = null;
    this.cache = [];
    this.cacheTime = 0;
    this.cacheTimeout = cacheTimeout || 5000;
  }


  getTargetAppId(req) {
    const host = req.headers['x-forwarded-host'] ? req.headers['x-forwarded-host'] : req.hostname;
    let appId = host.split('.');
    if(appId[0] === 'www') {
      appId.shift();
    }
    appId = appId[0];
    return appId;
  }

  getTargetHost(appId) {
    const now = new Date().getTime();
    if(now - this.cacheTime > this.cacheTimeout) {
      this.logger.debug('Refreshing app cache');
      this.cache = this.appService.getAppFolders();
      this.cacheTime = now;
    }
    
    const folders = this.cache;
    let app = folders.map(dir => dir.split('.'))
      .find(dir => dir[0]  === appId);
    if(!app) {
      app = folders.map(dir => dir.split('.'))
        .find(dir => dir[0]  === this.defaultApp);
      return app ? 'localhost:' + app[1] : null;
    }
    return 'localhost:' + app[1];
  }
  
  getProxy() {
    return proxy(
      (req) => {
        let appId = this.getTargetAppId(req);
        const targetHost = this.getTargetHost(appId);
        this.logger.info(`Redirecting '${req.url} to app '${appId}' at '${targetHost}'`);
        return targetHost;
      }, 
      { 
        filter: (req) => {
          let appId = this.getTargetAppId(req);
          const targetHost = this.getTargetHost(appId);
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