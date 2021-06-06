import React from 'react';
import { Button, Icon, Table } from 'semantic-ui-react';
import PropTypes from 'prop-types';

const StatusToggle = (props) => {
  const { isOnline, isLoading, onToggle } = props
  if(isLoading) {
    return <div>
      <Button basic fluid color='black' disabled>
        <Icon loading name='asterisk' /> Loading...
      </Button>
    </div>
  }
  return <div>
    <Button basic color='black' fluid onClick={() => onToggle(!isOnline)}>
      <Icon name={isOnline ? 'toggle on' : 'toggle off'} /> {isOnline ? 'online' : 'offline'}
    </Button>
  </div>
};

StatusToggle.propTypes = {
  isOnline: PropTypes.bool,
  isLoading: PropTypes.bool,
  onToggle: PropTypes.func
}

StatusToggle.defaultProps = {
  isOnline: false,
  isLoading: false,
  onToggle: () => {}
}

export default StatusToggle;