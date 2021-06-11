const packageInfo = require('../package.json');

function create(config) {
  const appConfig = config || {};
  const apiDoc = {
    swagger: '2.0',
    basePath: '/nodepad/api',
    info: {
      title: 'NodePad',
      description: "NodePad is a simple tool to manage your NodeJs apps through REST API or UI",
      version: packageInfo.version,
    },
    tags: [
      { name: 'Application' }
    ],
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
            example: 'online'
          },
          memory: {
            type: 'number',
            example: 9699328
          },
          cpu: {
            type: 'number',
            example: 47
          },
        },
      },
      AppStatus: {
        type: 'object',
        properties: {
          status: {
            type: 'string',
            example: 'online'
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