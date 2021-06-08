import React from 'react';
import { Button, Icon, Table } from 'semantic-ui-react';
import PropTypes from 'prop-types';

const StatusToggle = (props) => {
  const { isOnline, isLoading, onToggle } = props
  if(isLoading) {
    return <Button circular disabled icon='asterisk' loading />
  }
  return <Button circular primary={!isOnline} icon={isOnline ? 'pause' : 'play'} onClick={() => onToggle(!isOnline)} />
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