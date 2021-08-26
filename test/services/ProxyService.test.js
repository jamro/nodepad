const ProxyService = require('../../src/services/ProxyService.js');

class AppServiceMock {
  constructor() {
    this.getAppFolders = sinon.stub().callsFake(() => []);
  }
}

describe('ProxyService', function() { // ------------------------------------------------

  it('should get target app id', async function() {
    const appService = new AppServiceMock();
    const proxyService = new ProxyService(appService, 'example19118.domain83.io');
    expect(proxyService.getTargetAppId({ headers: {}, hostname: 'myapp'})).to.be.equal(null);
    expect(proxyService.getTargetAppId({ headers: {}, hostname: 'myapp.example19118.domain83.io'})).to.be.equal('myapp');
    expect(proxyService.getTargetAppId({ headers: {}, hostname: 'www.myapp.example19118.domain83.io'})).to.be.equal('myapp');
    expect(proxyService.getTargetAppId({ headers: {}, hostname: 'www.myapp.sub.example19118.domain83.io'})).to.be.equal('myapp');

    expect(proxyService.getTargetAppId(
      {
        headers: {
          'x-forwarded-host': 'www.myapp.example19118.domain83.io'
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
    const proxyService = new ProxyService(appService, 'example88.co.uk');

    expect(proxyService.getTargetHost('app-392')).to.be.equal('http://localhost:3911');
    expect(proxyService.getTargetHost('app-111')).to.be.equal('http://localhost:3912');
    expect(proxyService.getTargetHost('no-app-XXX')).to.be.equal(null);
  });

});