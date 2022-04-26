const fs = require('fs');
const fsPromises = require('fs').promises;
const path = require('path');
const { spawn } = require('child_process');
const AbstractService = require('./common/AbstractService');
const { 
  ValidationError, 
  EntityNotFoundError, 
  ProcessManagerError 
} = require('./common/errors');
const AppLogger = require('./common/AppLogger');

const PM2_MODULE_PATH = path.dirname(require.resolve('pm2'));
const PM2_BIN_PATH = path.resolve(PM2_MODULE_PATH, 'bin', 'pm2');

class AppService extends AbstractService {
  
  constructor(basePath, defaultScheme, rootDomain, defaultPort, pm2) {
    super();
    this.defaultScheme = defaultScheme;
    this.rootDomain = rootDomain;
    this.defaultPort = defaultPort;
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
    const folders =  this.getAppFolders();

    const data = folders
      .map(dir => {
        let appData = dir.split('.');
        let app = {
          id: appData[0],
          port: Number(appData[1]),
          url: this.getAppUrl(appData[0]),
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

      const port = process?.env?.port;

      if(!port) {
        throw new  Error('PORT env not defined');
      }

      console.log('Starting application ${appId} (port: ' + port + ')...');

      http.createServer(function (request, response) {
        console.log(\`Request \${request.method} \${request.url}\`);
        response.end('Hello from ${appId}!', 'utf-8');
      }).listen(port);`
    );
    this.emit('event', {type: 'app-create', appId});
  }

  async delete(appId) {
    const app = this.getAppFolders()
      .map(dir => {
        let appData = dir.split('.');
        return {
          id: appData[0],
          port: appData[1]
        };
      })
      .find(a => a.id === appId);

    if(!app) {
      throw new EntityNotFoundError(`Application '${appId}' not found`);
    }
    const appPath = path.join(this.basePath, `${app.id}.${app.port}`);

    this.logger.info(`Deleting app at ${appPath}`);
    await this.stop(appId);
    await fsPromises.rm(appPath, { recursive: true });
    this.emit('event', {type: 'app-delete', appId});
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
    this.appLogger.log(appId, `Starting application '${appId}'...`);
    const appRunnerPath = path.join(this.basePath, `${app.id}.${app.port}`, 'bin', 'index.js');
    if(!fs.existsSync(appRunnerPath)) {
      throw new ProcessManagerError('Unable to find app script at ' + appRunnerPath);
    }
    const options = {
      script: appRunnerPath,
      name: app.id,
      cwd: path.join(this.basePath, `${app.id}.${app.port}`, 'bin'),
      autorestart: true,
      restart_delay: 5000,
      max_restarts: 10,
      output: path.join(this.basePath, `${app.id}.${app.port}`, `log-${app.id}.log`),
      error: path.join(this.basePath, `${app.id}.${app.port}`, `log-${app.id}.log`),
      logDateFormat: 'YYYY-MM-DD HH:mm:ss.SSS Z',
      port: app.port
    };
    await this.pm2connect();
    try {
      await this.pm2start(options);
      fs.closeSync(fs.openSync(path.join(this.basePath, `${app.id}.${app.port}`, '.autostart'), 'w'));
    } finally {
      this.pm2disconnect();
    }

    this.logger.info(`Application ${appId} started`);
    this.emit('event', {type: 'app-start', appId});
  }

  async stop(appId) {
    this.logger.info(`Stopping application ${appId}`);
    const app = await this.find(appId);
    this.appLogger.log(appId, `Stopping application '${appId}'...`);

    await this.pm2connect();
    try {
      await this.pm2delete(appId);
      const autostartPath = path.join(this.basePath, `${app.id}.${app.port}`, '.autostart');
      if(fs.existsSync(autostartPath)) {
        fs.unlinkSync(autostartPath);
      }
    } finally {
      this.pm2disconnect();
    }

    this.logger.info(`Application ${appId} stopped`);
    this.emit('event', {type: 'app-stop', appId});
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

  async autostart() {
    const apps = (await this.read()).map(app => ({
      ...app,
      autostart: fs.existsSync(path.resolve(this.basePath, `${app.id}.${app.port}`, '.autostart'))
    }));
    for(let i=0; i < apps.length; i++) {
      if(apps[i].autostart && apps[i].status !== 'online') {
        this.logger.info(`Restoring "${apps[i].id}" to online state`);
        await this.start(apps[i].id);
      } else if(!apps[i].autostart && apps[i].status === 'online') {
        this.logger.info(`Restoring "${apps[i].id}" to offline state`);
        await this.stop(apps[i].id);
      }
    }
  }

  async getLogs(appId, lines) {
    this.logger.debug(`Reading ${lines + ' ' || ''}log lines of '${appId}'`);
    return await this.appLogger.read(appId, lines);
  }

  getAppUrl(appId) {
    const port = this.defaultPort !== 80 ? `:${this.defaultPort}` : '';
    return `${this.defaultScheme}://${appId}.${this.rootDomain}${port}`;
  }

  async killProcessManager() {
    await new Promise((resolve) => {
      const proc = spawn(PM2_BIN_PATH, ['kill']);
      
      proc.on('close', () => {
        return resolve();
      });
    });
  }

  async getProcessManagerInfo() {
    const output = await new Promise((resolve, reject) => {
      const proc = spawn(PM2_BIN_PATH, ['report', '--no-color']);
      let data = '';
      proc.stdout.on('data', d => {
        data += d;
      });
      
      proc.stderr.on('data', err => {
        return reject(new Error(err));
      });
      
      proc.on('error', (err) => {
        return reject(err);
      });
      
      proc.on('close', () => {
        return resolve(data);
      });
    });

    const lines = output.split('\n');
    const headerPattern = /-+ (.*) -+/;
    const paramPattern = /^([\w ]+)\s*: (.*)$/;
    let regexMatch;
    let info = {};
    let section = '';
    for(let line of lines) {
      line = line.replace(/[\u001b\u009b][[()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-ORZcf-nqry=><]/g, ''); //eslint-disable-line no-control-regex
      regexMatch = headerPattern.exec(line);
      if(regexMatch) {
        section = regexMatch[1].toLowerCase().trim();
        info[section] = {};
      }
      regexMatch = paramPattern.exec(line);
      if(section && regexMatch) {
        info[section][regexMatch[1].trim()] = regexMatch[2].trim();
      }
    }

    const fields = Object.keys(info);
    for(let field of fields) {
      if(Object.keys(info[field]).length === 0) {
        delete info[field];
      }
    }

    return {
      name: 'PM2',
      info
    };
  }

}

module.exports = AppService;