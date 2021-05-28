
module.exports = function (projectService, deployService) {

  async function GET(req, res) {
    let projectId = req.params.projectId;
    res.status(200).json(await projectService.getLogs(projectId));
  }

  GET.apiDoc = {
    summary: 'Fetch project logs',
    operationId: 'getLogs',
    parameters: [
      {
        in: 'path',
        name: 'projectId',
        required: true,
        type: 'string'
      }
    ],
    responses: {
      200: {
        description: 'Project logs',
        schema: {
          type: 'array',
          items: {
            type: 'string',
          },
          example: [
            "2021-05-28 09:46:22.660 [NODEPAD] Project webapp created",
            "2021-05-28 10:25:17.667 [NODEPAD] Strting project 'webapp'..."
          ]
        }
      },
      404: {
        description: 'Project not found',
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