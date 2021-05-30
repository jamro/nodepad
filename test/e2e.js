const chai = require('chai');
const http = require('http');
const chaiAsPromised = require('chai-as-promised');
const path = require('path');
const fs = require('fs');
const appCreate = require('../app').create;
const axios = require('axios');
const pm2 = require('pm2');
const FormData = require('form-data');

chai.use(chaiAsPromised);
const expect = chai.expect;

function createWorkspace() {
  const workspaceName = (new Date().getTime() * 1000 + Math.floor(Math.random()*1000)).toString(16);
  const workspacePath = path.resolve(__dirname, '..', 'tmp', workspaceName);
  fs.mkdirSync(workspacePath);
  return workspacePath;
}

function clearWorkspace(path) {
  fs.rmdirSync(path, { recursive: true });
}

const PROJECT_ID  = 'my-test-proj-7673';
const APP_PORT = 39211;
const PROJECT_PORT = 39311;
const BIN_DATA_PATH = path.resolve(__dirname, 'content-39311.zip');

describe('API End-to-end', function() { // ------------------------------------------------

  let e2eWorkspace;
  let server;
  let app;

  this.timeout(5000);

  beforeEach(async function() {

    e2eWorkspace = createWorkspace();

    app = appCreate({
      port: APP_PORT,
      projectPath: e2eWorkspace,
      logLevel: 'silent'
    });

    app.set('port', APP_PORT);
    server = http.createServer(app);
    server.listen(APP_PORT);

    await new Promise(resolve => {
      server.on('listening', () => {
        setTimeout(() => resolve(), 500);
      });
    });
    
  });

  afterEach(async function() {
    clearWorkspace(e2eWorkspace);
    
    await new Promise(resolve => server.close(() => resolve()));
    app.destroy();
    
    await new Promise(resolve => {
      pm2.connect((err) => {
        if(err) {
          resolve();
        }
        pm2.delete(PROJECT_ID, () => {
          pm2.disconnect();
          resolve();
        });
      });
    });
    
  });

  it('should open home page', async function() {
    const response = await axios.get(`http://localhost:${APP_PORT}`);
    expect(response).to.have.property('status', 200);
    expect(response).to.have.property('data');
    expect(response.data).to.match(/Welcome to NodePad/);
  });

  it('should open swagger UI', async function() {
    const response = await axios.get(`http://localhost:${APP_PORT}/api`);
    expect(response).to.have.property('status', 200);
    expect(response).to.have.property('data');
    expect(response.data).to.match(/Swagger/);
  });

  it('should pass happy path', async () => {
    let response;

    // create  project
    response = await axios.post(
      `http://localhost:${APP_PORT}/api/projects/`,
      {
        id: PROJECT_ID,
        port: PROJECT_PORT,
        status: 'offline'
      }
    );
    expect(response).to.have.property('status', 201);

    // check whether the project was created
    response = await axios.get(`http://localhost:${APP_PORT}/api/projects/`);
    expect(response).to.have.property('status', 200);
    expect(response).to.have.property('data');
    expect(response.data).to.have.lengthOf(1);
    expect(response.data[0]).to.have.property('id', PROJECT_ID);
    expect(response.data[0]).to.have.property('port', PROJECT_PORT);
    expect(response.data[0]).to.have.property('status', 'offline');

    // start project
    response = await axios.put(
      `http://localhost:${APP_PORT}/api/projects/${PROJECT_ID}`,
      {status: 'online'}
    );
    expect(response).to.have.property('status', 200);

    // check whether the project is online
    response = await axios.get(`http://localhost:${APP_PORT}/api/projects/`);
    expect(response).to.have.property('status', 200);
    expect(response).to.have.property('data');
    expect(response.data).to.have.lengthOf(1);
    expect(response.data[0]).to.have.property('id', PROJECT_ID);
    expect(response.data[0]).to.have.property('status', 'online');
    
    // check whether the project responds
    await new Promise((resolve) => setTimeout(resolve, 500));
    response = await axios.get(`http://localhost:${PROJECT_PORT}`);
    expect(response).to.have.property('status', 200);
    expect(response).to.have.property('data');
    expect(response.data).to.match(/Hello from my-test-proj-7673/);
    expect(response.data).to.not.match(/it works quite well/);
    
    // check logs
    response = await axios.get(`http://localhost:${APP_PORT}/api/projects/${PROJECT_ID}/logs`);
    expect(response).to.have.property('status', 200);
    expect(response).to.have.property('data');
    expect(response.data).to.have.length.greaterThan(0);

    //upload new content
    const form = new FormData();
    form.append('bin', fs.createReadStream(BIN_DATA_PATH));
    response = await axios.post(
      `http://localhost:${APP_PORT}/api/projects/${PROJECT_ID}/content`,
      form,
      { headers: form.getHeaders() }
    );
    expect(response).to.have.property('status', 201);
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // check whether the deplyment is done
    response = await axios.get(`http://localhost:${APP_PORT}/api/projects/${PROJECT_ID}/content`);
    expect(response).to.have.property('status', 200);
    expect(response).to.have.property('data');
    expect(response.data).to.have.property('status', 'deployed');

    // check whether the project is online
    response = await axios.get(`http://localhost:${APP_PORT}/api/projects/`);
    expect(response).to.have.property('status', 200);
    expect(response).to.have.property('data');
    expect(response.data).to.have.lengthOf(1);
    expect(response.data[0]).to.have.property('id', PROJECT_ID);
    expect(response.data[0]).to.have.property('status', 'online');

    // check whether the project responds
    await new Promise((resolve) => setTimeout(resolve, 500));
    response = await axios.get(`http://localhost:${PROJECT_PORT}`);
    expect(response).to.have.property('status', 200);
    expect(response).to.have.property('data');
    expect(response.data).to.match(/it works quite well/);

  });

});