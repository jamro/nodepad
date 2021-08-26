import { expect } from 'chai';
import CreateButton from '../../../src/ui/components/CreateButton.jsx';

describe('CreateButton', function() { // ------------------------------------------------

  it('should work with default props', async function() {
    const wrapper = shallow(<CreateButton />);
    expect(wrapper.find('Modal')).to.be.lengthOf(1);
  });

  it('should submit new app details', async function() {
    const onCreate = sinon.spy();
    const wrapper = shallow(<CreateButton onCreate={onCreate} />);

    wrapper.find('#app-id').simulate('change', { target: { value: 'app-87332' } })
    wrapper.find('#app-port').simulate('change', { target: { value: '9827' } })
    wrapper.find('#app-create').simulate('click')

    expect(onCreate.calledWith('app-87332', 9827)).to.be.true;
  });

});