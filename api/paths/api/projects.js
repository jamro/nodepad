module.exports = function (projectService) {

  async function POST(req, res) {
    console.log(`creating project: ${JSON.stringify(req.body)}`);
    const projectId = String(req.body.id);
    const projectStatus = String(req.body.status);
    const projectPort = Number(req.body.port);

    try {
      if(!projectId) {
        throw new Error('Error: Project ID is required');
      }
      if(typeof(projectId) !== 'string') {
        throw new Error('Error: Project ID must be a string');
      }
      if(projectId.length < 3 || projectId.length > 32 ) {
        throw new Error('Error: Invalid Project ID. It must be 3 - 32 characters long');
      }
      if(!(/^[A-Za-z0-9_-]+$/).test(projectId)) {
        throw new Error('Error: Invalid Project ID. Allowed characters are A-Z, a-z, 0-9, _, -');
      }
      if(!projectPort) {
        throw new Error('Error: Project Port is required');
      }
      if(typeof(projectPort) !== 'number' || !Number.isInteger(projectPort)) {
        throw new Error('Error: Project port must be a integer');
      }
      if(projectPort < 1024 || projectPort > 49151) {
        throw new Error('Error: Project port must be in range of 1024 - 49151');
      }

      
    } catch(err) {
      res.status(400).send(err.message);
      return;
    }

    if (projectService.exist(projectId)) {
      res.status(409).send('Project already exist');
      return;
    } 

    if (projectService.isPortBound(projectPort)) {
      res.status(409).send('Port already bound');
      return;
    } 

    projectService.create(projectId, projectPort);
    console.log(`Project '${projectId}' created`);

    if(projectStatus === 'online') {
      await projectService.start(projectId);
    }

    res.status(201).send();
    return;
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
      },
      409: {
        description: 'Cannot create project. Project with that ID alrady exist',
      },
      400: {
        description: 'Incorrect input',
      },
      401: {
        description: 'Unauthorized',
      }
    },
  };

  async function GET(req, res) {
    let data;
    try {
      data = await projectService.read();
    } catch (err) {
      return res.status(500).send(String(err)); 
    }

    res.status(200).json(data);
  }

  GET.apiDoc = {
    summary: 'Fetch all projects',
    operationId: 'getProjects',
    responses: {
      200: {
        description: 'List of Projects.',
        schema: {
          type: 'array',
          items: {
            $ref: '#/definitions/Project',
          },
        },
      },
      500: {
        description: 'Process manager error',
      },
      401: {
        description: 'Unauthorized',
      },
    },
  };
  
  return {
    GET,
    POST,
  };
};