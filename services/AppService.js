
const fs = require('fs');
const path = require('path');
const AbstractService = require('./common/AbstractService');
const { 
  ValidationError, 
  EntityNotFoundError, 
  ProcessManagerError 
} = require('./common/errors');
const AppLogger = require('./common/AppLogger');

class AppService extends AbstractService {
  
  constructor(basePath, pm2) {
    super();
    this.basePath = basePath;
    this.pm2 = pm2;
    this.appLogger = new AppLogger(basePath);
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

  pm2delete(appId) {
    return new Promise((resolve, reject) => {
      this.logger.debug({message: 'Deleting PM2 process ' + appId});
      this.pm2.delete(appId, (err) => {
        if (err) {
          this.logger.error('Error: Unable to delete PM2 process ' + appId + ': ' + String(err));
          return reject(new ProcessManagerError('PM2: ' + String(err)));
        }
        this.logger.debug({message: 'PM2 process ' + appId + ' deleted'});
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

  getAppFolders() {
    return fs.readdirSync(this.basePath, { withFileTypes: true })
      .filter(dir => dir.isDirectory())
      .map(dir => dir.name);
  }

  async read() {
    this.logger.debug('Reading application files structure');
    const data = this.getAppFolders()
      .map(dir => {
        let appData = dir.split('.');
        let app = {
          id: appData[0],
          port: Number(appData[1])
        };
        return app;
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

          resolve(data.map(app => {
            app.status = 'offline';
            if(processData[app.id] && processData[app.id].status === 'online') {
              app.status = 'online';
            }
            if(processData[app.id] && processData[app.id].monit) {
              app.memory = processData[app.id].monit.memory || 0;
              app.cpu = processData[app.id].monit.cpu || 0;
            } else {
              app.memory = 0;
              app.cpu = 0;
            }
            return app;
          }));
        });
      });
    });
  }

  create(appId, appPort) {
    this.logger.info(`Creating application '${appId}' at port ${appPort}`);
    if(!appId) {
      throw new ValidationError('Application ID is required');
    }
    if(typeof(appId) !== 'string') {
      throw new ValidationError('Application ID must be a string');
    }
    if(appId.length < 3 || appId.length > 32 ) {
      throw new ValidationError('Invalid Application ID. It must be 3 - 32 characters long');
    }
    if(!(/^[A-Za-z0-9_-]+$/).test(appId)) {
      throw new ValidationError('Invalid Application ID. Allowed characters are A-Z, a-z, 0-9, _, -');
    }
    if(!appPort) {
      throw new ValidationError('Application Port is required');
    }
    if(typeof(appPort) !== 'number' || !Number.isInteger(appPort)) {
      throw new ValidationError('Application port must be a integer');
    }
    if(appPort < 1024 || appPort > 49151) {
      throw new ValidationError('Application port must be in range of 1024 - 49151');
    }

    if(this.exist(appId)) {
      throw new ValidationError(`Application '${appId}' already exist`);
    }
    if(this.isPortBound(appPort)) {
      throw new ValidationError(`Port '${appPort}' already bound`);
    }
    const appPath = path.join(this.basePath, appId + '.' + appPort);
    this.logger.debug(`Creating ${appPath}`);
    fs.mkdirSync(appPath);
    this.logger.debug(`Creating ${path.join(appPath, 'bin')}`);
    fs.mkdirSync(path.join(appPath, 'bin'));
    this.logger.debug(`Creating ${path.join(appPath, `log-${appId}.log`)}`);
    fs.openSync(path.join(appPath, `log-${appId}.log`), 'w');
    this.appLogger.log(appId, `Application ${appId} created`);
    this.logger.debug(`Creating ${path.join(appPath, 'bin', 'index.js')}`);
    fs.writeFileSync(
      path.join(appPath, 'bin', 'index.js'),
      `#!/usr/bin/env node
      const http = require('http');

      console.log('Starting application ${appId} (port: ${appPort})...');

      http.createServer(function (request, response) {
        console.log(\`Request \${request.method} \${request.url}\`);
        response.end('Hello from ${appId}!', 'utf-8');
      }).listen(${appPort});`
    );
  }

  exist(appId) {
    return !!this.getAppFolders()
      .map(dir => {
        let appData = dir.split('.');
        return appData[0];
      })
      .find(id => id === appId);
  }

  isPortBound(port) {
    return !!this.getAppFolders()
      .map(dir => {
        let appData = dir.split('.');
        return Number(appData[1]);
      })
      .find(p => p === port);
  }

  async find(appId) {
    if(!this.exist(appId)) {
      throw new EntityNotFoundError(`Application '${appId}' not found`);
    }

    return (await this.read()).find(p => p.id === appId);
  }

  async start(appId) {
    this.logger.info(`Starting application ${appId}`);
    let app;
    app = await this.find(appId);
    this.appLogger.log(appId, `Strting application '${appId}'...`);
    const options = {
      script: path.join(this.basePath, `${app.id}.${app.port}`, 'bin', 'index.js'),
      name: app.id,
      cwd: path.join(this.basePath, `${app.id}.${app.port}`, 'bin'),
      autorestart: true,
      output: path.join(this.basePath, `${app.id}.${app.port}`, `log-${app.id}.log`),
      error: path.join(this.basePath, `${app.id}.${app.port}`, `log-${app.id}.log`),
      logDateFormat: 'YYYY-MM-DD HH:mm:ss.SSS Z'
    };
    await this.pm2connect();
    try {
      await this.pm2start(options);
    } finally {
      this.pm2disconnect();
    }

    this.logger.info(`Application ${appId} started`);
  }

  async stop(appId) {
    this.logger.info(`Stopping application ${appId}`);
    await this.find(appId);
    this.appLogger.log(appId, `Stopping application '${appId}'...`);

    await this.pm2connect();
    try {
      await this.pm2delete(appId);
    } finally {
      this.pm2disconnect();
    }

    this.logger.info(`Application ${appId} stopped`);
       
  }

  async reload(appId) {
    this.logger.info(`Reloading application ${appId}`);
    await this.find(appId);
    this.appLogger.log(appId, `Reloading application '${appId}'...`);

    await this.pm2connect();
    try {
      await this.pm2reload(appId);
    } finally {
      this.pm2disconnect();
    }
    this.logger.info(`Application ${appId} reloaded`);
  }

  async getLogs(appId, lines) {
    this.logger.debug(`Reading ${lines + ' ' || ''}log lines of '${appId}'`);
    return await this.appLogger.read(appId, lines);
  }

}

module.exports = AppService;