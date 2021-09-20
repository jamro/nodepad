import React from 'react';
import PropTypes from 'prop-types';
import { Card } from 'semantic-ui-react';
import AppCard from './AppCard.jsx';


const AppDeck = (props) => {
  const { 
    apps,
    onUpload,
    onToggleOnline,
    onLogsRefresh
  } = props;
  const cards = apps.map(app => <AppCard 
    key={app.id}
    appId={app.id}
    appPort={app.port}
    url={app.url}
    memory={app.memory}
    cpu={app.cpu}
    status={app.status}
    isLoading={app.isLoading}
    logs={app.logs}
    onUpload={(file) => onUpload(app.id, file)}
    onToggleOnline={(requestedOnline) => onToggleOnline(app.id, requestedOnline)}
    onLogsRefresh={() => onLogsRefresh(app.id)}
  />)
  
  return <Card.Group  >
    {cards}
  </Card.Group>
};

AppDeck.propTypes = {
  apps: PropTypes.arrayOf(PropTypes.shape({
    id: PropTypes.string,
    port: PropTypes.number,
    status: PropTypes.string,
    memory: PropTypes.number,
    cpu: PropTypes.number,
  })),
  onToggleOnline: PropTypes.func,
  onUpload: PropTypes.func,
  onLogsRefresh: PropTypes.func,
}

AppDeck.defaultProps = {
  apps: [],
  onToggleOnline: () => {},
  onUpload: () => {},
  onLogsRefresh: () => {},
}

export default AppDeck;