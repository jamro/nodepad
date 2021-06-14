const path = require('path');

module.exports = {
  port: 3000,
  logLevel: 'debug',
  appRepoPath: path.resolve(__dirname, 'repo'),
  defaultApp: 'webapp',
  rootDomain: 'localhost',
  defaultSchema: 'http'
  /* uncommment to enable basic auth
  auth: {
    user: 'nodepad',
    pass: 'secret'
  }
  */
};