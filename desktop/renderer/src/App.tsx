import { useEffect, useRef, useState } from 'react';

import { bridge, type BackendStatus } from './api/backend';
import { StatusBar } from './components/StatusBar';
import { OutlinePanel } from './features/outline/OutlinePanel';
import type { OutlineItem } from './features/outline/types';
import { PsykeWindow } from './features/psyke/PsykeWindow';
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

function currentSelectionText(): string {
  return window.getSelection()?.toString().trim() ?? '';
}

export function App() {
  const [status, setStatus] = useState<BackendStatus>({
    state: 'connecting',
    baseUrl: '',
    managed: false,
  });
  const [outlineVisible, setOutlineVisible] = useState(true);
  const [revision, setRevision] = useState(0);
  const [psykeOpen, setPsykeOpen] = useState(false);
  const [psykeQuery, setPsykeQuery] = useState('');

  const psykeOpenRef = useRef(psykeOpen);
  psykeOpenRef.current = psykeOpen;

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

  // Global shortcuts: Outline (Ctrl/Cmd+Shift+O), PSYKE (Ctrl/Cmd+Shift+P).
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const mod = e.metaKey || e.ctrlKey;
      if (!mod || !e.shiftKey) return;
      if (e.code === 'KeyO') {
        e.preventDefault();
        setOutlineVisible((v) => !v);
      } else if (e.code === 'KeyP') {
        e.preventDefault();
        if (psykeOpenRef.current) {
          setPsykeOpen(false);
        } else {
          setPsykeQuery(currentSelectionText());
          setPsykeOpen(true);
        }
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const baseUrl = status.baseUrl || DEFAULT_BASE_URL;
  const ready = status.state === 'connected';

  const openPsyke = () => {
    setPsykeQuery(currentSelectionText());
    setPsykeOpen(true);
  };
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
        <button
          type="button"
          className={`psyke-toggle${psykeOpen ? ' is-active' : ''}`}
          onClick={() => (psykeOpen ? setPsykeOpen(false) : openPsyke())}
          aria-pressed={psykeOpen}
          title="Toggle PSYKE (Ctrl/Cmd+Shift+P)"
        >
          PSYKE
        </button>
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
      {psykeOpen && (
        <PsykeWindow baseUrl={baseUrl} initialQuery={psykeQuery} onClose={() => setPsykeOpen(false)} />
      )}
      <StatusBar status={status} />
    </div>
  );
}
