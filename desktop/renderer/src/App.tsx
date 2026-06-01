import { useEffect, useState } from 'react';

import { bridge, type BackendStatus } from './api/backend';
import { StatusBar } from './components/StatusBar';
import { OutlinePanel } from './features/outline/OutlinePanel';
import type { OutlineItem } from './features/outline/types';
import { DEFAULT_BASE_URL } from './features/whiteboard/whiteboardApi';
import { WhiteboardPage } from './features/whiteboard/WhiteboardPage';

function scrollToHeading(index: number) {
  // Outline items are headings in document order, matching the editor's
  // h1/h2/h3 elements one-for-one, so the array index addresses the DOM node.
  const headings = document.querySelectorAll('.wb-editor h1, .wb-editor h2, .wb-editor h3');
  (headings[index] as HTMLElement | undefined)?.scrollIntoView({
    behavior: 'smooth',
    block: 'start',
  });
}

export function App() {
  const [status, setStatus] = useState<BackendStatus>({
    state: 'connecting',
    baseUrl: '',
    managed: false,
  });
  const [outlineVisible, setOutlineVisible] = useState(true);
  const [revision, setRevision] = useState(0);

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

  // Toggle the outline with Ctrl/Cmd+Shift+O.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.code === 'KeyO') {
        e.preventDefault();
        setOutlineVisible((v) => !v);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const baseUrl = status.baseUrl || DEFAULT_BASE_URL;
  const ready = status.state === 'connected';

  const handleNavigate = (_item: OutlineItem, index: number) => scrollToHeading(index);

  return (
    <div className="app">
      <header className="titlebar">
        <button
          type="button"
          className={`outline-toggle${outlineVisible ? ' is-active' : ''}`}
          onClick={() => setOutlineVisible((v) => !v)}
          aria-pressed={outlineVisible}
          title="Toggle Outline (Ctrl/Cmd+Shift+O)"
        >
          ☰
        </button>
        <h1 className="app-title">LogosForge Whiteboard</h1>
      </header>
      <div className="workarea">
        {outlineVisible && (
          <OutlinePanel
            baseUrl={baseUrl}
            ready={ready}
            revision={revision}
            onNavigate={handleNavigate}
          />
        )}
        <WhiteboardPage baseUrl={baseUrl} ready={ready} onSaved={() => setRevision((r) => r + 1)} />
      </div>
      <StatusBar status={status} />
    </div>
  );
}
