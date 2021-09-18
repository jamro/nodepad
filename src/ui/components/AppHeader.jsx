import React from 'react';
import PropTypes from 'prop-types';
import { Header, Image, Menu } from 'semantic-ui-react';

const AppHeader = (props) => {
  return <div style={{marginBottom: '2em'}}>
    <Menu inverted>
      <Menu.Item header={true} as="h3">
        <Image src="./logo.png" size="mini" style={{marginRight: '1emc'}}/> NodePad
      </Menu.Item>
      <Menu.Item 
        name="REST API"
        position="right"
        link={true}
        href="./api"
        target="_blank"
      />
    </Menu>
  </div>
};

AppHeader.propTypes = {

}

AppHeader.defaultProps = {

}

export default AppHeader;