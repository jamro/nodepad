module.exports = function (appService) {

  async function GET(req, res) {
    let appId = req.params.appId;
    res.status(200).json(await appService.getLogs(appId, req.query.lines));
  }

  GET.apiDoc = {
    summary: 'List application logs',
    tags: ['Application'],
    operationId: 'getLogs',
    parameters: [
      {
        in: 'path',
        name: 'appId',
        required: true,
        type: 'string'
      },
      {
        in: 'query',
        name: 'lines',
        default: 100,
        type: 'number'
      }
    ],
    responses: {
      200: {
        description: 'Application logs',
        schema: {
          type: 'array',
          items: {
            type: 'string',
          },
          example: [
            '2021-05-28 09:46:22.660 [NODEPAD] Application \'webapp\' created',
            '2021-05-28 10:25:17.667 [NODEPAD] Starting application \'webapp\'...'
          ]
        }
      },
      404: {
        description: 'Application not found',
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
    GET
  };
};