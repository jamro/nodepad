const path = require('path');

module.exports = {
  port: 25193,
  logLevel: 'debug',
  appRepoPath: path.resolve(__dirname, 'repo'),
  defaultApp: 'webapp',
  rootDomain: 'localhost',
  defaultScheme: 'http'
};