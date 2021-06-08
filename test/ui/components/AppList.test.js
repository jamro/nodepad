import { expect } from 'chai';
import { Table, TableHeader } from 'semantic-ui-react';
import AppList from '../../../ui/components/AppList.jsx';
import DeployButton from '../../../ui/components/DeployButton.jsx';
import StatusToggle from '../../../ui/components/StatusToggle.jsx';

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
    expect(wrapper.find('TableRow').at(1).find('StatusToggle').prop('isOnline')).to.be.equal(false);
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
    expect(wrapper.find('TableRow').at(1).find('StatusToggle').prop('isOnline')).to.be.equal(true);
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
        memory: 12099123,
        cpu: 18
      }
    ]}/>);
    expect(wrapper.find('TableRow').at(1).find('TableCell').at(3).html()).to.match(/12 MB/);
  });

  it('should notify about turn online', async function() {
    const onToggleOnline = sinon.spy();
    const wrapper = shallow((
      <AppList 
        apps={[
          {
            id: 'app-094',
            port: 1192,
            status: 'offline',
            memory: 33223,
            cpu: 0.3
          }
        ]}
        onToggleOnline={onToggleOnline}
      />
    ));
    wrapper.find(StatusToggle).prop('onToggle')(true)
    expect(onToggleOnline.calledWith('app-094', true)).to.be.true;
  });

  it('should notify about turn offline', async function() {
    const onToggleOnline = sinon.spy();
    const wrapper = shallow((
      <AppList 
        apps={[
          {
            id: 'app-093',
            port: 1192,
            status: 'online',
            memory: 33223,
            cpu: 0.3
          },
          {
            id: 'app-201',
            port: 223,
            status: 'offline',
            memory: 43,
            cpu: 0.3
          },
        ]}
        onToggleOnline={onToggleOnline}
      />
    ));
    wrapper.find(StatusToggle).at(0).prop('onToggle')(false)
    expect(onToggleOnline.calledWith('app-093', false)).to.be.true;
  });

  it('should notify about upload', async function() {
    const onUpload = sinon.spy();
    const wrapper = shallow((
      <AppList 
        apps={[
          {
            id: 'app-1219',
            port: 1192,
            status: 'online',
            memory: 33223,
            cpu: 0.3
          },
          {
            id: 'app-201',
            port: 223,
            status: 'online',
            memory: 43,
            cpu: 0.3
          },
        ]}
        onUpload={onUpload}
      />
    ));
    wrapper.find(DeployButton).at(0).prop('onUpload')('file-098873')
    expect(onUpload.calledWith('app-1219', 'file-098873')).to.be.true;
  });

});