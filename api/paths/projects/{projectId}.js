const path = require('path')

module.exports = function (projectService) {

  async function PUT(req, res) {
    let projectId = req.params.projectId;
    if(!projectService.exist(projectId)) {
      res.status(404).send('Project not found');
      return;
    }
    const status = req.body.status;
    
    try {
      switch(status) {
        case 'online': 
          await projectService.start(projectId);
          res.status(200).send();
          break;
        case 'offline': 
          await projectService.stop(projectId);
          res.status(200).send();
          break;
        default:
          res.status(400).send('Unknown status "' + status + '" requested');
      }
    } catch (err) {
      console.log(err)
      return res.status(500).send(String(err))
    }
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
      },
      400: {
        description: "Unsupported status requested",
      },
      404: {
        description: "Project not found",
      },
      500: {
        description: "Process manager error",
      },
    },
  };

  return {
    PUT
  };
};