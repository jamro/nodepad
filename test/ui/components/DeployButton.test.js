import { expect } from 'chai';
import DeployButton from '../../../ui/components/DeployButton.jsx';

describe('DeployButton', function() { // ------------------------------------------------

  it('should work with default props', async function() {
    const wrapper = shallow(<DeployButton />);
    expect(wrapper.find('Modal')).to.be.lengthOf(1);
  });

  it('should notify upload', async function() {
    const onUpload = sinon.spy();
    const wrapper = shallow(<DeployButton onUpload={onUpload} />);
    
    wrapper.find('#bin-upload-file').simulate('change', {
      target: {
         files: [
           'bin9773.zip'
         ]   
      }
    });
    expect(onUpload.callCount).to.be.equal(0)
    wrapper.find('#bin-upload-submit').simulate('click');
    expect(onUpload.callCount).to.be.equal(1)
    expect(onUpload.calledWith('bin9773.zip')).to.be.true
  });

  

});