const path = require('path');

module.exports = {
  dashboardPort: 3333,
  proxyPort: 3000,
  logLevel: 'debug',
  appRepoPath: path.resolve(__dirname, 'repo'),
  defaultApp: 'webapp',
  rootDomain: 'localhost',
  defaultScheme: 'http',
  /* uncommment to enable basic auth
  auth: {
    user: 'nodepad',
    pass: 'secret'
  }
  */
};