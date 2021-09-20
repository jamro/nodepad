import React from 'react';
import PropTypes from 'prop-types';
import { Header, Image, Menu } from 'semantic-ui-react';

const AppHeader = (props) => {
  return <div style={{margin: '0.5em 0.5em 2em 0.5em'}}>
    <Menu inverted>
      <Menu.Item header={true} as="h3">
        <Image src="./logo.png" size="mini" style={{marginRight: '1em'}}/> NodePad
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