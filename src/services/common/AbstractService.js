const winston = require('winston');
const EventEmitter = require('events');

class AbstractService extends EventEmitter {
  constructor() {
    super();
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