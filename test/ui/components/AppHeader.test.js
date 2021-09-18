import { expect } from 'chai';
import AppHeader from '../../../src/ui/components/AppHeader.jsx';

describe('AppHeader', function() { // ------------------------------------------------

  it('should work with default props', async function() {
    const wrapper = shallow(<AppHeader />);
    expect(wrapper.find('Menu')).to.be.lengthOf(1);
  });


});