module.exports = function (appService, deployService, logger) {

  async function POST(req, res) {
    logger.info(`creating application: ${JSON.stringify(req.body)}`);
    const appId = String(req.body.id);
    const appStatus = String(req.body.status);
    const appPort = Number(req.body.port);
  
    appService.create(appId, appPort);

    if(appStatus === 'online') {
      await appService.start(appId);
    }

    res.status(201).json({
      id: appId,
      port: appPort,
      status: appStatus || 'offline',
      memory: 0,
      cpu: 0,
      url: appService.getAppUrl(appId),
      content: {
        lastUpdate: new Date().toISOString()
      }
    });
  }
  
  POST.apiDoc = {
    summary: 'Create new application to be hosted',
    tags: ['Application'],
    operationId: 'createApp',
    consumes: ['application/json'],
    parameters: [
      {
        in: 'body',
        name: 'app',
        schema: {
          $ref: '#/definitions/App',
        },
      },
    ],
    responses: {
      201: {
        description: 'Application created',
        schema: {
          type: 'object',
          $ref: '#/definitions/App',
        },
      },
      400: {
        description: 'Incorrect input',
        schema: {
          type: 'object',
          $ref: '#/definitions/Error',
        },
      },
      401: {
        description: 'Unauthorized',
        schema: {
          type: 'object',
          $ref: '#/definitions/Error',
        },
      }
    },
  };

  async function GET(req, res) {
    let data = await appService.read();
    data = data.map(d => ({
      ...d,
      content: deployService.getDeployment(d.id)
    }));
    res.status(200).json(data);
  }

  GET.apiDoc = {
    summary: 'List all hosted application',
    tags: ['Application'],
    operationId: 'getApps',
    responses: {
      200: {
        description: 'List of applications.',
        schema: {
          type: 'object',
          $ref: '#/definitions/App',
        },
      },
      500: {
        description: 'Process manager error',
        schema: {
          type: 'object',
          $ref: '#/definitions/Error',
        },
      },
      401: {
        description: 'Unauthorized',
        schema: {
          type: 'object',
          $ref: '#/definitions/Error',
        },
      },
    },
  };
  
  return {
    GET,
    POST,
  };
};