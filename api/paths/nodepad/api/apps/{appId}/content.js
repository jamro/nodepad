
module.exports = function (deployService) {

  async function GET(req, res) {
    let appId = req.params.appId;
    res.status(200).json(deployService.getDeployment(appId));
  }

  GET.apiDoc = {
    summary: 'Fetch deployment details',
    operationId: 'getContent',
    parameters: [
      {
        in: 'path',
        name: 'appId',
        required: true,
        type: 'string'
      }
    ],
    responses: {
      200: {
        description: 'Deployment details',
        schema: {
          $ref: '#/definitions/Deployment',
        },
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
    GET,
  };
};