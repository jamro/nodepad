import React, { useState } from 'react';
import { Button, Icon, Modal, Popup } from 'semantic-ui-react';
import PropTypes from 'prop-types';

const DeployButton = (props) => {
  const { onUpload } = props;
  const [open, setOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState();
	const [isSelected, setIsSelected] = useState(false);
  const [inProgress, setInProgress] = useState(false);

	const changeHandler = (event) => {
		setSelectedFile(event.target.files[0]);
		setIsSelected(true);
	};

	const handleSubmission = async () => {
    setInProgress(true)
    await onUpload(selectedFile)
    setInProgress(false)
    setOpen(false);
	};

  const triggerButton = <Button icon='cloud upload'  />

  const fileInput = <input 
      id="bin-upload-file"
      type="file" 
      name="bin" 
      accept=".zip"
      onChange={changeHandler} 
    />

  return <Modal
      closeIcon={!inProgress}
      size="tiny"
      centered={false}
      open={open}
      onClose={() => setOpen(false)}
      onOpen={() => setOpen(true)}
      trigger={triggerButton}
    >
      <Modal.Header>Upload Application Content</Modal.Header>
      <Modal.Content>
        {inProgress ? "Uploading..." : fileInput}
      </Modal.Content>
      <Modal.Actions>
        <Button id="bin-upload-cancel" onClick={() => setOpen(false)} disabled={inProgress}>
          <Icon name='remove' /> Cancel
        </Button>
        <Button id="bin-upload-submit" primary onClick={handleSubmission} disabled={!isSelected || inProgress} >
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