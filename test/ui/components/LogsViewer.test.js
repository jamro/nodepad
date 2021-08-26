import { expect } from 'chai';
import LogsViewer from '../../../src/ui/components/LogsViewer.jsx';

describe('LogsViewer', function() { // ------------------------------------------------

  it('should work with default props', async function() {
    const wrapper = shallow(<LogsViewer />);
    expect(wrapper.find('pre')).to.be.lengthOf(1);
  });

  it('should list logs', async function() {
    const logs = [
      'log8382-1',
      'log8382-2'
    ];
    const wrapper = shallow(<LogsViewer logs={logs} />);
    expect(wrapper.find('pre').prop('children')).to.be.equal("log8382-1\nlog8382-2")
  });
});