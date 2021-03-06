const packageInfo = require('../../package.json');

function create(config) {
  const appConfig = config || {};
  const apiDoc = {
    swagger: '2.0',
    basePath: '/api',
    info: {
      title: 'NodePad',
      description: 'NodePad is a simple tool to manage your NodeJs apps through REST API or UI',
      version: packageInfo.version,
    },
    tags: [
      { name: 'Application' }, { name: 'Alias' }, { name: 'ProcessManager'}, { name: 'Auth' }
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
          url: {
            type: 'string',
            example: 'http://webapp.localhost:3000'
          },
          content: {
            type: 'object',
            $ref: '#/definitions/Deployment',
          }
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
          job: {
            type: 'object',
            $ref: '#/definitions/DeploymentJob',
          },
          lastUpdate: {
            type: 'string',
            example: '2021-10-26T13:23:59.137Z'
          },
        }
      },
      DeploymentJob: {
        type: 'object',
        properties: {
          status: {
            type: 'string',
            example: 'upload'
          },
          description: {
            type: 'string',
            example: 'uploading (2MB)'
          },
          errorState: {
            type: 'boolean',
            example: false
          },
        }
      },
      Alias: {
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
          url: {
            type: 'string',
            example: 'http://webalias.localhost:3000'
          },
        },
      },
      Error: {
        type: 'object',
        properties: {
          error: {
            type: 'string',
            example: 'An error message'
          }
        }
      },
      ProcessManagerStatus: {
        type: 'object',
        properties: {
          name: {
            type: 'string',
            example: 'PM2'
          },
          info: {
            type: 'object'
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