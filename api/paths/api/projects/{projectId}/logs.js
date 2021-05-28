
module.exports = function (projectService, deployService) {

  async function GET(req, res) {
    let projectId = req.params.projectId;
    if(!projectService.exist(projectId)) {
      res.status(404).send('Project not found');
      return;
    }
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
            type: 'string'
          }
        }
      },
      404: {
        description: 'Project not found',
      },
      401: {
        description: 'Unauthorized',
      }
    },
  };

  return {
    GET
  };
};