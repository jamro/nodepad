const AuthService = require('../../src/services/AuthService.js');

function basicAuth(user, pass) {
  return 'Basic ' + Buffer.from(user + ':' + pass).toString('base64');
}

describe('AuthService', function() { // ------------------------------------------------

  it('should always pass when auth disabled', async function() {
    const authService = new AuthService();
    expect(authService.auth()).to.be.true;
    expect(authService.auth('user898773', 'pass983')).to.be.true;
    expect(authService.authBasic()).to.be.true;
    expect(authService.authBasic(basicAuth('user-b64-898773', 'pass-b64-983'))).to.be.true;
  });

  it('should validate user data', async function() {
    const authService = new AuthService({
      user: 'admin8973',
      pass: 'secret2834'
    });
    expect(authService.auth()).to.be.false;
    expect(authService.authBasic()).to.be.false;
    expect(authService.auth('hacker874', 'pass00082')).to.be.false;
    expect(authService.auth('admin8973', 'pass00082')).to.be.false;
    expect(authService.auth('hacker874', 'secret2834')).to.be.false;

    expect(authService.authBasic(basicAuth('hacker874', 'pass00082'))).to.be.false;
    expect(authService.authBasic(basicAuth('admin8973', 'pass00082'))).to.be.false;
    expect(authService.authBasic(basicAuth('hacker874', 'secret2834'))).to.be.false;

    expect(authService.auth('admin8973', 'secret2834')).to.be.true;
    expect(authService.authBasic(basicAuth('admin8973', 'secret2834'))).to.be.true;

  });


});