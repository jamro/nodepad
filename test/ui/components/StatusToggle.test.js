import { expect } from 'chai';

import StatusToggle from '../../../src/ui/components/StatusToggle.jsx';

describe('StatusToggle', function() { // ------------------------------------------------

  it('should work without props', async function() {
    const wrapper = mount(<StatusToggle />);

    expect(wrapper.find('Button')).to.be.lengthOf(1)
    expect(wrapper.find('Button').props()).to.have.property('icon',  'play');
  });

  it('should display online', async function() {
    const wrapper = mount(<StatusToggle isOnline={true} />);
    expect(wrapper.find('Button').props()).to.have.property('icon',  'pause');
  });

  it('should display offline', async function() {
    const wrapper = mount(<StatusToggle isOnline={false} />);
    expect(wrapper.find('Button').props()).to.have.property('icon',  'play');
  });

  it('should display loading', async function() {
    const wrapper = mount(<StatusToggle isLoading={true} />);
    expect(wrapper.find('Button').props()).to.have.property('loading');
    expect(wrapper.find('Button').props()).to.have.property('disabled',  true);
  });

  it('should toggle when offline', async function() {
    const onToggle = sinon.spy()
    const wrapper = mount(<StatusToggle isOnline={false} onToggle={onToggle}/>);
    wrapper.find('Button').simulate('click');
    expect(onToggle.callCount).to.be.equal(1)
  });

  it('should toggle when online', async function() {
    const onToggle = sinon.spy()
    const wrapper = mount(<StatusToggle isOnline={true} onToggle={onToggle}/>);
    wrapper.find('Button').simulate('click');
    expect(onToggle.callCount).to.be.equal(1)
  });


  it('should not toggle when loading', async function() {
    const onToggle = sinon.spy()
    const wrapper = mount(<StatusToggle isLoading={true} onToggle={onToggle}/>);
    wrapper.find('Button').simulate('click');
    expect(onToggle.callCount).to.be.equal(0)
  });

});