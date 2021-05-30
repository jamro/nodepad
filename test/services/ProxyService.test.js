const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
const ProxyService = require('../../services/ProxyService.js');
const sinon = require('sinon');

chai.use(chaiAsPromised);
const expect = chai.expect;

class ProjectServiceMock {
  constructor() {
    this.getProjectFolders = sinon.stub().callsFake(() => []);
  }
}

describe('ProxyService', function() { // ------------------------------------------------

  it('should get target project id', async function() {
    const projectService = new ProjectServiceMock();
    const proxyService = new ProxyService(projectService, -1);
    expect(proxyService.getTargetProjectId({ headers: {}, hostname: 'myapp'})).to.be.equal('myapp');
    expect(proxyService.getTargetProjectId({ headers: {}, hostname: 'myapp.example.com'})).to.be.equal('myapp');
    expect(proxyService.getTargetProjectId({ headers: {}, hostname: 'www.myapp.example.com'})).to.be.equal('myapp');
    expect(proxyService.getTargetProjectId({ headers: {}, hostname: 'www.myapp.sub.example.com'})).to.be.equal('myapp');

    expect(proxyService.getTargetProjectId(
      {
        headers: {
          'x-forwarded-host': 'www.myapp.sub.example.com'
        }, 
        hostname: 'another.domain.com'
      }
    )).to.be.equal('myapp');
    
  });

  it('should route to project', async function() {
    const projectService = new ProjectServiceMock();
    projectService.getProjectFolders = sinon.stub().callsFake(() => [
      'app-392.3911',
      'app-111.3912',
    ]);
    const proxyService = new ProxyService(projectService, -1);

    expect(proxyService.getTargetHost('app-392')).to.be.equal('localhost:3911');
    expect(proxyService.getTargetHost('app-111')).to.be.equal('localhost:3912');
    expect(proxyService.getTargetHost('no-app-XXX')).to.be.equal(null);
  });

});