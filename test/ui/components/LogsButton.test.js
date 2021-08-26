import { expect } from 'chai';
import LogsButton from '../../../src/ui/components/LogsButton.jsx';

describe('LogButton', function() { // ------------------------------------------------

  it('should work with default props', async function() {
    const wrapper = shallow(<LogsButton />);
    expect(wrapper.find('Modal')).to.be.lengthOf(1);
  });

});