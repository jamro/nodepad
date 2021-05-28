const express = require('express');
const createError = require('http-errors');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const expressOpenApi = require('express-openapi');
const swaggerUi = require('swagger-ui-express');
const pm2 = require('pm2');
const config = require('./config.js');

const indexRouter = require('./routes/index');
const ProjectService = require('./services/ProjectService');
const ProxyService = require('./services/ProxyService');
const DeployService = require('./services/DeployService');

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

const services = {};

services.projectService = new ProjectService(config.projectPath, pm2);
services.proxyService = new ProxyService(services.projectService);
services.deployService = new DeployService(config.projectPath);

const openApiConfig = {
  app,
  apiDoc: require('./api/api-doc'),
  paths: './api/paths',
  dependencies: services
};
if(config.auth) {
  openApiConfig.securityHandlers = {
    basicAuth: function(req, scopes, definition) {
      return new Promise((resolve, reject) => {
        const b64auth = (req.headers.authorization || '').split(' ')[1] || '';
        const [login, password] = Buffer.from(b64auth, 'base64').toString().split(':');
        if (login && password && login === config.auth.user && password === config.auth.pass) {
          return resolve(true)
        }
        const res = {
          status: 401,
          toString: () => '401 Unauthorized'
        }
        if(req.url === '/api/auth') {
          res.headers = {
            'WWW-Authenticate': 'Basic realm="401"'
          }
        }
        reject(res)
      }) 
    }
  }
}
expressOpenApi.initialize(openApiConfig);

app.use(
  '/api',
  swaggerUi.serve,
  swaggerUi.setup(null, {
    swaggerOptions: {
      url: '/api-docs',
    },
  })
);
app.use('/', services.proxyService.getProxy());
app.use('/', indexRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});




module.exports = app;
