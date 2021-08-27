import React, { useEffect, useState } from 'react';
import { Grid, Icon, Message } from 'semantic-ui-react';
import AppList from './components/AppList.jsx';
import CreateButton from './components/CreateButton.jsx';

const App = () => {

  const [apps, setApps] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);

  const setApp = (appId, props) => {
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
  };

  const toggleOnline = async (appId, requestedOnline) => {
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
    if(!response.ok) {
      setErrorMessage('Unable to change application state');
      setApp(appId, {isLoading: false});
    }
    const app = await response.json();
    setApp(appId, {...app, isLoading: false});
  };

  const upload = async (appId, file) => {
    const formData = new FormData();
    formData.append('File', file);
    const response = await fetch(
      `./api/apps/${appId}/content/zip`,
      {
        method: 'POST',
        body: formData,
      }
    );
    if(!response.ok) {
      setErrorMessage('Unable to upload new content');
    }
  };

  const refreshLogs = async (appId) => {
    const response = await fetch(`./api/apps/${appId}/logs`);
    if(!response.ok) {
      setErrorMessage('Unable to get application logs');
    }
    const logs = await response.json();
    setApp(appId, {logs});
  };

  const createApp = async (id, port) => {
    const response = await fetch(
      './api/apps',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          id,
          port: Number(port),
          status: 'online'
        })
      }
    );
    if(!response.ok) {
      setErrorMessage('Unable to create new app');
    }
    await loadApps();
  };

  const loadApps = async () => {
    setLoading(true);
    const response = await fetch('./api/apps');
    if(!response.ok) {
      setErrorMessage('Unable to load application list');
      setLoading(false);
    }
    setApps(await response.json());
    setLoading(false);
  };

  useEffect(async () => {
    await loadApps();
  }, []);

  const errorWindow = <Message negative>
    <Message.Header>Oops, something went wrong :(</Message.Header>
    <p>{errorMessage}</p>
  </Message>;

  if(loading) {
    return <div style={{margin: '1em'}}>
      {errorMessage ? errorWindow : null}
      <p><Icon loading name='asterisk' /> Loading...</p>
    </div>;
  }

  return <div style={{margin: '1em'}}>
    <h1>NodePad Dashboard</h1>
    <p>Welcome to NodePad</p>
    <p><a href="./api">API  documentation</a></p>
    {errorMessage ? errorWindow : null}
    <Grid style={{marginBottom: '1em'}}>
      <Grid.Row>
        <Grid.Column className="right aligned">
          <CreateButton 
            onCreate={createApp}
          />
        </Grid.Column>
      </Grid.Row>
    </Grid>
    <AppList 
      apps={apps}
      onToggleOnline={(appId, requestedOnline) => toggleOnline(appId, requestedOnline)}
      onUpload={upload}
      onLogsRefresh={(appId) => refreshLogs(appId)}
    />
  </div>;
};

export default App;