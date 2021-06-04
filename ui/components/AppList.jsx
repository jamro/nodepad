import React from 'react';
import { Icon, Table } from 'semantic-ui-react';
import PropTypes from 'prop-types';

function bytesToSize(bytes) {
  var sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  if (bytes == 0) return '0 Byte';
  var i = parseInt(Math.floor(Math.log(bytes) / Math.log(1024)));
  return Math.round(bytes / Math.pow(1024, i), 2) + ' ' + sizes[i];
}

const AppList = (props) => {
  const {apps} = props;
  const rows = apps.map(app => (
    <Table.Row key={app.id}>
      <Table.Cell>{app.id}</Table.Cell>
      <Table.Cell>{app.port}</Table.Cell>
      <Table.Cell><Icon name={app.status === 'online' ? 'check circle' : 'circle outline'} /> {app.status}</Table.Cell>
      <Table.Cell>{bytesToSize(app.memory)}</Table.Cell>
      <Table.Cell>{app.cpu}%</Table.Cell>
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
  }))
}

AppList.defaultProps = {
  apps: []
}

export default AppList;