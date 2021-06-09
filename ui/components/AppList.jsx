import React from 'react';
import { Icon, Table } from 'semantic-ui-react';
import PropTypes from 'prop-types';
import StatusToggle from './StatusToggle.jsx';
import DeployButton from './DeployButton.jsx';
import LogsButton from './LogsButton.jsx';

function bytesToSize(bytes) {
  var sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  if (bytes == 0) return '0';
  var i = parseInt(Math.floor(Math.log(bytes) / Math.log(1024)));
  return Math.round(bytes / Math.pow(1024, i), 2) + ' ' + sizes[i];
}

const AppList = (props) => {
  const {apps, onToggleOnline, onUpload, onLogsRefresh} = props;
  const rows = apps.map(app => (
    <Table.Row key={app.id}>
      <Table.Cell width={3}>{app.id}</Table.Cell>
      <Table.Cell width={3}>{app.port}</Table.Cell>
      <Table.Cell width={3}><Icon name={app.status === 'online' ? 'play' : 'pause'} />{app.status}</Table.Cell>
      <Table.Cell width={2}>{bytesToSize(app.memory)}</Table.Cell>
      <Table.Cell width={2}>{app.cpu}%</Table.Cell>
      <Table.Cell width={3}>
        <DeployButton 
          appId={app.id}
          onUpload={(file) => onUpload(app.id, file)}
        />
        <StatusToggle 
          isOnline={app.status === 'online'} 
          isLoading={app.isLoading} 
          onToggle={(requestedOnline) => onToggleOnline(app.id, requestedOnline)}
        />
        <LogsButton 
          logs={app.logs || []}
          onRefresh={() => onLogsRefresh(app.id)}
        />
      </Table.Cell>
    </Table.Row>)
  );
  if(rows.length === 0) {
    rows.push(<Table.Row key="empty">
      <Table.Cell className="empty-info" colSpan={5}>No applications found</Table.Cell>
    </Table.Row>)
  }
  return <div>
    <Table celled>
      <Table.Header>
        <Table.Row>
          <Table.HeaderCell>App ID</Table.HeaderCell>
          <Table.HeaderCell>Port</Table.HeaderCell>
          <Table.HeaderCell>Status</Table.HeaderCell>
          <Table.HeaderCell>Memory</Table.HeaderCell>
          <Table.HeaderCell>CPU</Table.HeaderCell>
          <Table.HeaderCell>Actions</Table.HeaderCell>
        </Table.Row>
      </Table.Header>
      <Table.Body>
        {rows}
      </Table.Body>
    </Table>
  </div>;
};

AppList.propTypes = {
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

AppList.defaultProps = {
  apps: [],
  onToggleOnline: () => {},
  onUpload: () => {},
  onLogsRefresh: () => {},
}

export default AppList;