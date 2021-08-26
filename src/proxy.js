const path = require('path');
const pm2 = require('pm2');
const AppService = require('./services/AppService');
const ProxyService = require('./services/ProxyService');
const { createAppBase } = require('./appBuilder');

function createProxy(config) {
  const appConfig = config || {};
  const app = createAppBase(appConfig);

  app.logger.info('Configuring NodePad Proxy...');
  
  app.logger.debug('Create services for proxy');
  const services = {};
  const appRepoPath = appConfig.appRepoPath || path.resolve(__dirname, 'repo');
  const defaultScheme = appConfig.defaultScheme || 'http';
  const rootDomain = appConfig.rootDomain || 'localhost:3000';
  services.appService = new AppService(appRepoPath, defaultScheme, rootDomain, appConfig.proxyPort, pm2);
  services.appService.logger = app.logger.child({ service: 'appService' });
  services.proxyService = new ProxyService(services.appService, rootDomain, appConfig.defaultApp);
  services.proxyService.logger = app.logger.child({ service: 'proxyService' });
  
  app.use('/', services.proxyService.getProxy());

  app.logger.debug('Attach error handlers');

  // catch 404 and forward to error handler
  app.use(function(req, res) {
    return res.status(404).send('<h1>404 Not Found</h1>');
  });
  
  // error handler
  app.use(function(err, req, res) {
    // set locals, only providing error in development
    res.locals.message = err.message;
    res.locals.error = req.app.get('env') === 'development' ? err : {};

    app.logger.error(err);
  
    // render the error page
    res.status(err.status || 500);
    res.render('error');
  });

  app.destroy = () => {
    const names = Object.keys(services);
    names.forEach(serviceName => {
      if(services[serviceName].destroy) {
        services[serviceName].destroy();
      }
    });
  };

  return app;
}

module.exports = { createProxy };
