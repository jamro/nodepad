import React from 'react';
import PropTypes from 'prop-types';
import { Button, Card, Grid, Icon, Label, Statistic, Tab } from 'semantic-ui-react';
import DeployButton from './DeployButton.jsx';
import StatusToggle from './StatusToggle.jsx';
import LogsButton from './LogsButton.jsx';

function bytesToSize(bytes) {
  var sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  if (bytes == 0) return '0';
  var i = parseInt(Math.floor(Math.log(bytes) / Math.log(1024)));
  return Math.round(bytes / Math.pow(1024, i), 2) + ' ' + sizes[i];
}

const AppCard = (props) => {
  const { 
    appId, 
    appPort, 
    url, 
    memory, 
    cpu,
    status,
    updatedAt,
    onUpload,
    isLoading,
    onToggleOnline,
    logs,
    onLogsRefresh,
    label
  } = props;

  const errorLabel = !!label.match(/error/i)

  let metaContent;
  if(label) {
    metaContent = <Label color={errorLabel ? 'red' : 'blue'} ribbon>
         <Icon name={errorLabel ? 'warning sign' : 'spinner'} loading={!errorLabel} /> {label}
      </Label>;
  } else {
    metaContent = <small>Updated: {updatedAt ? new Date(updatedAt).toLocaleString() : 'Unknown'}</small>
  }

  return <Card >
    <Card.Content style={{height: '6em', flexGrow: 'unset'}}>
      <Icon 
        circular 
        name={status === 'online' ? 'check' : 'pause'} 
        style={{
          float: 'right', 
          marginTop: '0.25em', 
          backgroundColor: (status === 'online' ? 'green' : 'red'), 
          color: 'white',
        }} 
      />
      <Card.Header>{appId}</Card.Header>
      <Card.Meta><small>Port: {appPort}</small></Card.Meta>
      <Card.Meta>
        { metaContent }
      </Card.Meta>
    </Card.Content>
    <Card.Content style={{display: 'table', height: '3em', flexGrow: 'unset'}}>
      <div style={{display: 'table-cell', verticalAlign: 'middle'}}>
        <a href={url} target="_blank" className="app-link">{url}&nbsp;<Icon name="external" /></a>
      </div>
    </Card.Content>
    <Card.Content>
      <Grid >
        <Grid.Row columns={2}>
          <Grid.Column style={{textAlign: 'center'}} >
            <Statistic size='tiny' className="cpu-stats">
              <Statistic.Value>{cpu}%</Statistic.Value>
              <Statistic.Label>CPU</Statistic.Label>
            </Statistic>
          </Grid.Column>
          <Grid.Column style={{textAlign: 'center'}}>
            <Statistic size='tiny' className="memory-stats">
              <Statistic.Value>{bytesToSize(memory)}</Statistic.Value>
              <Statistic.Label>Memory</Statistic.Label>
            </Statistic>
          </Grid.Column>
        </Grid.Row>
      </Grid>
    </Card.Content>
    <Card.Content style={{display: 'table', height: '5em', flexGrow: 'unset'}}>
      <div style={{display: 'table-cell', verticalAlign: 'bottom'}}>
        <Button.Group fluid >
          <StatusToggle 
            isOnline={status === 'online'} 
            isLoading={isLoading} 
            onToggle={(requestedOnline) => onToggleOnline(requestedOnline)}
          />
          <DeployButton 
            appId={appId}
            onUpload={(file) => onUpload(file)}
          />
          <LogsButton 
            logs={logs || []}
            onRefresh={() => onLogsRefresh()}
          />
        </Button.Group>
      </div>
    </Card.Content>
  </Card>
};

AppCard.propTypes = {
  appId: PropTypes.string,
  appPort: PropTypes.number,
  url: PropTypes.string,
  memory: PropTypes.number,
  cpu: PropTypes.number,
  status: PropTypes.string,
  label: PropTypes.string,
  updatedAt: PropTypes.string,
  onUpload: PropTypes.func,
  onToggleOnline: PropTypes.func,
  onLogsRefresh: PropTypes.func,
  isLoading: PropTypes.bool,
  logs: PropTypes.arrayOf(PropTypes.string),
}

AppCard.defaultProps = {
  appId: '',
  appPort: 0,
  url: '',
  memory: 0,
  cpu: 0,
  status: 'offline',
  label: '',
  updatedAt: null,
  onUpload: () => {},
  onToggleOnline: () => {},
  onLogsRefresh: () => {},
  isLoading: false,
  logs: []
}

export default AppCard;