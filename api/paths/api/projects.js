module.exports = function (projectService) {

  async function POST(req, res) {
    console.log(`creating project: ${JSON.stringify(req.body)}`);
    const projectId = String(req.body.id);
    const projectStatus = String(req.body.status);
    const projectPort = Number(req.body.port);
  
    projectService.create(projectId, projectPort);
    console.log(`Project '${projectId}' created`);

    if(projectStatus === 'online') {
      await projectService.start(projectId);
    }

    res.status(201).json({
      id: projectId,
      port: projectPort,
      status: projectStatus || 'offline'
    });
  }
  
  POST.apiDoc = {
    summary: 'Create new project',
    operationId: 'createProject',
    consumes: ['application/json'],
    parameters: [
      {
        in: 'body',
        name: 'project',
        schema: {
          $ref: '#/definitions/Project',
        },
      },
    ],
    responses: {
      201: {
        description: 'Project created',
        schema: {
          type: 'object',
          $ref: '#/definitions/Project',
        },
      },
      400: {
        description: 'Incorrect input',
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

  async function GET(req, res) {
    let data = await projectService.read();
    res.status(200).json(data);
  }

  GET.apiDoc = {
    summary: 'Fetch all projects',
    operationId: 'getProjects',
    responses: {
      200: {
        description: 'List of Projects.',
        schema: {
          type: 'object',
          $ref: '#/definitions/Error',
        },
      },
      500: {
        description: 'Process manager error',
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
    GET,
    POST,
  };
};