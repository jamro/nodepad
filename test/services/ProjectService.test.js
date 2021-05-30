const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
const ProjectService = require('../../services/ProjectService.js');
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

describe('ProjectService', function() { // ------------------------------------------------

  let workspace;

  beforeEach(function() {
    workspace = createWorkspace();
  });

  afterEach(function() {
    clearWorkspace(workspace);
  });

  it('should have no projects by default', async function() {
    const pm2 = new PM2Mock();
    const projectService = new ProjectService(workspace, pm2);
    expect(await projectService.read()).to.be.empty;
  });

  it('should list all projects', async function() {
    const pm2 = new PM2Mock();
    pm2.listOutput = [
      {
        name: 'app-name-773',
        pm2_env: {
          status: 'online'
        }
      }
    ];
    const projectService = new ProjectService(workspace, pm2);

    await projectService.create('app-name-623', 2373);
    await projectService.create('app-name-773', 2374);

    const list = await projectService.read();

    expect(list).to.have.lengthOf(2);

    expect(list[0]).to.have.property('id', 'app-name-623');
    expect(list[0]).to.have.property('port', 2373);
    expect(list[0]).to.have.property('status', 'offline');

    expect(list[1]).to.have.property('id', 'app-name-773');
    expect(list[1]).to.have.property('port', 2374);
    expect(list[1]).to.have.property('status', 'online');
  });

  it('should list project folders', async function() {
    const pm2 = new PM2Mock();
    const projectService = new ProjectService(workspace, pm2);

    await projectService.create('p-xlkaj', 1107);
    await projectService.create('p-aespf', 1108);

    const list = projectService.getProjectFolders();

    expect(list).to.have.lengthOf(2);

    expect(list).to.contain('p-xlkaj.1107');
    expect(list).to.contain('p-aespf.1108');
  });

  it('should throw on PM2 connect error when listing', async function() {
    const pm2 = new PM2Mock();
    pm2.connectError = new Error('oops 982');
    const projectService = new ProjectService(workspace, pm2);
    await expect(projectService.read()).to.be.rejectedWith(/pm2/i);
    expect(pm2.disconnect.callCount).to.be.equal(0);
  });

  it('should throw on PM2 list error when listing', async function() {
    const pm2 = new PM2Mock();
    pm2.listError = new Error('oops 238');
    const projectService = new ProjectService(workspace, pm2);
    await expect(projectService.read()).to.be.rejectedWith(/pm2/i);
    expect(pm2.disconnect.callCount).to.be.equal(1);
  });

  it('should create sample app in new project', async function() {
    const pm2 = new PM2Mock();
    const projectService = new ProjectService(workspace, pm2);
    await projectService.create('app97832', 8373);

    const script = path.join(workspace, 'app97832.8373', 'bin', 'index.js');
    const logfile = path.join(workspace, 'app97832.8373', 'log-app97832.log');

    expect(fs.existsSync(script)).to.be.true;
    expect(fs.existsSync(logfile)).to.be.true;
    expect(fs.readFileSync(logfile, 'utf8')).to.be.match(/[0-9]{4}-[0-9]{2}-[0-9]{2} [0-9]{2}:[0-9]{2}.*project.* created/i);
  });

  it('should throw on creation of invalid project name', async function() {
    const pm2 = new PM2Mock();
    const projectService = new ProjectService(workspace, pm2);

    expect(() => projectService.create('', 12341)).to.throw();
    expect(() => projectService.create('x', 12342)).to.throw();
    expect(() => projectService.create('72', 12343)).to.throw();
    expect(() => projectService.create('abc!', 12344)).to.throw();
    expect(() => projectService.create('123456789012345678901234567890123', 12345)).to.throw();
  });

  it('should create valid project name', async function() {
    const pm2 = new PM2Mock();
    const projectService = new ProjectService(workspace, pm2);

    projectService.create('valid', 12341);
    projectService.create('valid-872_X', 12342);
    projectService.create('xyz', 12343);
    projectService.create('12345678901234567890123456789012', 12344);

    expect(await projectService.read()).to.have.lengthOf(4);

  });

  it('should throw on creation of invalid project port', async function() {
    const pm2 = new PM2Mock();
    const projectService = new ProjectService(workspace, pm2);

    expect(() => projectService.create('valid8763-1', -2000)).to.throw();
    expect(() => projectService.create('valid8763-2', 1023)).to.throw();
    expect(() => projectService.create('valid8763-3', 2000.2)).to.throw();
    expect(() => projectService.create('valid8763-4', 'abcd')).to.throw();
    expect(() => projectService.create('valid8763-5', 49152)).to.throw();
  });

  it('should create valid project port', async function() {
    const pm2 = new PM2Mock();
    const projectService = new ProjectService(workspace, pm2);

    projectService.create('valid-773-1', 1024);
    projectService.create('valid-773-2', 49151);
    projectService.create('valid-773-3', 3000);
    projectService.create('valid-773-4', 8080);

    expect(await projectService.read()).to.have.lengthOf(4);
  });

  it('should throw on creation of duplicated project', async function() {
    const pm2 = new PM2Mock();
    const projectService = new ProjectService(workspace, pm2);

    projectService.create('valid9821-1', 4000);

    expect(() => projectService.create('valid9821-1', 4001)).to.throw();
  });

  it('should throw on creation of project with used port', async function() {
    const pm2 = new PM2Mock();
    const projectService = new ProjectService(workspace, pm2);

    projectService.create('valid9821-1', 5959);

    expect(() => projectService.create('valid9821-2', 5959)).to.throw();
  });

  it('should check if project exists', async function() {
    const pm2 = new PM2Mock();
    const projectService = new ProjectService(workspace, pm2);

    expect(projectService.exist('sample-8623')).to.be.false;
    projectService.create('sample-8623', 9982);
    expect(projectService.exist('sample-8623')).to.be.true;
  });

  it('should check if port is bound', async function() {
    const pm2 = new PM2Mock();
    const projectService = new ProjectService(workspace, pm2);

    expect(projectService.isPortBound(2110)).to.be.false;
    projectService.create('sample-0982', 2110);
    expect(projectService.isPortBound(2110)).to.be.true;
  });

  it('should find a project', async function() {
    const pm2 = new PM2Mock();
    pm2.listOutput = [
      {
        name: 'proj-99821',
        pm2_env: {
          status: 'online'
        }
      }
    ];
    const projectService = new ProjectService(workspace, pm2);

    projectService.create('proj-12128', 1092);
    projectService.create('proj-99821', 1093);
    await expect(projectService.find('proj-0000')).to.be.rejectedWith(/not found/i);

    const result1 = await projectService.find('proj-12128');
    const result2 = await projectService.find('proj-99821');
    expect(result1).to.have.property('id', 'proj-12128');
    expect(result1).to.have.property('port', 1092);
    expect(result1).to.have.property('status', 'offline');
    expect(result2).to.have.property('status', 'online');
  });

  it('should throw when starting not existing project', async function() {
    const pm2 = new PM2Mock();
    const projectService = new ProjectService(workspace, pm2);

    await expect(projectService.start('void-8832')).to.be.rejected;
  });

  it('should throw when stopping not existing project', async function() {
    const pm2 = new PM2Mock();
    const projectService = new ProjectService(workspace, pm2);

    await expect(projectService.stop('void-1992')).to.be.rejected;
  });

  it('should throw on PM2 connect error when starting', async function() {
    const pm2 = new PM2Mock();
    pm2.connectError = new Error('oops 390223');
    const projectService = new ProjectService(workspace, pm2);
    projectService.create('test-883773', 7281);
    await expect(projectService.start('test-883773')).to.be.rejectedWith(/pm2/i);
    expect(pm2.disconnect.callCount).to.be.equal(0);
  });

  it('should throw on PM2 connect error when stopping', async function() {
    const pm2 = new PM2Mock();
    pm2.connectError = new Error('oops 133322');
    const projectService = new ProjectService(workspace, pm2);
    projectService.create('test-223910', 1231);
    await expect(projectService.stop('test-223910')).to.be.rejectedWith(/pm2/i);
    expect(pm2.disconnect.callCount).to.be.equal(0);
  });


  it('should throw on PM2 start error when starting', async function() {
    const pm2 = new PM2Mock();
    pm2.startError = new Error('oops 293');
    const projectService = new ProjectService(workspace, pm2);
    projectService.create('test-883773', 7281);
    await expect(projectService.start('test-883773')).to.be.rejectedWith(/pm2/i);
    expect(pm2.disconnect.callCount).to.be.equal(2);
  });

  it('should throw on PM2 delete error when stopping', async function() {
    const pm2 = new PM2Mock();
    pm2.deleteError = new Error('oops 029');
    const projectService = new ProjectService(workspace, pm2);
    projectService.create('test-223910', 1231);
    await expect(projectService.stop('test-223910')).to.be.rejectedWith(/pm2/i);
    expect(pm2.disconnect.callCount).to.be.equal(2);
  });

  it('should start project', async function() {
    const pm2 = new PM2Mock();
    const projectService = new ProjectService(workspace, pm2);
    projectService.create('some-app-293', 5691);
    await projectService.start('some-app-293');
    expect(pm2.start.callCount).to.be.equal(1);
    expect(pm2.disconnect.callCount).to.be.equal(2);
  });

  it('should stop project', async function() {
    const pm2 = new PM2Mock();
    const projectService = new ProjectService(workspace, pm2);
    projectService.create('some-app-293', 5691);
    await projectService.start('some-app-293');
    await projectService.stop('some-app-293');
    expect(pm2.delete.callCount).to.be.equal(1);
    expect(pm2.disconnect.callCount).to.be.equal(4);
  });

  it('should retreive project logs', async function() {
    const pm2 = new PM2Mock();
    const projectService = new ProjectService(workspace, pm2);
    projectService.create('my-proj-8324', 7110);
    projectService.projectLogger.log('my-proj-8324', 'message #1 32452');
    projectService.projectLogger.log('my-proj-8324', 'message #2 09231');
    const logs = await projectService.getLogs('my-proj-8324', 2);
    expect(logs).to.have.lengthOf(2);
    expect(logs[0]).to.be.match(/message #1 32452/);
    expect(logs[1]).to.be.match(/message #2 09231/);
  });
  
});