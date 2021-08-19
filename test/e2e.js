const chai = require('chai');
const http = require('http');
const chaiAsPromised = require('chai-as-promised');
const path = require('path');
const fs = require('fs');
const appCreate = require('../app').create;
const axios = require('axios');
const pm2 = require('pm2');
const FormData = require('form-data');
const WebSocketClient = require('websocket').client;

chai.use(chaiAsPromised);
const expect = chai.expect;

function basicAuth(user, pass) {
  return 'Basic ' + Buffer.from(user + ':' + pass).toString('base64');
}

function createWorkspace() {
  const workspaceName = (new Date().getTime() * 1000 + Math.floor(Math.random()*1000)).toString(16);
  const workspacePath = path.resolve(__dirname, '..', 'tmp', workspaceName);
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
const BIN_DATA_PATH = path.resolve(__dirname, 'content.zip');
const WS_BIN_DATA_PATH = path.resolve(__dirname, 'content-ws.zip');

describe('API End-to-end', function() { // ------------------------------------------------


  describe('Auth disabled', function() {

    let e2eWorkspace;
    let appServer;
    let proxyServer;
    let app;
    let proxy;

    this.timeout(5000);

    beforeEach(async function() {

      e2eWorkspace = createWorkspace();

      const appSet = appCreate({
        appPort: NODEPAD_PORT,
        proxyPort: PROXY_PORT,
        appRepoPath: e2eWorkspace,
        logLevel: 'silent',
        defaultApp: APP_ID,
        defaultScheme: 'http',
        rootDomain: `localhost`
      });
      app = appSet.app;
      proxy = appSet.proxy;

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

    it('should pass happy path', async () => {
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
      expect(response.data).to.have.property('status', 'deployed');

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

    });

    it('should handle web sockets', async () => {
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
      form.append('bin', fs.createReadStream(WS_BIN_DATA_PATH));
      response = await axios.post(
        `http://localhost:${NODEPAD_PORT}/api/apps/${APP_ID}/content/zip`,
        form,
        { headers: form.getHeaders() }
      );
      expect(response).to.have.property('status', 201);
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // check whether the app responds
      await new Promise((resolve) => setTimeout(resolve, 500));
      response = await axios.get(`http://localhost:${PROXY_PORT}`);
      expect(response).to.have.property('status', 200);
      expect(response).to.have.property('data');
      expect(response.data).to.match(/WebSocket Test/);

      response = await new Promise((resolve, reject) => {
        const client = new WebSocketClient();

        client.on('connectFailed', reject);

        client.on('connect', (connection) => {
          connection.on('error', reject);
          connection.on('message', (message) => {
            if (message.type === 'utf8') {
              connection.close();
              resolve(message.utf8Data);
            }
          });
          connection.sendUTF('MSG-882629102');
        });

        client.connect(`ws://localhost:${PROXY_PORT}/`);
      
      })

      expect(response).to.be.equal('Echo: MSG-882629102')

    });
  });

  describe('Auth enabled', function() {

    let e2eWorkspace;
    let appServer;
    let proxyServer;
    let app;
    let proxy;

    this.timeout(5000);

    beforeEach(async function() {

      e2eWorkspace = createWorkspace();

      const appSet = appCreate({
        appPort: NODEPAD_PORT,
        proxyPort: PROXY_PORT,
        appRepoPath: e2eWorkspace,
        logLevel: 'silent',
        auth: {
          user: 'admin731',
          pass: 'secret731'
        }
      });

      app = appSet.app;
      proxy = appSet.proxy;

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
      {method: 'get', uri: 'apps'},
      {method: 'post', uri: 'apps'},
      {method: 'put', uri: `apps/${APP_ID}`},
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
});