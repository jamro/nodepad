const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const expressOpenApi = require('express-openapi');
const swaggerUi = require('swagger-ui-express');
const pm2 = require('pm2');
const winston = require('winston');
const expressWinston = require('express-winston');
const apiDocCreate = require('./api/api-doc').create;

const AppService = require('./services/AppService');
const ProxyService = require('./services/ProxyService');
const DeployService = require('./services/DeployService');
const AuthService = require('./services/AuthService');
const { AuthError } = require('./services/common/errors');

function create(config) {
  const appConfig = config || {};
  const app = express();

  app.logger = winston.createLogger({
    level: config.logLevel || 'info',
    transports: [
      new winston.transports.Console()
    ],
    format: winston.format.combine(
      winston.format.timestamp(),
      winston.format.errors(),
      winston.format.simple(),
    )
  }).child({service: 'core'});
  app.use(expressWinston.logger({
    winstonInstance: app.logger.child({service: 'web'}),
    meta: false,
    msg: 'HTTP  {{res.statusCode}} {{req.method}} {{res.responseTime}}ms {{req.url}}',
    expressFormat: true,
  }));
  app.logger.info('Configuring NodePad...');

  // view engine setup
  app.logger.debug('Setting views');
  app.set('views', path.join(__dirname, 'views'));
  app.set('view engine', 'ejs');
  
  app.logger.debug('Configure ExpressJS middleware');
  app.use(express.json());
  app.use(express.urlencoded({ extended: false }));
  app.use(cookieParser());
  
  app.logger.debug('Create services');
  const services = {};
  const appRepoPath = appConfig.appRepoPath || path.resolve(__dirname, 'repo');
  services.appService = new AppService(appRepoPath, pm2);
  services.appService.logger = app.logger.child({ service: 'appService' });
  services.proxyService = new ProxyService(services.appService, config.defaultApp);
  services.proxyService.logger = app.logger.child({ service: 'proxyService' });
  services.deployService = new DeployService(appRepoPath);
  services.deployService.logger = app.logger.child({ service: 'deployService' });
  services.authService = new AuthService(config.auth);
  services.authService.logger = app.logger.child({ service: 'authService' });
  services.logger = app.logger.child({ service: 'api' });
  
  app.logger.debug('Setting up OpenApi');
  const openApiConfig = {
    app,
    apiDoc: apiDocCreate(appConfig),
    paths: './api/paths',
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
      default:
        app.logger.debug(err);
        return res.status(500).json({error: 'Internal NodePad error'});
      }
    },
    promiseMode: true
  };
  if(appConfig.auth) {
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
    '/nodepad/api',
    swaggerUi.serve,
    swaggerUi.setup(null, {
      swaggerOptions: {
        url: '/api-docs',
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
  app.use('/nodepad', [authMiddleware, express.static(path.join(__dirname, 'public'))]);
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

module.exports = { create };
