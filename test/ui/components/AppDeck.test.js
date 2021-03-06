import { expect } from 'chai';
import AppDeck from '../../../src/ui/components/AppDeck.jsx';

describe('AppDeck', function() { // ------------------------------------------------

  it('should work with default props', async function() {
    const wrapper = shallow(<AppDeck />);
    expect(wrapper.find('CardGroup')).to.be.lengthOf(1);
  });

  it('should list apps', async function() {
    const wrapper = shallow(
      <AppDeck 
        apps={[
          {
            id: 'app-883',
            port: 8821,
            status: 'online',
            memory: 1001892,
            cpu: 5,
            content: {
              lastUpdate: new Date().toISOString()
            }
          },
          {
            id: 'app-007',
            port: 8822,
            status: 'offline',
            memory: 0,
            cpu: 0,
            content: {
              lastUpdate: new Date().toISOString()
            }
          }
        ]}
        aliases={[
          {
            id: 'app-111',
            port: 1192,
          }
        ]}
      />
    );

    expect(wrapper.find('AppCard')).to.have.length(2);
    expect(wrapper.find('AliasCard')).to.have.length(1);
    
    expect(wrapper.find('AppCard').at(1).props()).to.include({
      appId: 'app-883',
      appPort: 8821,
      status: 'online',
      memory: 1001892,
      cpu: 5
    })
    expect(wrapper.find('AppCard').at(0).props()).to.include({
      appId: 'app-007',
      appPort: 8822,
      status: 'offline',
      memory: 0,
      cpu: 0
    })
    expect(wrapper.find('AliasCard').at(0).props()).to.include({
      aliasId: 'app-111',
      appPort: 1192,
    })
  });

});