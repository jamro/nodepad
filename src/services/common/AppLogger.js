const fs = require('fs');
const { EntityNotFoundError } = require('./errors.js');
const readLastLines = require('read-last-lines');
const path = require('path');

class AppLogger {
  constructor(basePath) {
    this.basePath = basePath;
  }

  getLogfile(appId) {
    const appDir = fs.readdirSync(this.basePath, { withFileTypes: true })
      .filter(dir => dir.isDirectory())
      .map(dir => dir.name)
      .find(dirname => dirname.startsWith(appId));

    if(!appDir) {
      throw new EntityNotFoundError(`Logs for application '${appId}' not found`);
    }
    
    const logfile = path.join(this.basePath, appDir, `log-${appId}.log`);
    return logfile;
  }

  log(appId, message) {
    const logfile = this.getLogfile(appId);
    if(!logfile) {
      console.log('Error: Unable to log to ' + appId + ' app. Log message: ' + message);
      return;
    }
    const time = new Date().toISOString().replace('T', ' ').replace('Z', '');
    fs.appendFileSync(logfile, `${time} [NODEPAD] ${message}\n`);
  }

  async read(appId, lines) {
    const logfile = this.getLogfile(appId);
    if(!fs.existsSync(logfile)) {
      return [];
    }
    const logs = await readLastLines.read(logfile, lines || 100);
    return logs.split('\n').filter(line => !!line);
  }
}

module.exports = AppLogger;