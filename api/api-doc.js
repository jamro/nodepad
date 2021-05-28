const packageInfo = require('../package.json');

function create(config) {
  const appConfig = config || {};
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
          },
          lastUpdate: {
            type: 'string'
          }
        }
      },
      Error: {
        type: 'object',
        properties: {
          error: {
            type: 'string',
            example: 'An error message'
          }
        }
      }
    },
    paths: {},
  };
  
  if(appConfig.auth) {
    apiDoc.securityDefinitions = {
      basicAuth: {
        type: 'basic'
      }
    };
    apiDoc.security = [
      {
        basicAuth: []
      }
    ];
  }
  return apiDoc;
}


module.exports = { create };