
module.exports = function () {

  async function GET(req, res) {
    res.status(200).json({status: 'ok'});
  }

  GET.apiDoc = {
    summary: 'Authenticate',
    operationId: 'auth',
    responses: {
      200: {
        description: 'Auth ok',
        schema: {
          type: 'object',
          properties: {
            status: {
              type: 'string',
              default: 'ok'
            },
          }
        }
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