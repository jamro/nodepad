import { expect } from 'chai';
import AliasCard from '../../../src/ui/components/AliasCard.jsx';

describe('AliasCard', function() { // ------------------------------------------------

  it('should work with default props', async function() {
    const wrapper = shallow(<AliasCard />);
    expect(wrapper.find('Card')).to.be.lengthOf(1);
  });

  it('should display app id', async function() {
    const wrapper = shallow(<AliasCard aliasId="myapp92"/>);
    expect(wrapper.html()).to.match(/myapp92/);
  });

  it('should display app port', async function() {
    const wrapper = shallow(<AliasCard appPort={3982}/>);
    expect(wrapper.html()).to.match(/port: 3982/i)
  });

  it('should display url', async function() {
    const wrapper = shallow(<AliasCard url="http://myapp.domain72.com:89" />);
    expect(wrapper.find('a.app-link').prop('href')).to.be.equal("http://myapp.domain72.com:89");
    expect(wrapper.find('a.app-link').prop('target')).to.be.equal("_blank");
    expect(wrapper.find('a.app-link').text()).to.be.match(/http:\/\/myapp\.domain72\.com:89/);
  });

});