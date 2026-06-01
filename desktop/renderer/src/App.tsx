import { useEffect, useRef, useState } from 'react';

import { bridge, type BackendStatus } from './api/backend';
import { StatusBar } from './components/StatusBar';
import { OutlinePanel } from './features/outline/OutlinePanel';
import type { OutlineItem } from './features/outline/types';
import { PsykeWindow } from './features/psyke/PsykeWindow';
import { DEFAULT_BASE_URL } from './features/whiteboard/whiteboardApi';
import { WhiteboardPage } from './features/whiteboard/WhiteboardPage';
import { useTheme } from './theme';

function scrollToBlock(index: number) {
  // Outline items carry the source block index; the editor's top-level children
  // are those blocks in order.
  const surface = document.querySelector('.wb-editor');
  const child = surface?.children[index] as HTMLElement | undefined;
  child?.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

function currentSelectionText(): string {
  return window.getSelection()?.toString().trim() ?? '';
}

export function App() {
  const [theme, toggleTheme] = useTheme();
  const [status, setStatus] = useState<BackendStatus>({
    state: 'connecting',
    baseUrl: '',
    managed: false,
  });
  const [outlineVisible, setOutlineVisible] = useState(true);
  const [outlineItems, setOutlineItems] = useState<OutlineItem[]>([]);
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

  return (
    <div className="app">
      <header className="titlebar">
        <button
          type="button"
          className={`icon-toggle${outlineVisible ? ' is-active' : ''}`}
          onClick={() => setOutlineVisible((v) => !v)}
          aria-pressed={outlineVisible}
          title="Toggle Outline (Ctrl/Cmd+Shift+O)"
        >
          ☰
        </button>
        <h1 className="app-title">LogosForge Whiteboard</h1>
        <div className="titlebar-right">
          <button
            type="button"
            className="icon-toggle"
            onClick={toggleTheme}
            title={`Switch to ${theme === 'light' ? 'dark' : 'light'} theme`}
            aria-label="Toggle theme"
          >
            {theme === 'light' ? '☾' : '☀'}
          </button>
          <button
            type="button"
            className={`psyke-toggle${psykeOpen ? ' is-active' : ''}`}
            onClick={() => (psykeOpen ? setPsykeOpen(false) : openPsyke())}
            aria-pressed={psykeOpen}
            title="Toggle PSYKE (Ctrl/Cmd+Shift+P)"
          >
            PSYKE
          </button>
        </div>
      </header>
      <div className="workarea">
        {outlineVisible && (
          <OutlinePanel items={outlineItems} onNavigate={(item) => scrollToBlock(item.blockIndex)} />
        )}
        <WhiteboardPage baseUrl={baseUrl} ready={ready} onOutlineChange={setOutlineItems} />
      </div>
      {psykeOpen && (
        <PsykeWindow baseUrl={baseUrl} initialQuery={psykeQuery} onClose={() => setPsykeOpen(false)} />
      )}
      <StatusBar status={status} />
    </div>
  );
}
