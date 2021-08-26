const path = require('path');

module.exports = {
  dashboardPort: 20181,
  proxyPort: 20182,
  logLevel: 'debug',
  appRepoPath: path.resolve(__dirname, 'repo'),
  defaultApp: 'testapp',
  rootDomain: 'localhost',
  defaultScheme: 'http'
};