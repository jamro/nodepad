const winston = require('winston');

class AbstractService {
  constructor() {
    this.logger = winston.createLogger({
      transports: [
        new winston.transports.Console({silent: true})
      ]
    });
  }

  destroy() {
    
  }
}

module.exports = AbstractService;