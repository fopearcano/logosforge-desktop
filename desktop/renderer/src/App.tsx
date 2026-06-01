import React, { useEffect, useState } from 'react';

import { bridge, type BackendStatus } from './api/backend';
import { StatusBar } from './components/StatusBar';
import { WhiteboardPlaceholder } from './components/Whiteboard';

export function App() {
  const [status, setStatus] = useState<BackendStatus>({
    state: 'connecting',
    baseUrl: '',
    managed: false,
  });

  useEffect(() => {
    let active = true;
    // Pull the current status once...
    bridge.getBackendStatus().then((s) => {
      if (active) setStatus(s);
    });
    // ...then subscribe to live updates.
    const unsubscribe = bridge.onBackendStatus((s) => setStatus(s));
    return () => {
      active = false;
      unsubscribe();
    };
  }, []);

  return (
    <div className="app">
      <header className="titlebar">
        <h1 className="app-title">LogosForge Whiteboard</h1>
      </header>
      <WhiteboardPlaceholder />
      <StatusBar status={status} />
    </div>
  );
}
