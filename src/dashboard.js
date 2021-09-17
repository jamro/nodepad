const express = require('express');
const path = require('path');
const expressOpenApi = require('express-openapi');
const swaggerUi = require('swagger-ui-express');
const pm2 = require('pm2');
const apiDocCreate = require('./api/api-doc').create;
const AppService = require('./services/AppService');
const AliasService = require('./services/AliasService');
const ProxyService = require('./services/ProxyService');
const DeployService = require('./services/DeployService');
const AuthService = require('./services/AuthService');
const { AuthError } = require('./services/common/errors');
const { createAppBase } = require('./appBuilder');

function finalizeApp(app, services) {
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
}

function buildApp(app, config, services) {

  app.logger.debug('Setting up OpenApi');
  const openApiConfig = {
    app,
    apiDoc: apiDocCreate(config),
    paths: path.resolve(__dirname, 'api', 'paths'),
    docsPath: '/swagger.json',
    dependencies: services,
    errorTransformer: function(err) {
      return {
        ...err,
        text: `[${err.errorCode}] ${err.location}.${err.path} ${err.message}`
      };
    },
    errorMiddleware: function(err, req, res, next) { // eslint-disable-line no-unused-vars
      if(err.name && err.message) {
        app.logger.error(`${err.name}: ${err.message}`);
      } else if(err.__proto__.constructor.name === 'Object') {
        app.logger.error(JSON.stringify(err));
      } else {
        app.logger.error(err);
      }

      if(err.__proto__.constructor.name === 'Object' && err.status && err.errors) {
        return res.status(err.status).json({error: 'API error. ' + err.errors[0].text});
      }
      
      switch(err.name) {
      case 'ValidationError':
        return res.status(400).json({error: err.message});
      case 'EntityNotFoundError':
        return res.status(404).json({error: err.message});
      case 'AuthError':
        return res.status(401).json({error: err.message});
      case 'ProcessManagerError':
        app.logger.debug(err);
        return res.status(500).json({error: 'Internal Process Manager error'});
      case 'GatewayError':
        app.logger.debug(err);
        return res.status(502).json({error: 'Bad Gateway'});
      default:
        app.logger.debug(err);
        return res.status(500).json({error: 'Internal NodePad error'});
      }
    },
    promiseMode: true
  };
  if(config.auth) {
    app.logger.info('Authorization enabled');
    app.logger.debug('Configure Authorization');
    openApiConfig.securityHandlers = {
      basicAuth: function(req) {
        return new Promise((resolve, reject) => {
          if(!req.headers.authorization) {
            app.logger.debug('Auth data not provided');
          }
          const isAuth = services.authService.authBasic(req.headers.authorization);
          
          if (isAuth) {
            return resolve(true);
          }
          const res = new AuthError('Unauthorized');
          reject(res);
        }); 
      }
    };
  }
  expressOpenApi.initialize(openApiConfig);
  
  app.logger.debug('Configure Swagger UI');
  app.use(
    '/api',
    swaggerUi.serve,
    swaggerUi.setup(null, {
      swaggerOptions: {
        url: '/api/swagger.json',
      },
    })
  );

  app.logger.debug('Configure Routing');
  function authMiddleware(req, res, next) {
    if(req.url !== '/') {
      return next();
    }
    const isAuth = services.authService.authBasic(req.headers.authorization);
    if(isAuth) {
      return next();
    }
    res
      .set('WWW-Authenticate', 'Basic realm="401"')
      .status(401)
      .send('auth needed');
  }
  app.use('/', [authMiddleware, express.static(path.join(__dirname, 'public'))]);
}

function createDashboard(config) {
  const appConfig = config || {};
  const app = createAppBase(appConfig);

  app.logger.info('Configuring NodePad...');
  
  app.logger.debug('Create services');
  const services = {};
  const appRepoPath = appConfig.appRepoPath || path.resolve(__dirname, 'repo');
  const defaultScheme = appConfig.defaultScheme || 'http';
  const rootDomain = appConfig.rootDomain || 'localhost:3000';
  services.appService = new AppService(appRepoPath, defaultScheme, rootDomain, appConfig.proxyPort, pm2);
  services.appService.logger = app.logger.child({ service: 'appService' });
  services.aliasService = new AliasService(appRepoPath, defaultScheme, rootDomain, appConfig.proxyPort);
  services.aliasService.logger = app.logger.child({ service: 'aliasService' });
  services.proxyService = new ProxyService(services.appService, services.aliasService, rootDomain, appConfig.defaultApp);
  services.proxyService.logger = app.logger.child({ service: 'proxyService' });
  services.deployService = new DeployService(appRepoPath);
  services.deployService.logger = app.logger.child({ service: 'deployService' });
  services.authService = new AuthService(appConfig.auth);
  services.authService.logger = app.logger.child({ service: 'authService' });
  services.logger = app.logger.child({ service: 'api' });
  
  buildApp(app, appConfig, services);
  finalizeApp(app, services);  

  return app;
}

module.exports = { createDashboard };
