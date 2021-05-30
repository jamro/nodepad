const path = require('path');

module.exports = {
  port: 3000,
  logLevel: 'debug',
  projectPath: path.resolve(__dirname, 'projects'),

  /* uncommment to enable basic auth
  auth: {
    user: 'nodepad',
    pass: 'secret'
  }
  */
};