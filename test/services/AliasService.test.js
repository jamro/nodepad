const AliasService = require('../../src/services/AliasService.js');
const path = require('path');
const fs = require('fs');
const { alias } = require('yargs');

chai.use(chaiAsPromised);
const expect = chai.expect;

function createWorkspace() {
  const workspaceName = (new Date().getTime() * 1000 + Math.floor(Math.random()*1000)).toString(16);
  const workspacePath = path.resolve(__dirname, '..', '..', 'tmp', workspaceName);
  fs.mkdirSync(workspacePath);
  return workspacePath;
}

function clearWorkspace(path) {
  fs.rmdirSync(path, { recursive: true });
}

describe('AliasService', function() { // ------------------------------------------------

  let workspace;

  beforeEach(function() {
    workspace = createWorkspace();
  });

  afterEach(function() {
    clearWorkspace(workspace);
  });

  it('should create aliases', async function() {
    const aliasService = new AliasService(workspace, 'http', 'example.com', 87);
    aliasService.create('testalias-993', 8999);
    aliasService.create('testalias-994', 8999);
    const aliasList = aliasService.getAliasList();
    expect(aliasList).to.have.length(2);
    expect(aliasList[0]).to.have.property('id', 'testalias-993');
    expect(aliasList[0]).to.have.property('port', 8999);
    expect(aliasList[0]).to.have.property('url', 'http://testalias-993.example.com:87');
    expect(aliasList[1]).to.have.property('id', 'testalias-994');
    expect(aliasList[1]).to.have.property('port', 8999);
    expect(aliasList[1]).to.have.property('url', 'http://testalias-994.example.com:87');
  });

  it('should not duplicate aliases', async function() {
    const aliasService = new AliasService(workspace, 'http', 'example.com', 80);
    aliasService.create('testalias-4', 1129);

    expect(() => aliasService.create('testalias-4', 8887)).to.throw();
    const aliasList = aliasService.getAliasList();
    expect(aliasList).to.have.length(1);
  });

  it('should get alias URL', async function() {
    const aliasService = new AliasService(workspace, 'http', 'site.com', 87);
    aliasService.create('alias993', 2882);
    const url = aliasService.getAliasUrl('alias993');
    expect(url).to.be.equal('http://alias993.site.com:87');
  });

  it('should remove alias', async function() {
    const aliasService = new AliasService(workspace, 'http', 'site.com', 87);
    aliasService.create('alias6621', 3122);
    const list1 = aliasService.getAliasList();
    expect(list1).to.have.length(1);
    await aliasService.delete('alias6621');
    const list2 = aliasService.getAliasList();
    expect(list2).to.have.length(0);
  });

});