
module.exports = function (projectService, deployService) {


  async function GET(req, res) {
    let projectId = req.params.projectId;
    if(!projectService.exist(projectId)) {
      res.status(404).send('Project not found');
      return;
    }
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
      },
      401: {
        description: 'Unauthorized',
      }
    },
  };

  async function POST(req, res) {
    let projectId = req.params.projectId;
    if(!projectService.exist(projectId)) {
      res.status(404).send('Project not found');
      return;
    }

    await deployService.upload(projectId, req);

    res.status(200).send();

    try {
      await deployService.extract(projectId);
      await projectService.stop(projectId);
      await deployService.install(projectId);
    } catch(err) {
      console.log(err)
    }
    await projectService.start(projectId);
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
      200: {
        description: "Content uploaded",
      },
      404: {
        description: "Project not found",
      },
      401: {
        description: 'Unauthorized',
      }
    },
  };

  return {
    GET,
    POST
  };
};