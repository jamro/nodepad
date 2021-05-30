const { ValidationError } = require('../../../../../services/common/errors');
module.exports = function (appService, logger) {

  async function PUT(req, res) {
    let appId = req.params.appId;
    logger.info(`updating app '${appId}': ${JSON.stringify(req.body)}`);
    const app = await appService.find(appId);
    const newStatus = req.body.status;

    if(req.body.id && req.body.id !== app.id) {
      throw new ValidationError('Modification of app ID is not allowed');
    }

    if(req.body.port && req.body.port !== app.port) {
      throw new ValidationError('Modification of app port is not allowed');
    }
  
    if(newStatus === 'online') {
      await appService.start(appId);
    } else if(app.status !== newStatus && newStatus === 'offline') {
      await appService.stop(appId);
    }

    res.status(200).json(await appService.find(appId));
  }

  PUT.apiDoc = {
    summary: 'Update hosted application',
    operationId: 'updatePoject',
    parameters: [
      {
        in: 'path',
        name: 'appId',
        required: true,
        type: 'string'
      },
      {
        in: 'body',
        name: 'app',
        required: true,
        schema: {
          $ref: '#/definitions/App',
          example: {
            status: 'online'
          }
        },
      },
    ],
    responses: {
      200: {
        description: 'Request ok',
        schema: {
          $ref: '#/definitions/App',
        },
      },
      400: {
        description: 'Bad request',
        schema: {
          type: 'object',
          $ref: '#/definitions/Error',
        },
      },
      404: {
        description: 'Application not found',
        schema: {
          type: 'object',
          $ref: '#/definitions/Error',
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
      }
    },
  };

  return {
    PUT
  };
};