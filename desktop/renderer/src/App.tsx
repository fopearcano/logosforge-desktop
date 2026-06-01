import { useEffect, useState } from 'react';

import { bridge, type BackendStatus } from './api/backend';
import { StatusBar } from './components/StatusBar';
import { DEFAULT_BASE_URL } from './features/whiteboard/whiteboardApi';
import { WhiteboardPage } from './features/whiteboard/WhiteboardPage';

export function App() {
  const [status, setStatus] = useState<BackendStatus>({
    state: 'connecting',
    baseUrl: '',
    managed: false,
  });

  useEffect(() => {
    let active = true;
    bridge.getBackendStatus().then((s) => {
      if (active) setStatus(s);
    });
    const unsubscribe = bridge.onBackendStatus((s) => setStatus(s));
    return () => {
      active = false;
      unsubscribe();
    };
  }, []);

  const baseUrl = status.baseUrl || DEFAULT_BASE_URL;
  const ready = status.state === 'connected';

  return (
    <div className="app">
      <header className="titlebar">
        <h1 className="app-title">LogosForge Whiteboard</h1>
      </header>
      <WhiteboardPage baseUrl={baseUrl} ready={ready} />
      <StatusBar status={status} />
    </div>
  );
}
