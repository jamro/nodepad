const path = require('path')

module.exports = {
  port: 3000,
  projectPath: path.resolve(__dirname, 'projects'),
  /* uncommment to enable basic auth
  auth: {
    user: 'nodepad',
    pass: 'secret'
  }
  */
}