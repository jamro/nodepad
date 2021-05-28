
const fs = require('fs');
const path = require('path');
const { 
  ValidationError, 
  EntityNotFoundError, 
  ProcessManagerError 
} = require('./common/errors');
const ProjectLogger = require('./common/ProjectLogger');

class ProjectService {
  
  constructor(basePath, pm2) {
    this.basePath = basePath;
    this.pm2 = pm2;
    this.debug = true;
    this.logger = new ProjectLogger(basePath);
  }

  log(...args) {
    if(this.debug) {
      console.log(...args);
    }
  }

  pm2connect() {
    return new Promise((resolve, reject) => {
      this.pm2.connect((err) => {
        if (err) {
          return reject(new ProcessManagerError('PM2: ' + String(err)));
        }
        resolve();
      });
    });
  }

  pm2disconnect() {
    this.pm2.disconnect();
  }

  pm2start(options) {
    return new Promise((resolve, reject) => {
      this.pm2.start(options, (err) => {
        if (err) {
          return reject(new ProcessManagerError('PM2: ' + String(err)));
        }
        resolve();
      });
    });
  }

  pm2delete(projectId) {
    return new Promise((resolve, reject) => {
      this.pm2.delete(projectId, (err) => {
        if (err) {
          return reject(new ProcessManagerError('PM2: ' + String(err)));
        }
        resolve();
      });
    });
  }

  pm2list() {
    return new Promise((resolve, reject) => {
      this.pm2.list((err, list) => {
        if (err) {
          return reject(new ProcessManagerError('PM2: ' + String(err)));
        }
        resolve(list);
      });
    });
  }

  async read() {
    const data = fs.readdirSync(this.basePath, { withFileTypes: true })
      .filter(dir => dir.isDirectory())
      .map(dir => {
        let projData = dir.name.split('.');
        let proj = {
          id: projData[0],
          port: Number(projData[1])
        };
        return proj;
      });

    return await new Promise((resolve, reject) => {
      this.pm2.connect((err) => {
        if (err) {
          this.log(err);
          return reject(new ProcessManagerError('PM2: ' + String(err)));
        }
        this.pm2.list((err, list) => {
          this.pm2.disconnect();
          if (err) {
            this.log(err);
            return reject(new ProcessManagerError('PM2: ' + String(err)));
          }
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
            proj.status = processData[proj.id] ? processData[proj.id].status : 'offline';
            return proj;
          }));
        });
      });
    });
  }

  create(projectId, projectPort) {
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
    fs.mkdirSync(projectPath);
    fs.mkdirSync(path.join(projectPath, 'bin'));
    fs.openSync(path.join(projectPath, `log-${projectId}.log`), 'w');
    this.logger.log(projectId, `Project ${projectId} created`);
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
    return !!fs.readdirSync(this.basePath, { withFileTypes: true })
      .filter(dir => dir.isDirectory())
      .map(dir => {
        let projData = dir.name.split('.');
        return projData[0];
      })
      .find(id => id === projectId);
  }

  isPortBound(port) {
    return !!fs.readdirSync(this.basePath, { withFileTypes: true })
      .filter(dir => dir.isDirectory())
      .map(dir => {
        let projData = dir.name.split('.');
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
    let proj;
    proj = await this.find(projectId);
    this.logger.log(projectId, `Strting project '${projectId}'...`);
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

  }

  async stop(projectId) {
    await this.find(projectId);
    this.logger.log(projectId, `Stopping project '${projectId}'...`);

    await this.pm2connect();
    try {
      await this.pm2delete(projectId);
    } finally {
      this.pm2disconnect();
    }
       
  }

  async reload(projectId) {
    await this.find(projectId);
    this.logger.log(projectId, `Reloading project '${projectId}'...`);

    await this.pm2connect();
    try {
      await this.pm2reload(projectId);
    } finally {
      this.pm2disconnect();
    }
       
  }

  async getLogs(projectId, lines) {
    return await this.logger.read(projectId, lines);
  }

}

module.exports = ProjectService;