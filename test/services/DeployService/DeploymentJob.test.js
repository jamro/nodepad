const DeploymentJob = require('../../../src/services/DeployService/DeploymentJob.js');
const fs = require('fs');
const path = require('path');
const MockReq = require('mock-req');
const { expect } = require('chai');

const BOUNDARY = 'u2KxIV5yF1y+xUspOQCCZopaVgeV6Jxihv35XQJmuTx8X3sh';
const APP_ID = 'app-test-7716001';
const BIN_SIMPLE_DATA = fs.readFileSync(path.resolve(__dirname, '..', '..', 'content.zip'));

function createWorkspace() {
  const workspaceName = (new Date().getTime() * 1000 + Math.floor(Math.random()*1000)).toString(16);
  const workspacePath = path.resolve(__dirname, '..', '..', '..', 'tmp', workspaceName);

  fs.mkdirSync(workspacePath);
  return workspacePath;
}

function clearWorkspace(path) {
  fs.rmdirSync(path, { recursive: true });
}

function createUploadRequest(filename, data) {
  
  const req = new MockReq({
    method: 'POST',
    url: '/apps/' + APP_ID + '/content/zip',
    headers: {
      'content-type': 'multipart/form-data; boundary=' + BOUNDARY
    }
  });
  req.write(
    '\r\n--' + BOUNDARY
    + '\r\nContent-Disposition: form-data; name="bin"; filename="' + filename + '"'
    + '\r\nContent-Type: application/zip'
    + '\r\nContent-Transfer-Encoding: binary'
    + '\r\n'
  );
  req.progressUpload = () => {
    req.write('\r\n');
    req.write(data);
  };
  req.completeUpload = () => {
    req.write('\r\n--' + BOUNDARY + '--');
    req.end();
  };
  return req;
}

describe('DeploymentJob', function() { // ------------------------------------------------

  let workspace;

  beforeEach(function() {
    workspace = createWorkspace();
  });

  afterEach(function() {
    clearWorkspace(workspace);
  });

  it('should set status on error', async function() {
    const job = new DeploymentJob(workspace)
    job.onUploadError();
    expect(job.status).to.be.equal('upload error')
  });

  it('should upload zip bundle', async function() {
    const req = createUploadRequest('testbundle872.zip', BIN_SIMPLE_DATA)
    req.progressUpload();
    req.completeUpload();

    const job = new DeploymentJob(workspace)
    const uploadFilePath = await job.upload(req);
    expect(fs.existsSync(uploadFilePath)).to.be.true;
    
  });

  it('should remove zip bundle at stop', async function() {
    const req = createUploadRequest('testbundle872.zip', BIN_SIMPLE_DATA)
    req.progressUpload();
    req.completeUpload();

    const job = new DeploymentJob(workspace)
    const uploadFilePath = await job.upload(req);
    await job.stop();
    expect(fs.existsSync(uploadFilePath)).to.be.false;
  });

  it('should extract zip bundle', async function() {
    const req = createUploadRequest('testbundle872.zip', BIN_SIMPLE_DATA)
    req.progressUpload();
    req.completeUpload();

    const job = new DeploymentJob(workspace)
    const uploadFilePath = await job.upload(req);
    await job.extract();
    expect(fs.existsSync(path.resolve(job.tmpPath, 'index.js'))).to.be.true;
  });

  it('should remove tmp location at stop', async function() {
    const req = createUploadRequest('testbundle872.zip', BIN_SIMPLE_DATA)
    req.progressUpload();
    req.completeUpload();

    const job = new DeploymentJob(workspace)
    const uploadFilePath = await job.upload(req);
    await job.extract();
    await job.stop();
    expect(fs.existsSync(job.tmpPath)).to.be.false;
  });

});