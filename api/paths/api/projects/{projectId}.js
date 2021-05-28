const path = require('path')

module.exports = function (projectService) {

  async function PUT(req, res) {
    let projectId = req.params.projectId;
    const proj = await projectService.find(projectId);
    const newStatus = req.body.status;
  
    if(newStatus === 'online') {
      await projectService.start(projectId);
    } else if(proj.status !== newStatus && newStatus === 'offline') {
      await projectService.stop(projectId);
    }

    res.status(200).json(await projectService.find(projectId));
  }

  PUT.apiDoc = {
    summary: "Update Project",
    operationId: "updatePoject",
    parameters: [
      {
        in: 'path',
        name: 'projectId',
        required: true,
        type: 'string'
      },
      {
        in: "body",
        name: "project",
        required: true,
        schema: {
          $ref: "#/definitions/Project",
        },
      },
    ],
    responses: {
      200: {
        description: "Request ok",
        schema: {
          $ref: "#/definitions/Project",
        },
      },
      400: {
        description: "Bad request",
        schema: {
          type: 'object',
          $ref: '#/definitions/Error',
        },
      },
      404: {
        description: "Project not found",
        schema: {
          type: 'object',
          $ref: '#/definitions/Error',
        },
      },
      500: {
        description: "Process manager error",
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