
module.exports = function (appService, deployService, logger) {

  async function POST(req, res) {
    let appId = req.params.appId;

    logger.info(`deploying new content of '${appId}'. Phase: Upload`);

    await deployService.upload(appId, req);

    setTimeout(() => {
      res.status(201).json(deployService.getDeployment(appId));
    }, 500);

    try {
      logger.info(`deploying new content of '${appId}'. Phase: Extract`);
      await deployService.extract(appId);
      logger.info(`deploying new content of '${appId}'. Phase: Stop`);
      await appService.stop(appId);
      logger.info(`deploying new content of '${appId}'. Phase: Install`);
      await deployService.install(appId);
      logger.info(`deploying new content of '${appId}'. Phase: Completed`);
    } catch(err) {
      logger.error(err);
    } finally {
      logger.info(`deploying new content of '${appId}'. Phase: Starting`);
      await appService.start(appId);
    }
    
  }

  POST.apiDoc = {
    summary: 'Deploy application as a ZIP file',
    tags: ['Application'],
    operationId: 'updateContent',
    parameters: [
      {
        in: 'path',
        name: 'appId',
        required: true,
        type: 'string'
      },
      {
        in: 'formData',
        name: 'bin',
        type: 'file',
        required: true,
      },
    ],
    responses: {
      201: {
        description: 'Content uploaded',
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
    POST
  };
};