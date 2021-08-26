const AbstractService = require('./common/AbstractService');

class AuthService extends AbstractService {

  constructor(authConfig) {
    super();
    this.authConfig = authConfig;
  }

  auth(user, pass) {
    if(!this.authConfig) {
      this.logger.debug('Auth disabled. Passing the request through...');
      return true;
    }
    if (user === this.authConfig.user && pass === this.authConfig.pass) {
      this.logger.debug('Auth OK for user "' + user + '"');
      return true;
    } else {
      this.logger.debug('Auth failed for user "' + user + '"');
      return false;
    }
  }

  authBasic(data) {
    if(!this.authConfig) {
      this.logger.debug('Auth disabled. Passing the request through...');
      return true;
    }
    const b64auth = (data || '').split(' ')[1] || '';
    const [user, pass] = Buffer.from(b64auth, 'base64').toString().split(':');
    return this.auth(user, pass);
  }
}

module.exports = AuthService;