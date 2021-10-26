module.exports = function (aliasService, logger) {

  async function DELETE(req, res) {
    let aliasId = req.params.aliasId;
    logger.info(`Deleting alias: ${aliasId}`);

    await aliasService.delete(aliasId);
    res.status(204).end();
  }
  
  DELETE.apiDoc = {
    summary: 'Delete an alias',
    tags: ['Alias'],
    operationId: 'deleteAliases',
    parameters: [
      {
        in: 'path',
        name: 'aliasId',
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
    DELETE
  };
};