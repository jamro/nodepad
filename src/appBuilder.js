const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const winston = require('winston');
const expressWinston = require('express-winston');

function createAppBase(config) {
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

  // view engine setup
  app.logger.debug('Setting views');
  app.set('views', path.join(__dirname, 'views'));
  app.set('view engine', 'ejs');
  
  app.logger.debug('Configure ExpressJS middleware');
  app.use(express.json());
  app.use(express.urlencoded({ extended: false }));
  app.use(cookieParser());

  app.emitEvent = () => {};
  app.attachWebSocket = (io) => {
    io.on('connection', () => {
      app.logger.debug('WebSocket connection established');
    });
    app.emitEvent = (eventName, eventPayload) => io.emit(eventName, eventPayload);
  };

  return app;
}

module.exports = { createAppBase };