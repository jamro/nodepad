import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { Button, Form, Icon, Modal } from 'semantic-ui-react';

const CreateButton = (props) => {
  const { onCreate } = props;
  const [open, setOpen] = useState(false);
  const [appId, setAppId] = useState();
  const [appPort, setAppPort] = useState();
  
  const handleCreate = () => {
    setOpen(false);
    onCreate(appId, Number(appPort));
  }

  return <Modal
      style={{top: '1em'}}
      onClose={() => setOpen(false)}
      onOpen={() => setOpen(true)}
      open={open}
      trigger={<Button icon labelPosition='left' primary><Icon name='plus' /> Create New Application</Button>}
    >
      <Modal.Header>Create New Application</Modal.Header>
      <Modal.Content>
        <Form>
          <Form.Field>
            <label>App ID</label>
            <input id="app-id" placeholder='Application ID' defaultValue={appId} onChange={(e) => setAppId(e.target.value)}/>
          </Form.Field>
          <Form.Field>
            <label>App Port (internal)</label>
            <input id="app-port" placeholder='Application Port' type="number" defaultValue={appPort} onChange={(e) => setAppPort(e.target.value)} />
          </Form.Field>
        </Form>
      </Modal.Content>
      <Modal.Actions>
        <Button onClick={() => setOpen(false)}>
          Cancel
        </Button>
        <Button
          id="app-create"
          content="Create"
          labelPosition='right'
          icon='plus'
          onClick={() => handleCreate()}
          primary
          disabled={!appId || !appPort}
        />
      </Modal.Actions>
    </Modal>
      
};

CreateButton.propTypes = {
  onCreate: PropTypes.func
}

CreateButton.defaultProps = {
  onCreate: () => {}
}

export default CreateButton;