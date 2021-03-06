
import React, { useEffect, useState } from 'react';
import { Container, Divider, Grid, Icon, Message } from 'semantic-ui-react';
import AppHeader from './components/AppHeader.jsx';
import CreateButton from './components/CreateButton.jsx';
import AppDeck from './components/AppDeck.jsx';
import './style/index.less';
import {io} from 'socket.io-client';
const socket = io();

const App = () => {

  const [apps, setApps] = useState([]);
  const [aliases, setAliases] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);

  const setApp = (appId, props) => {
    const newApps = [...apps].map(app => {
      if(app.id === appId) {
        const newProps = (typeof(props) === 'function') ? props(app) : props;
        return {
          ...app,
          ...newProps
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

  const createAlias = async (id, port) => {
    const response = await fetch(
      './api/aliases',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          id,
          port: Number(port)
        })
      }
    );
    if(!response.ok) {
      setErrorMessage('Unable to create new alias');
    }
    await loadAliases();
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

  const loadAliases = async () => {
    setLoading(true);
    const response = await fetch('./api/aliases');
    if(!response.ok) {
      setErrorMessage('Unable to load alias list');
      setLoading(false);
    }
    setAliases(await response.json());
    setLoading(false);
  };

  const onAppStart = (appId) => {
    setApp(appId, {status: 'online'});
  };

  const onAppStop = (appId) => {
    setApp(appId, {status: 'offline'});
  };

  const onAppJobStatus = (appId, job) => {
    setApp(appId, (app) => ({
      content: { 
        ...app.content,
        job 
      }
    }));
  };

  const onAppDeploy = (appId, lastUpdate) => {
    setApp(appId, (app) => ({
      content: { 
        ...app.content,
        job: null,
        lastUpdate
      }
    }));
  };

  useEffect(async () => {
    await loadApps();
    await loadAliases();
  }, []);

  useEffect(() => {
    const onEvent = (payload) => {
      console.log('EVENT', payload);
      switch(payload.type) {
      case 'app-start': return onAppStart(payload.appId);
      case 'app-stop': return onAppStop(payload.appId);
      case 'app-job': return onAppJobStatus(payload.appId, payload.job);
      case 'app-deploy': return onAppDeploy(payload.appId, payload.lastUpdate);
      }
    };
    socket.on('event', onEvent);
    return function cleanup() {
      socket.off('event', onEvent);
    };
  });

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

  return <Container fluid>
    <AppHeader/>
    <Container style={{minHeight: '20em', padding: '2em'}} fluid={true}>
      {errorMessage ? errorWindow : null}
      <Grid style={{marginBottom: '1em'}}>
        <Grid.Row>
          <Grid.Column className="left aligned">
            <CreateButton 
              label="Create New Application"
              primary
              onCreate={createApp}
            />
            <CreateButton 
              icon="mail forward"
              label="Create Alias"
              onCreate={createAlias}
            />
          </Grid.Column>
        </Grid.Row>
      </Grid>
      <AppDeck 
        apps={apps}
        aliases={aliases}
        onToggleOnline={(appId, requestedOnline) => toggleOnline(appId, requestedOnline)}
        onUpload={upload}
        onLogsRefresh={(appId) => refreshLogs(appId)}
      />
    </Container>
    <Divider />
    <Container textAlign="center" style={{paddingBottom: '1em'}}>
      Hosted on <a href="https://github.com/jamro/nodepad" target="_blank" rel="noreferrer"><Icon name="github" />GitHub</a>.
      This project is licensed under the terms of the <a href="https://opensource.org/licenses/MIT" target="_blank" rel="noreferrer">MIT license</a>.
    </Container>
  </Container>;
};

export default App;