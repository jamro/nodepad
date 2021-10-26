const winston = require('winston');

class AbstractService {
  constructor() {
    this.logger = winston.createLogger({
      transports: [
        new winston.transports.Console({silent: true})
      ]
    });

    this.emit = () => {};
  }

  destroy() {
    
  }
}

module.exports = AbstractService;