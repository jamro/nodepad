const { createProxyMiddleware } = require('http-proxy-middleware');
const AbstractService = require('./common/AbstractService');

class ProxyService extends AbstractService {

  constructor(appService, aliasService, rootDomain, defaultApp, cacheTimeout) {
    super();
    this.appService = appService;
    this.aliasService = aliasService;
    this.rootDomain = rootDomain;
    this.defaultApp = defaultApp || null;
    this.loop = null;
    this.cache = [];
    this.cacheTime = 0;
    this.cacheTimeout = cacheTimeout || 5000;
  }

  getTargetAppId(req) {
    let host = req.hostname;
    if(req.headers && req.headers['x-forwarded-host']) {
      host = req.headers['x-forwarded-host'];
    }
    if(req.headers && req.headers['host']) {
      host = req.headers['host'];
    }
    host = host.replace(/:.*/, '');
    if(!host.endsWith(this.rootDomain)) {
      return this.defaultApp;
    }
    let appId = host.split('.');
    if(appId[0] === 'www') {
      appId.shift();
    }
    appId = appId[0];
    return appId !== this.rootDomain ? appId : this.defaultApp ;
  }

  getTargetHost(appId) {
    const now = new Date().getTime();
    if(now - this.cacheTime > this.cacheTimeout) {
      this.logger.debug('Refreshing app cache');
      this.cache = this.appService.getAppFolders();
      const aliases = this.aliasService.getAliasList().map(a => `${a.id}.${a.port}`);
      this.cache = this.cache.concat(aliases);
      this.cacheTime = now;
    }
    
    const folders = this.cache;
    let app = folders.map(dir => dir.split('.'))
      .find(dir => dir[0]  === appId);

    if(!app) {
      this.logger.warn(`Cannot find host target for '${appId}'. App not found.`);
      app = folders.map(dir => dir.split('.'))
        .find(dir => dir[0]  === this.defaultApp);
      return app ? 'localhost:' + app[1] : null;
    }
    return 'http://localhost:' + app[1];
  }
  
  getProxy() {
    return createProxyMiddleware({
      ws: true,
      router: (req) => {
        let appId = this.getTargetAppId(req);
        const targetHost = this.getTargetHost(appId);
        if(!targetHost) {
          this.logger.info(`No redirection found for app '${appId}'`);
          return {host: 'invalidd'};
        }
        this.logger.info(`Redirecting '${req.url} to app '${appId}' at '${targetHost}'`);
        return targetHost;
      },
      onError: (err, req, res) => {
        this.logger.error(err);
        res.status(502).send('502 Bad Gateway');
      },
      logProvider: () => this.logger.child({ component: 'proxyMiddleware' })
    });
  }
}

module.exports = ProxyService;