const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
const DeployService = require('../../services/DeployService.js');
const fs = require('fs');
const path = require('path');
var MockReq = require('mock-req');

chai.use(chaiAsPromised);
const expect = chai.expect;

const BOUNDARY = 'u2KxIV5yF1y+xUspOQCCZopaVgeV6Jxihv35XQJmuTx8X3sh';
const PROJECT_ID = 'proj-test-009861';
const PROJECT_PORT = 4091;
const PROJECT_DIR = PROJECT_ID + '.' + PROJECT_PORT;

function createWorkspace() {
  const workspaceName = (new Date().getTime() * 1000 + Math.floor(Math.random()*1000)).toString(16);
  const workspacePath = path.resolve(__dirname, '..', '..', 'tmp', workspaceName);
  fs.mkdirSync(workspacePath);
  fs.mkdirSync(path.join(workspacePath, PROJECT_DIR));
  fs.mkdirSync(path.join(workspacePath, PROJECT_DIR, 'bin'));
  return workspacePath;
}

function clearWorkspace(path) {
  fs.rmdirSync(path, { recursive: true });
}

function createUploadRequest(filename) {
  const req = new MockReq({
    method: 'POST',
    url: '/projects/' + PROJECT_ID + '/content',
    headers: {
      'content-type': 'multipart/form-data; boundary=' + BOUNDARY
    }
  });
  req.write(
    '\r\n--' + BOUNDARY
    + '\r\nContent-Disposition: form-data; name="bin"; filename="' + filename +'"'
    + '\r\nContent-Type: text/javascript'
    + '\r\n'
  );
  req.progressUpload = () => {
    req.write('\r\nFile content comesw here');
  };
  req.completeUpload = () => {
    req.write('\r\n--' + BOUNDARY + '--');
    req.end();
  };
  return req;
}

describe('DeployService', function() { // ------------------------------------------------
  let deployWorkspace;

  beforeEach(function() {
    deployWorkspace = createWorkspace();
  });

  afterEach(function() {
    clearWorkspace(deployWorkspace);
  });

  it('should deploy a file', async function() {
    const deployService = new DeployService(deployWorkspace);
    deployService.debug = false;
    const req = createUploadRequest('test-file-234.txt');
    req.progressUpload();
    req.completeUpload();
    
    await deployService.deploy(PROJECT_ID, req);
    expect(deployService.getDeployment(PROJECT_ID)).to.be.have.property('status', 'done');

    const uploadedFilePath = path.resolve(deployWorkspace, PROJECT_DIR, 'bin', 'test-file-234.txt');
    expect(fs.existsSync(uploadedFilePath)).to.be.true;

    const fileStats = fs.statSync(uploadedFilePath);
    expect(fileStats.size).to.be.greaterThan(0);
  });

  it('should update status of deployment', async function() {
    const deployService = new DeployService(deployWorkspace);
    deployService.debug = false;
    const req = createUploadRequest('test-file-234.txt');
    deployService.deploy(PROJECT_ID, req);
    await new Promise(resolve => setTimeout(resolve, 50));
    expect(deployService.getDeployment(PROJECT_ID)).to.be.have.property('status', 'started');

    req.progressUpload();
    await new Promise(resolve => setTimeout(resolve, 50));
    expect(deployService.getDeployment(PROJECT_ID)).to.be.have.property('status', 'uploading (24 Bytes)');

    req.completeUpload();
    await new Promise(resolve => setTimeout(resolve, 50));
    expect(deployService.getDeployment(PROJECT_ID)).to.be.have.property('status', 'done');

    const req2 = createUploadRequest('test-file-234.txt');
    deployService.deploy(PROJECT_ID, req2);
    req2.end();
    await new Promise(resolve => setTimeout(resolve, 50));
    expect(deployService.getDeployment(PROJECT_ID)).to.be.have.property('status', 'upload error');
  });

  it('should stop running deployment when a new one has started', async function() {
    const deployService = new DeployService(deployWorkspace);
    deployService.debug = false;

    const req1 = createUploadRequest('test-file-885-A.txt');
    const req2 = createUploadRequest('test-file-885-B.txt');
    const uploadedFilePath1 = path.resolve(deployWorkspace, PROJECT_DIR, 'bin', 'test-file-885-A.txt');
    const uploadedFilePath2 = path.resolve(deployWorkspace, PROJECT_DIR, 'bin', 'test-file-885-B.txt');

    req1.progressUpload();
    req2.progressUpload();
    
    deployService.deploy(PROJECT_ID, req1);
    await new Promise(resolve => setTimeout(resolve, 50));

    deployService.deploy(PROJECT_ID, req2);
    await new Promise(resolve => setTimeout(resolve, 50));

    req1.progressUpload();
    req2.progressUpload();

    req1.completeUpload();
    req2.completeUpload();

    await new Promise(resolve => setTimeout(resolve, 50));

    expect(fs.existsSync(uploadedFilePath1)).to.be.false;
    expect(fs.existsSync(uploadedFilePath2)).to.be.true;

  });

});
