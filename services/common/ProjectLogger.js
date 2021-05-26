const fs = require('fs');
const path = require('path');

class ProjectLogger {
  constructor(basePath) {
    this.basePath = basePath;
  }

  log(projectId, message) {
    const projectDir = fs.readdirSync(this.basePath, { withFileTypes: true })
      .filter(dir => dir.isDirectory())
      .map(dir => dir.name)
      .find(dirname => dirname.startsWith(projectId));

    if(!projectDir) {
      console.log('Error: Unable to log to ' + projectId + ' project. Log message: ' + message);
      return;
    }
    const time = new Date().toISOString().replace('T', ' ').replace('Z', '');
    const logfile = path.join(this.basePath, projectDir, `log-${projectId}.log`);
    fs.appendFileSync(logfile, `${time} [NODEPAD] ${message}\n`);
  }
}

module.exports = ProjectLogger;