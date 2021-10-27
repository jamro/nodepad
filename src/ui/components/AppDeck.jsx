import React from 'react';
import PropTypes from 'prop-types';
import { Card, CardDescription } from 'semantic-ui-react';
import AppCard from './AppCard.jsx';
import AliasCard from './AliasCard.jsx';


const AppDeck = (props) => {
  const { 
    apps,
    aliases,
    onUpload,
    onToggleOnline,
    onLogsRefresh
  } = props;
  
  const appCards = apps.map(app => <AppCard 
    key={app.id}
    appId={app.id}
    appPort={app.port}
    url={app.url}
    memory={app.memory}
    cpu={app.cpu}
    status={app.status}
    updatedAt={app.content.lastUpdate}
    label={app.content.job ? app.content.job.description : ''}
    isLoading={app.isLoading}
    logs={app.logs}
    onUpload={(file) => onUpload(app.id, file)}
    onToggleOnline={(requestedOnline) => onToggleOnline(app.id, requestedOnline)}
    onLogsRefresh={() => onLogsRefresh(app.id)}
  />)

  const aliasCards = aliases.map(alias => <AliasCard 
    key={alias.id}
    aliasId={alias.id}
    appPort={alias.port}
    url={alias.url}
  />)
  
  return <Card.Group  >
    {[...appCards, ...aliasCards].sort((a,b) => a.key.localeCompare(b.key))}
  </Card.Group>
};

AppDeck.propTypes = {
  apps: PropTypes.arrayOf(PropTypes.shape({
    id: PropTypes.string,
    port: PropTypes.number,
    status: PropTypes.string,
    url: PropTypes.string,
    memory: PropTypes.number,
    cpu: PropTypes.number,
  })),
  aliases: PropTypes.arrayOf(PropTypes.shape({
    id: PropTypes.string,
    port: PropTypes.number,
    url: PropTypes.string,
  })),
  onToggleOnline: PropTypes.func,
  onUpload: PropTypes.func,
  onLogsRefresh: PropTypes.func,
}

AppDeck.defaultProps = {
  apps: [],
  aliases: [],
  onToggleOnline: () => {},
  onUpload: () => {},
  onLogsRefresh: () => {},
}

export default AppDeck;