import { expect } from 'chai';
import StatusToggle from '../../../ui/components/StatusToggle.jsx';

describe('StatusToggle', function() { // ------------------------------------------------

  it('should work without props', async function() {
    const wrapper = shallow(<StatusToggle />);

    expect(wrapper.find('Button')).to.be.lengthOf(1)
    expect(wrapper.find('Button').props()).to.not.have.property('disabled',  true);
    expect(wrapper.find('Icon').prop('name')).to.be.equal('toggle off');
  });

  it('should display online', async function() {
    const wrapper = shallow(<StatusToggle isOnline={true} />);
    expect(wrapper.find('Icon').prop('name')).to.be.equal('toggle on');
    expect(wrapper.find('Button').props()).to.not.have.property('disabled',  true);
  });

  it('should display offline', async function() {
    const wrapper = shallow(<StatusToggle isOnline={false} />);
    expect(wrapper.find('Icon').prop('name')).to.be.equal('toggle off');
    expect(wrapper.find('Button').props()).to.not.have.property('disabled',  true);
  });

  it('should display loadding', async function() {
    const wrapper = shallow(<StatusToggle isLoading={true} />);
    expect(wrapper.find('Icon').prop('name')).to.be.equal('asterisk');
    expect(wrapper.find('Button').props()).to.have.property('disabled',  true);
  });

  it('should toggle when offline', async function() {
    const onToggle = sinon.spy()
    const wrapper = shallow(<StatusToggle isOnline={false} onToggle={onToggle}/>);
    wrapper.find('Button').simulate('click');
    expect(onToggle.callCount).to.be.equal(1)
  });

  it('should toggle when online', async function() {
    const onToggle = sinon.spy()
    const wrapper = shallow(<StatusToggle isOnline={true} onToggle={onToggle}/>);
    wrapper.find('Button').simulate('click');
    expect(onToggle.callCount).to.be.equal(1)
  });


  it('should not toggle when loading', async function() {
    const onToggle = sinon.spy()
    const wrapper = shallow(<StatusToggle isLoading={true} onToggle={onToggle}/>);
    wrapper.find('Button').simulate('click');
    expect(onToggle.callCount).to.be.equal(0)
  });

});