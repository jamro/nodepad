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
const BIN_DATA = fs.readFileSync(path.resolve(__dirname, 'content.zip'));

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
    deployService.debug = false;
    const req = createUploadRequest('test-file-234.zip');
    req.progressUpload();
    req.completeUpload();
    
    await deployService.upload(PROJECT_ID, req);
    expect(deployService.getDeployment(PROJECT_ID)).to.be.have.property('status', 'uploaded');

    const contentList = fs
      .readdirSync(path.resolve(deployWorkspace, PROJECT_ID + '.' + PROJECT_PORT))
      .filter(f => f.match(/content-[0-9a-z]+\.zip/));

    const uploadedFilePath = path.resolve(deployWorkspace, PROJECT_DIR, contentList[0]);
    expect(fs.existsSync(uploadedFilePath)).to.be.true;

    const fileStats = fs.statSync(uploadedFilePath);
    expect(fileStats.size).to.be.equal(BIN_DATA.length);
  });

  it('should update status of deployment', async function() {
    const deployService = new DeployService(deployWorkspace);
    deployService.debug = false;

    const req = createUploadRequest('test-file-234.zip');
    deployService.upload(PROJECT_ID, req);
    await new Promise(resolve => setTimeout(resolve, 50));
    expect(deployService.getDeployment(PROJECT_ID)).to.be.have.property('status', 'started');

    req.progressUpload();
    await new Promise(resolve => setTimeout(resolve, 50));
    expect(deployService.getDeployment(PROJECT_ID)).to.be.have.property('status');
    expect(deployService.getDeployment(PROJECT_ID).status).to.match(/uploading/);

    req.completeUpload();
    await new Promise(resolve => setTimeout(resolve, 50));
    expect(deployService.getDeployment(PROJECT_ID)).to.be.have.property('status', 'uploaded');

    deployService.extract(PROJECT_ID);
    expect(deployService.getDeployment(PROJECT_ID)).to.be.have.property('status', 'extracting');
    await new Promise(resolve => setTimeout(resolve, 50));
    expect(deployService.getDeployment(PROJECT_ID)).to.be.have.property('status', 'extracted');

    deployService.install(PROJECT_ID);
    expect(deployService.getDeployment(PROJECT_ID)).to.be.have.property('status', 'installing');
    await new Promise(resolve => setTimeout(resolve, 100));
    expect(deployService.getDeployment(PROJECT_ID)).to.be.have.property('status', 'deployed');
  });

  it('should set upload error status', async function() {
    const deployService = new DeployService(deployWorkspace);
    deployService.debug = false;

    const req2 = createUploadRequest('test-file-234.zip');
    deployService.upload(PROJECT_ID, req2);
    req2.end();
    await new Promise(resolve => setTimeout(resolve, 50));
    expect(deployService.getDeployment(PROJECT_ID)).to.be.have.property('status', 'upload error');

  });

  it('should set extract error status', async function() {
    const deployService = new DeployService(deployWorkspace);
    deployService.debug = false;

    const req3 = createUploadRequest('test-file-995.zip');
    req3.write('\r\nsome non zip data');
    req3.completeUpload();
    await deployService.upload(PROJECT_ID, req3);
    await expect(deployService.extract(PROJECT_ID)).to.be.rejected;
    expect(deployService.getDeployment(PROJECT_ID)).to.be.have.property('status', 'extract error');

  });

  it('should stop running deployment when a new one has started', async function() {
    const deployService = new DeployService(deployWorkspace);
    deployService.debug = false;

    const req1 = createUploadRequest('test-file-885-A.zip');
    const req2 = createUploadRequest('test-file-885-B.zip');

    req1.progressUpload();
    req2.progressUpload();
    
    deployService.upload(PROJECT_ID, req1);
    await new Promise(resolve => setTimeout(resolve, 50));

    deployService.upload(PROJECT_ID, req2);
    await new Promise(resolve => setTimeout(resolve, 50));

    req1.progressUpload();
    req2.progressUpload();

    req1.completeUpload();
    req2.completeUpload();

    await new Promise(resolve => setTimeout(resolve, 50));

    const contentList = fs
      .readdirSync(path.resolve(deployWorkspace, PROJECT_ID + '.' + PROJECT_PORT))
      .filter(f => f.match(/content-[0-9a-z]+\.zip/));

    expect(contentList).to.have.lengthOf(1);

  });

  it('should extract content to temporary location', async function() {
    const deployService = new DeployService(deployWorkspace);
    deployService.debug = false;
    const req = createUploadRequest('file-0038.zip');
    req.progressUpload();
    req.completeUpload();
    await deployService.upload(PROJECT_ID, req);
    await deployService.extract(PROJECT_ID);

    const tmpDir = fs
      .readdirSync(path.resolve(deployWorkspace, PROJECT_ID + '.' + PROJECT_PORT))
      .find(f => f.match(/tmp-[0-9a-z]+/));

    expect(tmpDir).to.be.not.null;

    const tmpPath = path.resolve(deployWorkspace, PROJECT_ID + '.' + PROJECT_PORT, tmpDir);
    expect(fs.existsSync(path.resolve(tmpPath, 'index.js')));
    expect(fs.existsSync(path.resolve(tmpPath, 'readme.txt')));

    const fileStats1 = fs.statSync(path.resolve(tmpPath, 'index.js'));
    const fileStats2 = fs.statSync(path.resolve(tmpPath, 'readme.txt'));

    expect(fileStats1.size).to.be.greaterThan(0);
    expect(fileStats2.size).to.be.greaterThan(0);

    const uploadList = fs
      .readdirSync(path.resolve(deployWorkspace, PROJECT_ID + '.' + PROJECT_PORT))
      .filter(f => f.match(/content-[0-9a-z]+\.zip/));

    expect(uploadList).to.be.empty;
  });

  it('should install content to bin', async function() {
    const deployService = new DeployService(deployWorkspace);
    deployService.debug = false;
    const req = createUploadRequest('file-9982.zip');
    req.progressUpload();
    req.completeUpload();
    await deployService.upload(PROJECT_ID, req);
    await deployService.extract(PROJECT_ID);
    await deployService.install(PROJECT_ID);

    const readmePath = path.resolve(deployWorkspace, PROJECT_ID + '.' + PROJECT_PORT, 'bin', 'readme.txt');
    expect(fs.existsSync(readmePath)).to.be.true;

    const tmpList = fs
      .readdirSync(path.resolve(deployWorkspace, PROJECT_ID + '.' + PROJECT_PORT))
      .filter(f => f.match(/tmp-[0-9a-z]+/));

    expect(tmpList).to.be.empty;
  });

  it('should fetch last update time', async function() {
    const deployService = new DeployService(deployWorkspace);
    deployService.debug = false;
    const req = createUploadRequest('file-342.zip');
    req.progressUpload();
    req.completeUpload();
    await deployService.upload(PROJECT_ID, req);
    await deployService.extract(PROJECT_ID);
    await deployService.install(PROJECT_ID);
    expect(deployService.getDeployment(PROJECT_ID)).to.have.property('lastUpdate');
    expect(deployService.getDeployment(PROJECT_ID).lastUpdate).to.match(/[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}.[0-9]{3}Z/);
  });
});
