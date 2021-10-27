const chai = require('chai');
const http = require('http');
const chaiAsPromised = require('chai-as-promised');
const path = require('path');
const fs = require('fs');
const { createDashboard } = require('../../src/dashboard');
const { createProxy } = require('../../src/proxy');
const axios = require('axios');
const pm2 = require('pm2');
const FormData = require('form-data');
const { DONE } = require('../../src/services/DeployService/DeploymentJob');

chai.use(chaiAsPromised);
const expect = chai.expect;

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
const ALIAS_ID  = 'my-test-app-v99';
const NODEPAD_PORT = 39211;
const PROXY_PORT = 39311;
const APP_PORT = 39411;
const BIN_DATA_PATH = path.resolve(__dirname, '..', 'content.zip');

describe('E2E: Happy path', function() {

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

  it('should pass happy path for apps', async () => {
    let response;

    // create  app
    response = await axios.post(
      `http://localhost:${NODEPAD_PORT}/api/apps/`,
      {
        id: APP_ID,
        port: APP_PORT,
        status: 'offline'
      }
    );
    expect(response).to.have.property('status', 201);

    // check whether the app was created
    response = await axios.get(`http://localhost:${NODEPAD_PORT}/api/apps/`);
    expect(response).to.have.property('status', 200);
    expect(response).to.have.property('data');
    expect(response.data).to.have.lengthOf(1);
    expect(response.data[0]).to.have.property('id', APP_ID);
    expect(response.data[0]).to.have.property('port', APP_PORT);
    expect(response.data[0]).to.have.property('status', 'offline');
    expect(response.data[0]).to.have.property('url', `http://${APP_ID}.localhost:${PROXY_PORT}`);

    // start app
    response = await axios.put(
      `http://localhost:${NODEPAD_PORT}/api/apps/${APP_ID}`,
      {status: 'online'}
    );
    expect(response).to.have.property('status', 200);

    // check whether the app is online
    response = await axios.get(`http://localhost:${NODEPAD_PORT}/api/apps/`);
    expect(response).to.have.property('status', 200);
    expect(response).to.have.property('data');
    expect(response.data).to.have.lengthOf(1);
    expect(response.data[0]).to.have.property('id', APP_ID);
    expect(response.data[0]).to.have.property('status', 'online');
    
    // check whether the app responds
    await new Promise((resolve) => setTimeout(resolve, 500));
    response = await axios.get(`http://localhost:${APP_PORT}`);
    expect(response).to.have.property('status', 200);
    expect(response).to.have.property('data');
    expect(response.data).to.match(/Hello from my-test-app-7673/);

    // check whether routing works
    await new Promise((resolve) => setTimeout(resolve, 500));
    response = await axios.get(`http://localhost:${PROXY_PORT}`);
    expect(response).to.have.property('status', 200);
    expect(response).to.have.property('data');
    expect(response.data).to.match(/Hello from my-test-app-7673/);
    
    // check logs
    response = await axios.get(`http://localhost:${NODEPAD_PORT}/api/apps/${APP_ID}/logs`);
    expect(response).to.have.property('status', 200);
    expect(response).to.have.property('data');
    expect(response.data).to.have.length.greaterThan(0);

    //upload new content
    const form = new FormData();
    form.append('bin', fs.createReadStream(BIN_DATA_PATH));
    response = await axios.post(
      `http://localhost:${NODEPAD_PORT}/api/apps/${APP_ID}/content/zip`,
      form,
      { headers: form.getHeaders() }
    );
    expect(response).to.have.property('status', 201);
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // check whether the deplyment is done
    response = await axios.get(`http://localhost:${NODEPAD_PORT}/api/apps/${APP_ID}/content`);
    expect(response).to.have.property('status', 200);
    expect(response).to.have.property('data');
    expect(response.data).to.have.property('job', null);

    // check whether the app is online
    response = await axios.get(`http://localhost:${NODEPAD_PORT}/api/apps/`);
    expect(response).to.have.property('status', 200);
    expect(response).to.have.property('data');
    expect(response.data).to.have.lengthOf(1);
    expect(response.data[0]).to.have.property('id', APP_ID);
    expect(response.data[0]).to.have.property('status', 'online');

    // check whether the app responds
    await new Promise((resolve) => setTimeout(resolve, 500));
    response = await axios.get(`http://localhost:${APP_PORT}`);
    expect(response).to.have.property('status', 200);
    expect(response).to.have.property('data');
    expect(response.data).to.match(/Hello from TestApp/);

  }).timeout(10000);


  it('should pass happy path for aliases', async () => {
    let response;

    // create  app
    response = await axios.post(
      `http://localhost:${NODEPAD_PORT}/api/apps/`,
      {
        id: APP_ID,
        port: APP_PORT,
        status: 'offline'
      }
    );
    expect(response).to.have.property('status', 201);

    // create  alias
    response = await axios.post(
      `http://localhost:${NODEPAD_PORT}/api/aliases/`,
      {
        id: ALIAS_ID,
        port: APP_PORT
      }
    );
    expect(response).to.have.property('status', 201);

    // start app
    response = await axios.put(
      `http://localhost:${NODEPAD_PORT}/api/apps/${APP_ID}`,
      {status: 'online'}
    );
    expect(response).to.have.property('status', 200);

    // check whether routing works (app)
    await new Promise((resolve) => setTimeout(resolve, 500));
    response = await axios.get(`http://localhost:${PROXY_PORT}`, {headers: {Host: `${APP_ID}.localhost`}});
    expect(response).to.have.property('status', 200);
    expect(response).to.have.property('data');
    expect(response.data).to.match(/Hello from my-test-app-7673/);

    // check whether routing works (alias)
    await new Promise((resolve) => setTimeout(resolve, 500));
    response = await axios.get(`http://localhost:${PROXY_PORT}`, {headers: {Host: `${ALIAS_ID}.localhost`}});
    expect(response).to.have.property('status', 200);
    expect(response).to.have.property('data');
    expect(response.data).to.match(/Hello from my-test-app-7673/);
    

  }).timeout(10000);

});