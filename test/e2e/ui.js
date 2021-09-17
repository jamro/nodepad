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
  fs.rmdirSync(path, { recursive: true });
}

const APP_ID  = 'my-test-app-7673';
const NODEPAD_PORT = 39211;
const PROXY_PORT = 39311;

describe('E2E: UI', function() {

  this.timeout(10000);

  let e2eWorkspace;
  let appServer;
  let proxyServer;
  let app;
  let proxy;

  beforeEach(async function() {

    e2eWorkspace = createWorkspace();

    const appConfig = {
      dashboardPort: NODEPAD_PORT,
      proxyPort: PROXY_PORT,
      appRepoPath: e2eWorkspace,
      logLevel: 'silent',
      defaultApp: APP_ID,
      defaultScheme: 'http',
      rootDomain: `localhost`
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

  it('should open home page', async function() {
    const response = await axios.get(`http://localhost:${NODEPAD_PORT}`);
    expect(response).to.have.property('status', 200);
    expect(response).to.have.property('data');
    expect(response.data).to.match(/NodePad Dashboard/);
  });

  it('should open swagger UI', async function() {
    const response = await axios.get(`http://localhost:${NODEPAD_PORT}/api`);
    expect(response).to.have.property('status', 200);
    expect(response).to.have.property('data');
    expect(response.data).to.match(/Swagger/);
  });

});