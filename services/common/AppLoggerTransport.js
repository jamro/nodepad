const Transport = require('winston-transport');

class AppLoggerTransport extends Transport {

  constructor(appId, appLogger, opts) {
    super(opts);
    this.appId = appId;
    this.appLogger = appLogger;
  }

  log(info, callback) {
    this.appLogger.log(this.appId, info.message);
    callback();
  }
}

module.exports = AppLoggerTransport;