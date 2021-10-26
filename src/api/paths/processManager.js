module.exports = function (appService, logger) {

  async function DELETE(req, res) {
    logger.info('stopping all processes');
    await appService.killProcessManager();
    res.status(204).end();
  }
  
  DELETE.apiDoc = {
    summary: 'Stop all app processes',
    tags: ['ProcessManager'],
    operationId: 'kill',
    consumes: ['application/json'],
    parameters: [
      {
        in: 'body',
        name: 'alias',
        schema: {
          $ref: '#/definitions/Alias',
        },
      },
    ],
    responses: {
      204: {
        description: 'Operation successful',
      },
      401: {
        description: 'Unauthorized',
        schema: {
          type: 'object',
          $ref: '#/definitions/Error',
        },
      },
      500: {
        description: 'Internal Error',
        schema: {
          type: 'object',
          $ref: '#/definitions/Error',
        },
      }
    },
  };

  async function GET(req, res) {
    const status = await appService.getProcessManagerInfo();
    res.status(200).json(status);
  }

  GET.apiDoc = {
    summary: 'Retrieve Process Manager status',
    tags: ['ProcessManager'],
    operationId: 'getStatus',
    responses: {
      200: {
        description: 'Process Manager status',
        schema: {
          type: 'object',
          $ref: '#/definitions/ProcessManagerStatus',
        },
      },
      401: {
        description: 'Unauthorized',
        schema: {
          type: 'object',
          $ref: '#/definitions/Error',
        },
      },
      500: {
        description: 'Internal Error',
        schema: {
          type: 'object',
          $ref: '#/definitions/Error',
        },
      }
    },
  };
  
  return {
    GET,
    DELETE,
  };
};