
const fs = require('fs');
const path = require('path');
const AbstractService = require('./common/AbstractService');
const { 
  ValidationError
} = require('./common/errors');

class AliasService extends AbstractService {
  
  constructor(basePath, defaultScheme, rootDomain, defaultPort) {
    super();
    this.defaultScheme = defaultScheme;
    this.rootDomain = rootDomain;
    this.defaultPort = defaultPort;
    this.basePath = basePath;
  }

  getAliasList() {
    return fs.readdirSync(this.basePath, { withFileTypes: true })
      .filter(file => file.name.match(/\.alias$/))
      .map(file => file.name.split('.'))
      .map(row => ({
        id: row[0],
        port: row[1],
        url: this.getAliasUrl(row[0])
      }));
  }

  create(aliasId, appPort) {
    this.logger.info(`Creating alias '${aliasId}' at port ${appPort}`);
    if(!aliasId) {
      throw new ValidationError('Alias ID is required');
    }
    if(typeof(aliasId) !== 'string') {
      throw new ValidationError('Alias ID must be a string');
    }
    if(aliasId.length < 3 || aliasId.length > 32 ) {
      throw new ValidationError('Invalid Alias ID. It must be 3 - 32 characters long');
    }
    if(!(/^[A-Za-z0-9_-]+$/).test(aliasId)) {
      throw new ValidationError('Invalid Alias ID. Allowed characters are A-Z, a-z, 0-9, _, -');
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

    if(this.exist(aliasId)) {
      throw new ValidationError(`Alias '${aliasId}' already exist`);
    }

    const aliasPath = path.join(this.basePath, aliasId + '.' + appPort + '.alias');
    this.logger.debug(`Creating ${aliasPath}`);
    fs.writeFileSync(aliasPath, `Alias '${aliasId}' -> ${appPort}`);
  }

  exist(aliasId) {
    return !!this.getAliasList()
      .find(alias => alias.id === aliasId);
  }

  getAliasUrl(aliasId) {
    const port = this.defaultPort !== 80 ? `:${this.defaultPort}` : '';
    return `${this.defaultScheme}://${aliasId}.${this.rootDomain}${port}`;
  }


}

module.exports = AliasService;