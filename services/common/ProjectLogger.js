const fs = require('fs');
const { dirname } = require('path');
const readLastLines = require('read-last-lines');
const path = require('path');

class ProjectLogger {
  constructor(basePath) {
    this.basePath = basePath;
  }

  getLogfile(projectId) {
    const projectDir = fs.readdirSync(this.basePath, { withFileTypes: true })
      .filter(dir => dir.isDirectory())
      .map(dir => dir.name)
      .find(dirname => dirname.startsWith(projectId));

    if(!dirname) {
      return null;
    }
    
    const logfile = path.join(this.basePath, projectDir, `log-${projectId}.log`);
    return logfile;
  }

  log(projectId, message) {
    const logfile = this.getLogfile(projectId);
    if(!logfile) {
      console.log('Error: Unable to log to ' + projectId + ' project. Log message: ' + message);
      return;
    }
    const time = new Date().toISOString().replace('T', ' ').replace('Z', '');
    fs.appendFileSync(logfile, `${time} [NODEPAD] ${message}\n`);
  }

  async read(projectId, lines) {
    const logfile = this.getLogfile(projectId);
    if(!logfile) {
      return [];
    }
    const logs = await readLastLines.read(logfile, lines || 100);
    return logs.split('\n').filter(line => !!line);
  }
}

module.exports = ProjectLogger;