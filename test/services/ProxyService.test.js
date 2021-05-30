const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
const ProxyService = require('../../services/ProxyService.js');
const sinon = require('sinon');

chai.use(chaiAsPromised);
const expect = chai.expect;

class AppServiceMock {
  constructor() {
    this.getAppFolders = sinon.stub().callsFake(() => []);
  }
}

describe('ProxyService', function() { // ------------------------------------------------

  it('should get target app id', async function() {
    const appService = new AppServiceMock();
    const proxyService = new ProxyService(appService, -1);
    expect(proxyService.getTargetAppId({ headers: {}, hostname: 'myapp'})).to.be.equal('myapp');
    expect(proxyService.getTargetAppId({ headers: {}, hostname: 'myapp.example.com'})).to.be.equal('myapp');
    expect(proxyService.getTargetAppId({ headers: {}, hostname: 'www.myapp.example.com'})).to.be.equal('myapp');
    expect(proxyService.getTargetAppId({ headers: {}, hostname: 'www.myapp.sub.example.com'})).to.be.equal('myapp');

    expect(proxyService.getTargetAppId(
      {
        headers: {
          'x-forwarded-host': 'www.myapp.sub.example.com'
        }, 
        hostname: 'another.domain.com'
      }
    )).to.be.equal('myapp');
    
  });

  it('should route to hosted application', async function() {
    const appService = new AppServiceMock();
    appService.getAppFolders = sinon.stub().callsFake(() => [
      'app-392.3911',
      'app-111.3912',
    ]);
    const proxyService = new ProxyService(appService, -1);

    expect(proxyService.getTargetHost('app-392')).to.be.equal('localhost:3911');
    expect(proxyService.getTargetHost('app-111')).to.be.equal('localhost:3912');
    expect(proxyService.getTargetHost('no-app-XXX')).to.be.equal(null);
  });

});