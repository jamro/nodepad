import React, { useEffect, useState } from 'react';
import { Icon } from 'semantic-ui-react';
import AppList from './components/AppList.jsx';

const App = () => {

  const [apps, setApps] = useState([]);
  const [loading, setLoading] = useState(false);

  function setApp(appId, props) {
    const newApps = [...apps].map(app => {
      if(app.id === appId) {
        return {
          ...app,
          ...props
        };
      }
      return app;
    });
    setApps(newApps);
  }

  async function toggleOnline(appId, requestedOnline) {
    setApp(appId, {isLoading: true});
    const response = await fetch(`./api/apps/${appId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        status: requestedOnline ? 'online' : 'offline' 
      })
    });
    const app = await response.json();
    setApp(appId, {...app, isLoading: false});
  }

  useEffect(async () => {
    setLoading(true);
    const response = await fetch('./api/apps');
    setApps(await response.json());
    setLoading(false);
  }, []);

  if(loading) {
    return <div style={{margin: '1em'}}>
      <p><Icon loading name='asterisk' /> Loading...</p>
    </div>;
  }

  return <div style={{margin: '1em'}}>
    <h1>NodePad Dashboard</h1>
    <p>Welcome to NodePad</p>
    <p><a href="./api">API  documentation</a></p>
    <AppList 
      apps={apps}
      onToggleOnline={(appId, requestedOnline) => toggleOnline(appId, requestedOnline)}
    />
  </div>;
};

export default App;