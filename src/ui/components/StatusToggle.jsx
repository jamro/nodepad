import React from 'react';
import { Button, Icon, Popup, Table } from 'semantic-ui-react';
import PropTypes from 'prop-types';

const StatusToggle = (props) => {
  const { isOnline, isLoading, onToggle } = props
  if(isLoading) {
    return <Button disabled icon='asterisk' loading />
  }
  const triggerButton = <Button  
      primary={!isOnline} 
      icon={isOnline ? 'pause' : 'play'} 
      color={isOnline ? 'red' : undefined}
      onClick={() => onToggle(!isOnline)} 
    />

  return <Popup content={isOnline ? 'Stop application' : 'Start application'} trigger={triggerButton} />
};

const triggerButton = <Popup content='Preview application logs' trigger={<Button icon="file text" />} />

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