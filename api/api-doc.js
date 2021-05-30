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
      App: {
        type: 'object',
        properties: {
          id: {
            type: 'string',
            example: 'webapp'
          },
          port: {
            type: 'number',
            example: 3001
          },
          status: {
            type: 'string',
            enum: ['online', 'offline']
          }
        },
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