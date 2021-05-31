const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
const AppService = require('../../services/AppService.js');
const path = require('path');
const fs = require('fs');
const sinon = require('sinon');

chai.use(chaiAsPromised);
const expect = chai.expect;

class PM2Mock {

  constructor() {
    this.listOutput = [];

    this.connectError = undefined;
    this.listError = undefined;
    this.startError = undefined;
    this.deleteError = undefined;

    this.start = sinon.stub().callsFake((opts, callback) => {
      callback(this.startError);
    });
    this.list = sinon.stub().callsFake((callback) => {
      callback(this.listError, this.listOutput);
    });
    this.delete = sinon.stub().callsFake((id, callback) => {
      callback(this.deleteError);
    });
    this.connect = sinon.stub().callsFake((callback) => {
      callback(this.connectError);
    });
    this.disconnect = sinon.stub();
  }

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

describe('AppService', function() { // ------------------------------------------------

  let workspace;

  beforeEach(function() {
    workspace = createWorkspace();
  });

  afterEach(function() {
    clearWorkspace(workspace);
  });

  it('should have no apps by default', async function() {
    const pm2 = new PM2Mock();
    const appService = new AppService(workspace, pm2);
    expect(await appService.read()).to.be.empty;
  });

  it('should list all apps', async function() {
    const pm2 = new PM2Mock();
    pm2.listOutput = [
      {
        name: 'app-name-773',
        pm2_env: {
          status: 'online'
        }
      }
    ];
    const appService = new AppService(workspace, pm2);

    await appService.create('app-name-623', 2373);
    await appService.create('app-name-773', 2374);

    const list = await appService.read();

    expect(list).to.have.lengthOf(2);

    expect(list[0]).to.have.property('id', 'app-name-623');
    expect(list[0]).to.have.property('port', 2373);
    expect(list[0]).to.have.property('status', 'offline');
    expect(list[0]).to.have.property('memory');
    expect(list[0]).to.have.property('cpu');

    expect(list[1]).to.have.property('id', 'app-name-773');
    expect(list[1]).to.have.property('port', 2374);
    expect(list[1]).to.have.property('status', 'online');
    expect(list[1]).to.have.property('memory');
    expect(list[1]).to.have.property('cpu');
  });

  it('should list apps folders', async function() {
    const pm2 = new PM2Mock();
    const appService = new AppService(workspace, pm2);

    await appService.create('p-xlkaj', 1107);
    await appService.create('p-aespf', 1108);

    const list = appService.getAppFolders();

    expect(list).to.have.lengthOf(2);

    expect(list).to.contain('p-xlkaj.1107');
    expect(list).to.contain('p-aespf.1108');
  });

  it('should throw on PM2 connect error when listing', async function() {
    const pm2 = new PM2Mock();
    pm2.connectError = new Error('oops 982');
    const appService = new AppService(workspace, pm2);
    await expect(appService.read()).to.be.rejectedWith(/pm2/i);
    expect(pm2.disconnect.callCount).to.be.equal(0);
  });

  it('should throw on PM2 list error when listing', async function() {
    const pm2 = new PM2Mock();
    pm2.listError = new Error('oops 238');
    const appService = new AppService(workspace, pm2);
    await expect(appService.read()).to.be.rejectedWith(/pm2/i);
    expect(pm2.disconnect.callCount).to.be.equal(1);
  });

  it('should create sample content in new app', async function() {
    const pm2 = new PM2Mock();
    const appService = new AppService(workspace, pm2);
    await appService.create('app97832', 8373);

    const script = path.join(workspace, 'app97832.8373', 'bin', 'index.js');
    const logfile = path.join(workspace, 'app97832.8373', 'log-app97832.log');

    expect(fs.existsSync(script)).to.be.true;
    expect(fs.existsSync(logfile)).to.be.true;
    expect(fs.readFileSync(logfile, 'utf8')).to.be.match(/[0-9]{4}-[0-9]{2}-[0-9]{2} [0-9]{2}:[0-9]{2}.*application.* created/i);
  });

  it('should throw on creation of invalid app name', async function() {
    const pm2 = new PM2Mock();
    const appService = new AppService(workspace, pm2);

    expect(() => appService.create('', 12341)).to.throw();
    expect(() => appService.create('x', 12342)).to.throw();
    expect(() => appService.create('72', 12343)).to.throw();
    expect(() => appService.create('abc!', 12344)).to.throw();
    expect(() => appService.create('123456789012345678901234567890123', 12345)).to.throw();
  });

  it('should create valid app name', async function() {
    const pm2 = new PM2Mock();
    const appService = new AppService(workspace, pm2);

    appService.create('valid', 12341);
    appService.create('valid-872_X', 12342);
    appService.create('xyz', 12343);
    appService.create('12345678901234567890123456789012', 12344);

    expect(await appService.read()).to.have.lengthOf(4);

  });

  it('should throw on creation of invalid app port', async function() {
    const pm2 = new PM2Mock();
    const appService = new AppService(workspace, pm2);

    expect(() => appService.create('valid8763-1', -2000)).to.throw();
    expect(() => appService.create('valid8763-2', 1023)).to.throw();
    expect(() => appService.create('valid8763-3', 2000.2)).to.throw();
    expect(() => appService.create('valid8763-4', 'abcd')).to.throw();
    expect(() => appService.create('valid8763-5', 49152)).to.throw();
  });

  it('should create valid app port', async function() {
    const pm2 = new PM2Mock();
    const appService = new AppService(workspace, pm2);

    appService.create('valid-773-1', 1024);
    appService.create('valid-773-2', 49151);
    appService.create('valid-773-3', 3000);
    appService.create('valid-773-4', 8080);

    expect(await appService.read()).to.have.lengthOf(4);
  });

  it('should throw on creation of duplicated app', async function() {
    const pm2 = new PM2Mock();
    const appService = new AppService(workspace, pm2);

    appService.create('valid9821-1', 4000);

    expect(() => appService.create('valid9821-1', 4001)).to.throw();
  });

  it('should throw on creation of app with used port', async function() {
    const pm2 = new PM2Mock();
    const appService = new AppService(workspace, pm2);

    appService.create('valid9821-1', 5959);

    expect(() => appService.create('valid9821-2', 5959)).to.throw();
  });

  it('should check if app exists', async function() {
    const pm2 = new PM2Mock();
    const appService = new AppService(workspace, pm2);

    expect(appService.exist('sample-8623')).to.be.false;
    appService.create('sample-8623', 9982);
    expect(appService.exist('sample-8623')).to.be.true;
  });

  it('should check if port is bound', async function() {
    const pm2 = new PM2Mock();
    const appService = new AppService(workspace, pm2);

    expect(appService.isPortBound(2110)).to.be.false;
    appService.create('sample-0982', 2110);
    expect(appService.isPortBound(2110)).to.be.true;
  });

  it('should find a app', async function() {
    const pm2 = new PM2Mock();
    pm2.listOutput = [
      {
        name: 'app-99821',
        pm2_env: {
          status: 'online'
        }
      }
    ];
    const appService = new AppService(workspace, pm2);

    appService.create('app-12128', 1092);
    appService.create('app-99821', 1093);
    await expect(appService.find('app-0000')).to.be.rejectedWith(/not found/i);

    const result1 = await appService.find('app-12128');
    const result2 = await appService.find('app-99821');
    expect(result1).to.have.property('id', 'app-12128');
    expect(result1).to.have.property('port', 1092);
    expect(result1).to.have.property('status', 'offline');
    expect(result2).to.have.property('status', 'online');
  });

  it('should throw when starting not existing app', async function() {
    const pm2 = new PM2Mock();
    const appService = new AppService(workspace, pm2);

    await expect(appService.start('void-8832')).to.be.rejected;
  });

  it('should throw when stopping not existing app', async function() {
    const pm2 = new PM2Mock();
    const appService = new AppService(workspace, pm2);

    await expect(appService.stop('void-1992')).to.be.rejected;
  });

  it('should throw on PM2 connect error when starting', async function() {
    const pm2 = new PM2Mock();
    pm2.connectError = new Error('oops 390223');
    const appService = new AppService(workspace, pm2);
    appService.create('test-883773', 7281);
    await expect(appService.start('test-883773')).to.be.rejectedWith(/pm2/i);
    expect(pm2.disconnect.callCount).to.be.equal(0);
  });

  it('should throw on PM2 connect error when stopping', async function() {
    const pm2 = new PM2Mock();
    pm2.connectError = new Error('oops 133322');
    const appService = new AppService(workspace, pm2);
    appService.create('test-223910', 1231);
    await expect(appService.stop('test-223910')).to.be.rejectedWith(/pm2/i);
    expect(pm2.disconnect.callCount).to.be.equal(0);
  });


  it('should throw on PM2 start error when starting', async function() {
    const pm2 = new PM2Mock();
    pm2.startError = new Error('oops 293');
    const appService = new AppService(workspace, pm2);
    appService.create('test-883773', 7281);
    await expect(appService.start('test-883773')).to.be.rejectedWith(/pm2/i);
    expect(pm2.disconnect.callCount).to.be.equal(2);
  });

  it('should throw on PM2 delete error when stopping', async function() {
    const pm2 = new PM2Mock();
    pm2.deleteError = new Error('oops 029');
    const appService = new AppService(workspace, pm2);
    appService.create('test-223910', 1231);
    await expect(appService.stop('test-223910')).to.be.rejectedWith(/pm2/i);
    expect(pm2.disconnect.callCount).to.be.equal(2);
  });

  it('should start app', async function() {
    const pm2 = new PM2Mock();
    const appService = new AppService(workspace, pm2);
    appService.create('some-app-293', 5691);
    await appService.start('some-app-293');
    expect(pm2.start.callCount).to.be.equal(1);
    expect(pm2.disconnect.callCount).to.be.equal(2);
  });

  it('should stop app', async function() {
    const pm2 = new PM2Mock();
    const appService = new AppService(workspace, pm2);
    appService.create('some-app-293', 5691);
    await appService.start('some-app-293');
    await appService.stop('some-app-293');
    expect(pm2.delete.callCount).to.be.equal(1);
    expect(pm2.disconnect.callCount).to.be.equal(4);
  });

  it('should retreive app logs', async function() {
    const pm2 = new PM2Mock();
    const appService = new AppService(workspace, pm2);
    appService.create('my-app-8324', 7110);
    appService.appLogger.log('my-app-8324', 'message #1 32452');
    appService.appLogger.log('my-app-8324', 'message #2 09231');
    const logs = await appService.getLogs('my-app-8324', 2);
    expect(logs).to.have.lengthOf(2);
    expect(logs[0]).to.be.match(/message #1 32452/);
    expect(logs[1]).to.be.match(/message #2 09231/);
  });
  
});