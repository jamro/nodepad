import React, { useEffect, useState } from 'react';
import { Button, Form, Icon, Modal, Table, TextArea } from 'semantic-ui-react';
import PropTypes, { oneOf } from 'prop-types';
import LogsViewer from './LogsViewer.jsx';

const LogsButton = (props) => {
  const { logs, onRefresh } = props;
  const [open, setOpen] = useState(false);

  return <Modal
      closeIcon
      size="fullscreen"
      centered={false}
      open={open}
      onClose={() => setOpen(false)}
      onOpen={() => setOpen(true)}
      style={{top: '3em'}}
      trigger={<Button circular primary icon="file text" />}
    >
      <Modal.Header>Application Logs</Modal.Header>
      <LogsViewer 
        onRefresh={() => onRefresh()}
        logs={logs}
      />
      <Modal.Actions>
        <Button id="logs-close" onClick={() => setOpen(false)}>
          <Icon name='remove' /> Close
        </Button>
      </Modal.Actions>
    </Modal>
  
};

LogsButton.propTypes = {
  logs: PropTypes.arrayOf(PropTypes.string),
  onRefresh: PropTypes.func
}

LogsButton.defaultProps = {
  logs: [],
  onRefresh: () =>  { }
}

export default LogsButton;