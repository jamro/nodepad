module.exports = function (appService, logger) {

  async function PUT(req, res) {
    let appId = req.params.appId;
    logger.info(`updating app '${appId}': ${JSON.stringify(req.body)}`);
    const app = await appService.find(appId);
    const newStatus = req.body.status;
  
    if(newStatus === 'online') {
      await appService.start(appId);
    } else if(app.status !== newStatus && newStatus === 'offline') {
      await appService.stop(appId);
    }

    res.status(200).json(await appService.find(appId));
  }

  PUT.apiDoc = {
    summary: 'Update hosted application',
    tags: ['Application'],
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
          $ref: '#/definitions/AppStatus',
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

  async function DELETE(req, res) {
    let appId = req.params.appId;
    logger.info(`Deleting app: ${appId}`);

    await appService.delete(appId);
    res.status(204).end();
  }
  
  DELETE.apiDoc = {
    summary: 'Delete an app',
    tags: ['Application'],
    operationId: 'deleteProject',
    parameters: [
      {
        in: 'path',
        name: 'appId',
        required: true,
        type: 'string'
      },
    ],
    responses: {
      204: {
        description: 'Operation successful',
      },
      404: {
        description: 'Entity not found',
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
    PUT,
    DELETE
  };
};