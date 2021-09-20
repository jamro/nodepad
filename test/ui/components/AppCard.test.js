import { expect } from 'chai';
import AppCard from '../../../src/ui/components/AppCard.jsx';

describe('AppCard', function() { // ------------------------------------------------

  it('should work with default props', async function() {
    const wrapper = shallow(<AppCard />);
    expect(wrapper.find('Card')).to.be.lengthOf(1);
  });

  it('should display app id', async function() {
    const wrapper = shallow(<AppCard appId="myapp92"/>);
    expect(wrapper.html()).to.match(/myapp92/);
  });

  it('should display app port', async function() {
    const wrapper = shallow(<AppCard appPort={3982}/>);
    expect(wrapper.html()).to.match(/port: 3982/i)
  });

  it('should display url', async function() {
    const wrapper = shallow(<AppCard url="http://myapp.domain72.com:89" />);
    expect(wrapper.find('a.app-link').prop('href')).to.be.equal("http://myapp.domain72.com:89");
    expect(wrapper.find('a.app-link').prop('target')).to.be.equal("_blank");
    expect(wrapper.find('a.app-link').text()).to.be.match(/http:\/\/myapp\.domain72\.com:89/);
  });

  [
    {num: 0, text: '0'},
    {num: 1, text: '1 B'},
    {num: 100, text: '100 B'},
    {num: 1023, text: '1023 B'},
    {num: 1024, text: '1 KB'},
    {num: 2560, text: '3 KB'},
    {num: 1048576, text: '1 MB'},
  ].forEach((data) => {
    it(`should display memory stats (${data.num}B -> "${data.text}")`, async function() {
      const wrapper = shallow(<AppCard memory={data.num} />);
      expect(wrapper.find('Statistic.memory-stats').find('StatisticValue').html()).to.be.contain(data.text)
    })
  })

  it(`should display cpu stats`, async function() {
    const wrapper = shallow(<AppCard cpu={31.872} />);
    expect(wrapper.find('Statistic.cpu-stats').find('StatisticValue').html()).to.be.contain('31.872%')
  })

  it('should have action buttons', async function() {
    const wrapper = shallow(<AppCard />);
    expect(wrapper.find('DeployButton')).to.have.length(1)
    expect(wrapper.find('LogsButton')).to.have.length(1)
    expect(wrapper.find('StatusToggle')).to.have.length(1)
  });
});