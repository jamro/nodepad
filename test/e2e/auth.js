const chai = require('chai');
const http = require('http');
const chaiAsPromised = require('chai-as-promised');
const path = require('path');
const fs = require('fs');
const { createDashboard } = require('../../src/dashboard');
const { createProxy } = require('../../src/proxy');
const axios = require('axios');
const pm2 = require('pm2');


chai.use(chaiAsPromised);
const expect = chai.expect;

function basicAuth(user, pass) {
  return 'Basic ' + Buffer.from(user + ':' + pass).toString('base64');
}

function createWorkspace() {
  const workspaceName = (new Date().getTime() * 1000 + Math.floor(Math.random()*1000)).toString(16);
  const workspacePath = path.resolve(__dirname, '..', '..', 'tmp', workspaceName);
  fs.mkdirSync(workspacePath);
  return workspacePath;
}

function clearWorkspace(path) {
  fs.rmSync(path, { recursive: true });
}

const APP_ID  = 'my-test-app-7673';
const ALIAS_ID  = 'some-test-alias-5543';
const NODEPAD_PORT = 39211;
const PROXY_PORT = 39311;

describe('E2E: Auth', function() {

  let e2eWorkspace;
  let appServer;
  let proxyServer;
  let app;
  let proxy;

  this.timeout(5000);

  beforeEach(async function() {

    e2eWorkspace = createWorkspace();

    const appConfig = {
      dashboardPort: NODEPAD_PORT,
      proxyPort: PROXY_PORT,
      appRepoPath: e2eWorkspace,
      logLevel: 'silent',
      auth: {
        user: 'admin731',
        pass: 'secret731'
      }
    };

    app = createDashboard(appConfig);
    proxy = createProxy(appConfig);

    app.set('port', NODEPAD_PORT);
    appServer = http.createServer(app);
    appServer.listen(NODEPAD_PORT);

    await new Promise(resolve => {
      appServer.on('listening', () => {
        setTimeout(() => resolve(), 500);
      });
    });

    proxy.set('port', PROXY_PORT);
    proxyServer = http.createServer(proxy);
    proxyServer.listen(PROXY_PORT);

    await new Promise(resolve => {
      proxyServer.on('listening', () => {
        setTimeout(() => resolve(), 500);
      });
    });
    
  });

  afterEach(async function() {
    clearWorkspace(e2eWorkspace);
    
    await new Promise(resolve => proxyServer.close(() => resolve()));
    await new Promise(resolve => appServer.close(() => resolve()));
    app.destroy();
    
    await new Promise(resolve => {
      pm2.connect((err) => {
        if(err) {
          resolve();
        }
        pm2.delete(APP_ID, () => {
          pm2.disconnect();
          resolve();
        });
      });
    });
    
  });

  [
    {method: 'get', uri: 'auth'},
    {method: 'get', uri: 'processManager'},
    {method: 'delete', uri: 'processManager'},
    {method: 'get', uri: 'apps'},
    {method: 'post', uri: 'apps'},
    {method: 'get', uri: 'aliases'},
    {method: 'post', uri: 'aliases'},
    {method: 'delete', uri: `aliases/${ALIAS_ID}`},
    {method: 'put', uri: `apps/${APP_ID}`},
    {method: 'delete', uri: `apps/${APP_ID}`},
    {method: 'get', uri: `apps/${APP_ID}/logs`},
    {method: 'get', uri: `apps/${APP_ID}/content`},
    {method: 'post', uri: `apps/${APP_ID}/content/zip`},
  ].forEach((data) => {
    it(`should allow athorized only to ${data.method.toUpperCase()} /api/${data.uri}`, async function() {
      const response1 = await axios(`http://localhost:${NODEPAD_PORT}/api/${data.uri}`, {
        method: data.method,
        validateStatus: () => true
      });
      expect(response1).to.have.property('status', 401);

      const response2 = await axios(`http://localhost:${NODEPAD_PORT}/api/${data.uri}`, {
        method: data.method,
        validateStatus: () => true,
        auth: {
          username: 'hacker993',
          password: 'pass993'
        }
      });
      expect(response2).to.have.property('status', 401);
      
      const response3 = await axios(`http://localhost:${NODEPAD_PORT}/api/${data.uri}`, {
        method: data.method,
        validateStatus: () => true,
        auth: {
          username: 'admin731',
          password: 'secret731'
        }
      });
      expect(response3).to.have.property('status');
      expect(response3).to.not.be.equal(401);
      expect(response3).to.not.be.equal(404);
      expect(response3).to.not.be.equal(500);
    });
  });

  it('should require auth to open home page', async function() {
    const response = await axios.get(`http://localhost:${NODEPAD_PORT}`, {validateStatus: () => true});
    expect(response).to.have.property('status', 401);
    expect(response.headers).to.have.property('www-authenticate');
  });

  it('should require login to home page', async function() {
    const response = await axios.get(`http://localhost:${NODEPAD_PORT}`, {
      validateStatus: () => true,
      headers: {
        authorization: basicAuth('admin731', 'secret731')
      }
    });
    expect(response).to.have.property('status', 200);
  });
  
});