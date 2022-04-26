const DeployService = require('../../src/services/DeployService.js');
const fs = require('fs');
const path = require('path');
const MockReq = require('mock-req');

const BOUNDARY = 'u2KxIV5yF1y+xUspOQCCZopaVgeV6Jxihv35XQJmuTx8X3sh';
const APP_ID = 'app-test-009861';
const APP_PORT = 4091;
const APP_DIR = APP_ID + '.' + APP_PORT;
const BIN_DATA = fs.readFileSync(path.resolve(__dirname, '..', 'content.zip'));

function createWorkspace() {
  const workspaceName = (new Date().getTime() * 1000 + Math.floor(Math.random()*1000)).toString(16);
  const workspacePath = path.resolve(__dirname, '..', '..', 'tmp', workspaceName);
  fs.mkdirSync(workspacePath);
  fs.mkdirSync(path.join(workspacePath, APP_DIR));
  fs.mkdirSync(path.join(workspacePath, APP_DIR, 'bin'));
  return workspacePath;
}

function clearWorkspace(path) {
  fs.rmSync(path, { recursive: true });
}

function createUploadRequest(filename) {
  
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
    req.write(BIN_DATA);
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
    const req = createUploadRequest('test-file-234.zip');
    req.progressUpload();
    req.completeUpload();
    
    await deployService.upload(APP_ID, req);
    expect(deployService.getDeployment(APP_ID)).to.be.have.property('job');
    expect(deployService.getDeployment(APP_ID).job).to.be.have.property('description', 'uploaded');

    const contentList = fs
      .readdirSync(path.resolve(deployWorkspace, APP_ID + '.' + APP_PORT))
      .filter(f => f.match(/content-[0-9a-z]+\.zip/));

    const uploadedFilePath = path.resolve(deployWorkspace, APP_DIR, contentList[0]);
    expect(fs.existsSync(uploadedFilePath)).to.be.true;

    const fileStats = fs.statSync(uploadedFilePath);
    expect(fileStats.size).to.be.equal(BIN_DATA.length);
  });

  it('should update status of deployment', async function() {
    const deployService = new DeployService(deployWorkspace);

    const req = createUploadRequest('test-file-234.zip');
    deployService.upload(APP_ID, req);
    await new Promise(resolve => setTimeout(resolve, 50));
    expect(deployService.getDeployment(APP_ID)).to.be.have.property('job');
    expect(deployService.getDeployment(APP_ID).job).to.be.have.property('description', 'uploading');

    req.progressUpload();
    await new Promise(resolve => setTimeout(resolve, 50));
    expect(deployService.getDeployment(APP_ID)).to.be.have.property('job');
    expect(deployService.getDeployment(APP_ID).job).to.be.have.property('state');
    expect(deployService.getDeployment(APP_ID).job.description).to.match(/uploading/);

    req.completeUpload();
    await new Promise(resolve => setTimeout(resolve, 50));
    expect(deployService.getDeployment(APP_ID)).to.be.have.property('job');
    expect(deployService.getDeployment(APP_ID).job).to.be.have.property('description', 'uploaded');

    deployService.extract(APP_ID);
    expect(deployService.getDeployment(APP_ID)).to.be.have.property('job');
    expect(deployService.getDeployment(APP_ID).job).to.be.have.property('description', 'extracting');
    await new Promise(resolve => setTimeout(resolve, 100));
    expect(deployService.getDeployment(APP_ID)).to.be.have.property('job');
    expect(deployService.getDeployment(APP_ID).job).to.be.have.property('description', 'installing (NODEJS)');

    deployService.install(APP_ID);
    expect(deployService.getDeployment(APP_ID)).to.be.have.property('job');
    expect(deployService.getDeployment(APP_ID).job).to.be.have.property('description', 'copying');
    await new Promise(resolve => setTimeout(resolve, 1000));
    expect(deployService.getDeployment(APP_ID)).to.be.have.property('job', null);
  });

  it('should set upload error status', async function() {
    const deployService = new DeployService(deployWorkspace);

    const req2 = createUploadRequest('test-file-234.zip');
    deployService.upload(APP_ID, req2);
    req2.end();
    await new Promise(resolve => setTimeout(resolve, 50));
    expect(deployService.getDeployment(APP_ID)).to.be.have.property('job');
    expect(deployService.getDeployment(APP_ID).job).to.be.have.property('description', 'upload error');
    expect(deployService.getDeployment(APP_ID).job).to.be.have.property('errorState', true);

  });

  it('should set extract error status', async function() {
    const deployService = new DeployService(deployWorkspace);

    const req3 = createUploadRequest('test-file-995.zip');
    req3.write('\r\nsome non zip data');
    req3.completeUpload();
    await deployService.upload(APP_ID, req3);
    await expect(deployService.extract(APP_ID)).to.be.rejected;
    expect(deployService.getDeployment(APP_ID)).to.be.have.property('job');
    expect(deployService.getDeployment(APP_ID).job).to.be.have.property('description', 'extract error');
  });

  it('should stop running deployment when a new one has started', async function() {
    const deployService = new DeployService(deployWorkspace);

    const req1 = createUploadRequest('test-file-885-A.zip');
    const req2 = createUploadRequest('test-file-885-B.zip');

    req1.progressUpload();
    req2.progressUpload();
    
    deployService.upload(APP_ID, req1);
    await new Promise(resolve => setTimeout(resolve, 50));

    deployService.upload(APP_ID, req2);
    await new Promise(resolve => setTimeout(resolve, 50));

    req1.progressUpload();
    req2.progressUpload();

    req1.completeUpload();
    req2.completeUpload();

    await new Promise(resolve => setTimeout(resolve, 50));

    const contentList = fs
      .readdirSync(path.resolve(deployWorkspace, APP_ID + '.' + APP_PORT))
      .filter(f => f.match(/content-[0-9a-z]+\.zip/));

    expect(contentList).to.have.lengthOf(1);

  });

  it('should extract content to temporary location', async function() {
    const deployService = new DeployService(deployWorkspace);
    const req = createUploadRequest('file-0038.zip');
    req.progressUpload();
    req.completeUpload();
    await deployService.upload(APP_ID, req);
    await deployService.extract(APP_ID);

    const tmpDir = fs
      .readdirSync(path.resolve(deployWorkspace, APP_ID + '.' + APP_PORT))
      .find(f => f.match(/tmp-[0-9a-z]+/));

    expect(tmpDir).to.be.not.null;

    const tmpPath = path.resolve(deployWorkspace, APP_ID + '.' + APP_PORT, tmpDir);
    expect(fs.existsSync(path.resolve(tmpPath, 'index.js')));
    expect(fs.existsSync(path.resolve(tmpPath, 'readme.txt')));

    const fileStats1 = fs.statSync(path.resolve(tmpPath, 'index.js'));
    const fileStats2 = fs.statSync(path.resolve(tmpPath, 'readme.txt'));

    expect(fileStats1.size).to.be.greaterThan(0);
    expect(fileStats2.size).to.be.greaterThan(0);

    const uploadList = fs
      .readdirSync(path.resolve(deployWorkspace, APP_ID + '.' + APP_PORT))
      .filter(f => f.match(/content-[0-9a-z]+\.zip/));

    expect(uploadList).to.be.empty;
  });

  it('should install content to bin', async function() {
    const deployService = new DeployService(deployWorkspace);
    const req = createUploadRequest('file-9982.zip');
    req.progressUpload();
    req.completeUpload();
    await deployService.upload(APP_ID, req);
    await deployService.extract(APP_ID);
    await deployService.install(APP_ID);

    const readmePath = path.resolve(deployWorkspace, APP_ID + '.' + APP_PORT, 'bin', 'readme.txt');
    expect(fs.existsSync(readmePath)).to.be.true;

    const tmpList = fs
      .readdirSync(path.resolve(deployWorkspace, APP_ID + '.' + APP_PORT))
      .filter(f => f.match(/tmp-[0-9a-z]+/));

    expect(tmpList).to.be.empty;
  });

  it('should fetch last update time', async function() {
    const deployService = new DeployService(deployWorkspace);
    const req = createUploadRequest('file-342.zip');
    req.progressUpload();
    req.completeUpload();
    await deployService.upload(APP_ID, req);
    await deployService.extract(APP_ID);
    await deployService.install(APP_ID);
    expect(deployService.getDeployment(APP_ID)).to.have.property('lastUpdate');
    expect(deployService.getDeployment(APP_ID).lastUpdate).to.match(/[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}.[0-9]{3}Z/);
  });
});
