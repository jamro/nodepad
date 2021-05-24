const packageInfo = require('../package.json');

const apiDoc = {
  swagger: '2.0',
  basePath: '/',
  info: {
    title: 'NodePad',
    version: packageInfo.version,
  },
  definitions: {
    Project: {
      type: 'object',
      properties: {
        id: {
          type: 'string',
          default: 'webapp'
        },
        port: {
          type: 'number',
          default: 3001
        },
        status: {
          type: 'string',
          enum: ['online', 'offline']
        }
      },
      required: ['id'],
    },
    Deployment: {
      type: 'object',
      properties: {
        status: {
          type: 'string'
        }
      }
    }
  },
  paths: {},
};

module.exports = apiDoc;