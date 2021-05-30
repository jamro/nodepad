
const fs = require('fs');
const path = require('path');
const AbstractService = require('./common/AbstractService');
const { 
  ValidationError, 
  EntityNotFoundError, 
  ProcessManagerError 
} = require('./common/errors');
const ProjectLogger = require('./common/ProjectLogger');

class ProjectService extends AbstractService {
  
  constructor(basePath, pm2) {
    super();
    this.basePath = basePath;
    this.pm2 = pm2;
    this.projectLogger = new ProjectLogger(basePath);
  }

  pm2connect() {
    return new Promise((resolve, reject) => {
      this.logger.debug('Connecting to PM2');
      this.pm2.connect((err) => {
        if (err) {
          this.logger.error('Error: Unable to connect PM2: ' + String(err));
          return reject(new ProcessManagerError('PM2: ' + String(err)));
        }
        this.logger.debug('Connected to PM2');
        resolve();
      });
    });
  }

  pm2disconnect() {
    this.logger.debug('Disconnect PM2');
    this.pm2.disconnect();
  }

  pm2start(options) {
    return new Promise((resolve, reject) => {
      this.logger.debug({message: 'Starting PM2 process', meta: options});
      this.pm2.start(options, (err) => {
        if (err) {
          this.logger.error({message: 'Error: Unable to start PM2 process', meta: options});
          return reject(new ProcessManagerError('PM2: ' + String(err)));
        }
        this.logger.debug({message: 'PM2 process started', meta: options});
        resolve();
      });
    });
  }

  pm2delete(projectId) {
    return new Promise((resolve, reject) => {
      this.logger.debug({message: 'Deleting PM2 process ' + projectId});
      this.pm2.delete(projectId, (err) => {
        if (err) {
          this.logger.error('Error: Unable to delete PM2 process ' + projectId + ': ' + String(err));
          return reject(new ProcessManagerError('PM2: ' + String(err)));
        }
        this.logger.debug({message: 'PM2 process ' + projectId + ' deleted'});
        resolve();
      });
    });
  }

  pm2list() {
    return new Promise((resolve, reject) => {
      this.logger.debug('Listing PM2 processes');
      this.pm2.list((err, list) => {
        if (err) {
          this.logger.error('Error: Unable to list PM2 processes: ' + String(err));
          return reject(new ProcessManagerError('PM2: ' + String(err)));
        }
        this.logger.debug('Listing of PM2 processes received');
        resolve(list);
      });
    });
  }

  getProjectFolders() {
    return fs.readdirSync(this.basePath, { withFileTypes: true })
      .filter(dir => dir.isDirectory())
      .map(dir => dir.name);
  }

  async read() {
    this.logger.debug('Reading project files structure');
    const data = this.getProjectFolders()
      .map(dir => {
        let projData = dir.split('.');
        let proj = {
          id: projData[0],
          port: Number(projData[1])
        };
        return proj;
      });

    this.logger.debug('Fetching PM2 process status');
    return await new Promise((resolve, reject) => {
      this.pm2.connect((err) => {
        this.logger.debug('Connecting to PM2');
        if (err) {
          this.logger.debug('Error: Unable to connect PM2: ' + String(err));
          this.logger.error(err);
          return reject(new ProcessManagerError('PM2: ' + String(err)));
        }
        this.logger.debug('Connected to PM2');
        this.logger.debug('Fetching list of PM2 processes');
        this.pm2.list((err, list) => {
          this.pm2.disconnect();
          if (err) {
            this.logger.error(err);
            return reject(new ProcessManagerError('PM2: ' + String(err)));
          }
          this.logger.debug('List of PM2 processes received');
          const processData = list
            .map(p => ({
              name: p.name,
              status: p.pm2_env.status,
              monit: p.monit,
              restartTime: p.pm2_env.restart_time
            }))
            .reduce((prev, proc) => {
              let result = {...prev};
              result[proc.name] = proc;
              return result;
            }, {});

          resolve(data.map(proj => {
            proj.status = 'offline';
            if(processData[proj.id] && processData[proj.id].status === 'online') {
              proj.status = 'online';
            }
            return proj;
          }));
        });
      });
    });
  }

  create(projectId, projectPort) {
    this.logger.info(`Creating project '${projectId}' at port ${projectPort}`);
    if(!projectId) {
      throw new ValidationError('Project ID is required');
    }
    if(typeof(projectId) !== 'string') {
      throw new ValidationError('Project ID must be a string');
    }
    if(projectId.length < 3 || projectId.length > 32 ) {
      throw new ValidationError('Invalid Project ID. It must be 3 - 32 characters long');
    }
    if(!(/^[A-Za-z0-9_-]+$/).test(projectId)) {
      throw new ValidationError('Invalid Project ID. Allowed characters are A-Z, a-z, 0-9, _, -');
    }
    if(!projectPort) {
      throw new ValidationError('Project Port is required');
    }
    if(typeof(projectPort) !== 'number' || !Number.isInteger(projectPort)) {
      throw new ValidationError('Project port must be a integer');
    }
    if(projectPort < 1024 || projectPort > 49151) {
      throw new ValidationError('Project port must be in range of 1024 - 49151');
    }

    if(this.exist(projectId)) {
      throw new ValidationError(`Project '${projectId}' already exist`);
    }
    if(this.isPortBound(projectPort)) {
      throw new ValidationError(`Port '${projectPort}' already bound`);
    }
    const projectPath = path.join(this.basePath, projectId + '.' + projectPort);
    this.logger.debug(`Creating ${projectPath}`);
    fs.mkdirSync(projectPath);
    this.logger.debug(`Creating ${path.join(projectPath, 'bin')}`);
    fs.mkdirSync(path.join(projectPath, 'bin'));
    this.logger.debug(`Creating ${path.join(projectPath, `log-${projectId}.log`)}`);
    fs.openSync(path.join(projectPath, `log-${projectId}.log`), 'w');
    this.projectLogger.log(projectId, `Project ${projectId} created`);
    this.logger.debug(`Creating ${path.join(projectPath, 'bin', 'index.js')}`);
    fs.writeFileSync(
      path.join(projectPath, 'bin', 'index.js'),
      `#!/usr/bin/env node
      const http = require('http');

      console.log('Starting project ${projectId} (port: ${projectPort})...');

      http.createServer(function (request, response) {
        console.log(\`Request \${request.method} \${request.url}\`);
        response.end('Hello from ${projectId}!', 'utf-8');
      }).listen(${projectPort});`
    );
  }

  exist(projectId) {
    return !!this.getProjectFolders()
      .map(dir => {
        let projData = dir.split('.');
        return projData[0];
      })
      .find(id => id === projectId);
  }

  isPortBound(port) {
    return !!this.getProjectFolders()
      .map(dir => {
        let projData = dir.split('.');
        return Number(projData[1]);
      })
      .find(p => p === port);
  }

  async find(projectId) {
    if(!this.exist(projectId)) {
      throw new EntityNotFoundError(`Project '${projectId}' not found`);
    }

    return (await this.read()).find(p => p.id === projectId);
  }

  async start(projectId) {
    this.logger.info(`Starting project ${projectId}`);
    let proj;
    proj = await this.find(projectId);
    this.projectLogger.log(projectId, `Strting project '${projectId}'...`);
    const options = {
      script: path.join(this.basePath, `${proj.id}.${proj.port}`, 'bin', 'index.js'),
      name: proj.id,
      cwd: path.join(this.basePath, `${proj.id}.${proj.port}`, 'bin'),
      autorestart: true,
      output: path.join(this.basePath, `${proj.id}.${proj.port}`, `log-${proj.id}.log`),
      error: path.join(this.basePath, `${proj.id}.${proj.port}`, `log-${proj.id}.log`),
      logDateFormat: 'YYYY-MM-DD HH:mm:ss.SSS Z'
    };
    await this.pm2connect();
    try {
      await this.pm2start(options);
    } finally {
      this.pm2disconnect();
    }

    this.logger.info(`Project ${projectId} started`);
  }

  async stop(projectId) {
    this.logger.info(`Stopping project ${projectId}`);
    await this.find(projectId);
    this.projectLogger.log(projectId, `Stopping project '${projectId}'...`);

    await this.pm2connect();
    try {
      await this.pm2delete(projectId);
    } finally {
      this.pm2disconnect();
    }

    this.logger.info(`Project ${projectId} stopped`);
       
  }

  async reload(projectId) {
    this.logger.info(`Reloading project ${projectId}`);
    await this.find(projectId);
    this.projectLogger.log(projectId, `Reloading project '${projectId}'...`);

    await this.pm2connect();
    try {
      await this.pm2reload(projectId);
    } finally {
      this.pm2disconnect();
    }
    this.logger.info(`Project ${projectId} reloaded`);
  }

  async getLogs(projectId, lines) {
    this.logger.debug(`Reading ${lines + ' ' || ''}log lines of '${projectId}'`);
    return await this.projectLogger.read(projectId, lines);
  }

}

module.exports = ProjectService;