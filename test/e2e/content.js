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
const NODEPAD_PORT = 39211;
const PROXY_PORT = 39311;
const APP_PORT = 39411;
const PACKAGE_BIN_DATA_PATH = path.resolve(__dirname, '..', 'content-package.zip');
const STATIC_BIN_DATA_PATH = path.resolve(__dirname, '..', 'content-static.zip');


describe('E2E: content', function() {

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

  it('should handle content with package.json', async () => {
    let response;

    // create  app
    response = await axios.post(
      `http://localhost:${NODEPAD_PORT}/api/apps/`,
      {
        id: APP_ID,
        port: APP_PORT,
        status: 'online'
      }
    );
    expect(response).to.have.property('status', 201);

    //upload new content
    const form = new FormData();
    form.append('bin', fs.createReadStream(PACKAGE_BIN_DATA_PATH));
    response = await axios.post(
      `http://localhost:${NODEPAD_PORT}/api/apps/${APP_ID}/content/zip`,
      form,
      { headers: form.getHeaders() }
    );
    expect(response).to.have.property('status', 201);
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // check whether the app responds
    await new Promise((resolve) => setTimeout(resolve, 4000));
    let response1 = await axios.get(`http://localhost:${PROXY_PORT}`);
    let response2 = await axios.get(`http://localhost:${PROXY_PORT}`);
    expect(response1).to.have.property('status', 200);
    expect(response1).to.have.property('data');
    expect(response1.data).to.match(/Lorem Ipsum/);
    expect(response2).to.have.property('status', 200);
    expect(response2).to.have.property('data');
    expect(response2.data).to.match(/Lorem Ipsum/);
    expect(response2.data).not.to.be.equal(response1.data);
  });


  it('should handle static content', async () => {
    let response;

    // create  app
    response = await axios.post(
      `http://localhost:${NODEPAD_PORT}/api/apps/`,
      {
        id: APP_ID,
        port: APP_PORT,
        status: 'online'
      }
    );
    expect(response).to.have.property('status', 201);

    //upload new content
    const form = new FormData();
    form.append('bin', fs.createReadStream(STATIC_BIN_DATA_PATH));
    response = await axios.post(
      `http://localhost:${NODEPAD_PORT}/api/apps/${APP_ID}/content/zip`,
      form,
      { headers: form.getHeaders() }
    );
    expect(response).to.have.property('status', 201);
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // check whether the app responds
    await new Promise((resolve) => setTimeout(resolve, 2000));
    response = await axios.get(`http://localhost:${PROXY_PORT}`);
    expect(response).to.have.property('status', 200);
    expect(response).to.have.property('data');
    expect(response.data).to.match(/This is a static page/);

    response = await axios.get(`http://localhost:${PROXY_PORT}/foo/bar.html`);
    expect(response).to.have.property('status', 200);
    expect(response).to.have.property('data');
    expect(response.data).to.match(/Foo Bar/);
  });
});