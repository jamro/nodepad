import React, { useState } from 'react';
import { Button, Icon, Modal } from 'semantic-ui-react';
import PropTypes from 'prop-types';

const DeployButton = (props) => {
  const { onUpload } = props;
  const [open, setOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState();
	const [isSelected, setIsSelected] = useState(false);


	const changeHandler = (event) => {
		setSelectedFile(event.target.files[0]);
		setIsSelected(true);
	};

	const handleSubmission = () => {
    onUpload(selectedFile)
    setOpen(false);
	};

  return <Modal
      closeIcon
      open={open}
      onClose={() => setOpen(false)}
      onOpen={() => setOpen(true)}
      trigger={<Button circular primary icon='cloud upload'  />}
    >
      <Modal.Header>Upload Application Content</Modal.Header>
      <Modal.Content image>
        <input 
          id="bin-upload-file"
          type="file" 
          name="bin" 
          accept=".zip"
          onChange={changeHandler} 
        />
      </Modal.Content>
      <Modal.Actions>
        <Button id="bin-upload-cancel" onClick={() => setOpen(false)}>
          <Icon name='remove' /> Cancel
        </Button>
        <Button id="bin-upload-submit" primary onClick={handleSubmission} disabled={!isSelected} >
          <Icon name='cloud upload' /> Upload
        </Button>
      </Modal.Actions>
    </Modal>
};

DeployButton.propTypes = {
  onUpload: PropTypes.func
}
DeployButton.defaultProps = {
  onUpload: () => {}
}

export default DeployButton;