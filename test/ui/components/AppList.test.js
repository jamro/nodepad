import { expect } from 'chai';
import { Table, TableHeader } from 'semantic-ui-react';
import AppList from '../../../ui/components/AppList.jsx';

describe('AppList', function() { // ------------------------------------------------

  it('should work without props', async function() {
    const wrapper = shallow(<AppList />);
    expect(wrapper.find('TableHeaderCell').at(0).html()).to.match(/app id/i);
    expect(wrapper.find('TableCell.empty-info').html()).to.match(/no applications found/i);
  });

  it('should list apps', async function() {
    const wrapper = shallow(<AppList apps={[
      {
        id: 'app-883',
        port: 8821,
        status: 'online',
        memory: 1001892,
        cpu: 5
      },
      {
        id: 'app-007',
        port: 8822,
        status: 'offline',
        memory: 0,
        cpu: 0
      }
    ]}/>);
    expect(wrapper.find('TableHeaderCell').at(0).html()).to.match(/app id/i);
    expect(wrapper.find('TableCell.empty-info')).to.be.empty;

    expect(wrapper.find('TableRow').at(1).find('TableCell').at(0).html()).to.match(/app-883/);
    expect(wrapper.find('TableRow').at(2).find('TableCell').at(0).html()).to.match(/app-007/);
  });

  it('should display app port', async function() {
    const wrapper = shallow(<AppList apps={[
      {
        id: 'app-229',
        port: 9118,
        status: 'online',
        memory: 1001892,
        cpu: 5
      }
    ]}/>);
    expect(wrapper.find('TableRow').at(1).find('TableCell').at(1).html()).to.match(/9118/);
  });

  it('should display offline apps', async function() {
    const wrapper = shallow(<AppList apps={[
      {
        id: 'app-122',
        port: 4201,
        status: 'offline',
        memory: 1001892,
        cpu: 5
      }
    ]}/>);
    expect(wrapper.find('TableRow').at(1).find('TableCell').at(2).html()).to.match(/offline/);
    expect(wrapper.find('TableRow').at(1).find('TableCell').at(2).find('Icon').prop('name')).to.be.equal('circle outline');
  });

  it('should display online apps', async function() {
    const wrapper = shallow(<AppList apps={[
      {
        id: 'app-122',
        port: 4201,
        status: 'online',
        memory: 1001892,
        cpu: 5
      }
    ]}/>);
    expect(wrapper.find('TableRow').at(1).find('TableCell').at(2).html()).to.match(/online/);
    expect(wrapper.find('TableRow').at(1).find('TableCell').at(2).find('Icon').prop('name')).to.be.equal('check circle');
  });

  it('should display CPU usage', async function() {
    const wrapper = shallow(<AppList apps={[
      {
        id: 'app-122',
        port: 4201,
        status: 'online',
        memory: 1001892,
        cpu: 18
      }
    ]}/>);
    expect(wrapper.find('TableRow').at(1).find('TableCell').at(4).html()).to.match(/18%/);
  });

  it('should display memory usage', async function() {
    const wrapper = shallow(<AppList apps={[
      {
        id: 'app-122',
        port: 4201,
        status: 'online',
        memory: 2099123,
        cpu: 18
      }
    ]}/>);
    expect(wrapper.find('TableRow').at(1).find('TableCell').at(3).html()).to.match(new RegExp((2099123).toLocaleString()));
  });

});