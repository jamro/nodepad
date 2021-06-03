import React, { useEffect, useState } from 'react';
import AppList from './components/AppList.jsx';

const App = () => {

  const [apps, setApps] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(async () => {
    setLoading(true);
    const response = await fetch('./api/apps');
    setApps(await response.json());
    setLoading(false);
  }, []);

  if(loading) {
    return <div style={{margin: '1em'}}>
      <p>Loading...</p>
    </div>;
  }


  return <div style={{margin: '1em'}}>
    <h1>NodePad Dashboard</h1>
    <p>Welcome to NodePad</p>
    <p><a href="./api">API  documentation</a></p>
    <AppList apps={apps}/>
  </div>;
};

export default App;