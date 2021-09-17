module.exports = function (aliasService, logger) {

  async function POST(req, res) {
    logger.info(`creating alias: ${JSON.stringify(req.body)}`);
    const id = String(req.body.id);
    const port = Number(req.body.port);
  
    aliasService.create(id, port);

    res.status(201).json({
      id: id,
      port: port,
      url: aliasService.getAliasUrl(id)
    });
  }
  
  POST.apiDoc = {
    summary: 'Create new alias for application',
    tags: ['Alias'],
    operationId: 'createAlias',
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
      201: {
        description: 'Alias created',
        schema: {
          type: 'object',
          $ref: '#/definitions/Alias',
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
    let data = await aliasService.getAliasList();
    res.status(200).json(data);
  }

  GET.apiDoc = {
    summary: 'List all aliases',
    tags: ['Alias'],
    operationId: 'getAliases',
    responses: {
      200: {
        description: 'List of aliases.',
        schema: {
          type: 'object',
          $ref: '#/definitions/Alias',
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