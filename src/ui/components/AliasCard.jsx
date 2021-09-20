import React from 'react';
import PropTypes from 'prop-types';
import { Card, Icon } from 'semantic-ui-react';

const AliasCard = (props) => {
  const { 
    aliasId, 
    appPort, 
    url, 
  } = props;

  return <Card>
    <Card.Content style={{height: '5em', flexGrow: 'unset'}}>
      <Card.Header>{aliasId}</Card.Header>
      <Card.Meta>Port: {appPort}</Card.Meta>
    </Card.Content>
    <Card.Content style={{display: 'table', height: '3em', flexGrow: 'unset'}}>
      <div style={{display: 'table-cell', verticalAlign: 'middle'}}>
        <a href={url} target="_blank" className="app-link">{url}&nbsp;<Icon name="external" /></a>
      </div>
    </Card.Content>
    <Card.Content style={{display: 'table'}}>
      <div style={{color: '#bbb', fontSize: '3em', textAlign: 'center', verticalAlign: 'middle', display: 'table-cell'}}>
        <Icon name="mail forward" /> <br/>ALIAS
      </div>
    </Card.Content>
  </Card>
};

AliasCard.propTypes = {
  aliasId: PropTypes.string,
  appPort: PropTypes.number,
  url: PropTypes.string,
}

AliasCard.defaultProps = {
  aliasId: '',
  appPort: 0,
  url: '',
}

export default AliasCard;