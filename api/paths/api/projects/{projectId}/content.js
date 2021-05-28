
module.exports = function (projectService, deployService) {

  async function GET(req, res) {
    let projectId = req.params.projectId;
    res.status(200).json(deployService.getDeployment(projectId));
  }

  GET.apiDoc = {
    summary: 'Fetch deployment details',
    operationId: 'getContent',
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
        description: 'Deployment details',
        schema: {
          $ref: '#/definitions/Deployment',
        },
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

  async function POST(req, res) {
    let projectId = req.params.projectId;

    await deployService.upload(projectId, req);

    setTimeout(() => {
      res.status(201).json(deployService.getDeployment(projectId));
    }, 500)

    try {
      await deployService.extract(projectId);
      await projectService.stop(projectId);
      await deployService.install(projectId);
    } catch(err) {
      console.log(err)
    } finally {
      await projectService.start(projectId);
    }
    
  }

  POST.apiDoc = {
    summary: "Upload project binaries",
    operationId: "updateContent",
    parameters: [
      {
        in: 'path',
        name: 'projectId',
        required: true,
        type: 'string'
      },
      {
        in: "formData",
        name: 'bin',
        type: 'file',
        required: true,
      },
    ],
    responses: {
      201: {
        description: "Content uploaded",
        schema: {
          $ref: '#/definitions/Deployment',
        },
      },
      404: {
        description: "Project not found",
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
    POST
  };
};