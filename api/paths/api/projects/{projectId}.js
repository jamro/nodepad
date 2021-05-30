const path = require('path')
const { ValidationError } = require('../../../../services/common/errors')
module.exports = function (projectService, logger) {

  async function PUT(req, res) {
    let projectId = req.params.projectId;
    logger.info(`updating project '${projectId}': ${JSON.stringify(req.body)}`);
    const proj = await projectService.find(projectId);
    const newStatus = req.body.status;

    if(req.body.id && req.body.id !== proj.id) {
      throw new ValidationError('Modification of project ID is not allowed');
    }

    if(req.body.port && req.body.port !== proj.port) {
      throw new ValidationError('Modification of project port is not allowed');
    }
  
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
          example: {
            status: 'online'
          }
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