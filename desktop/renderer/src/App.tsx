import { useCallback, useEffect, useRef, useState } from 'react';

import { bridge, type BackendStatus } from './api/backend';
import { StatusBar } from './components/StatusBar';
import { onMenuView } from './features/files/fileApi';
import { OutlinePanel } from './features/outline/OutlinePanel';
import type { OutlineItem } from './features/outline/types';
import { PsykeWindow } from './features/psyke/PsykeWindow';
import { DEFAULT_BASE_URL } from './features/whiteboard/whiteboardApi';
import { WhiteboardPage } from './features/whiteboard/WhiteboardPage';
import { useTheme } from './theme';

function scrollToBlock(index: number) {
  const surface = document.querySelector('.wb-editor');
  const child = surface?.children[index] as HTMLElement | undefined;
  child?.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

function currentSelectionText(): string {
  return window.getSelection()?.toString().trim() ?? '';
}

function loadBool(key: string, def: boolean): boolean {
  try {
    const v = localStorage.getItem(key);
    if (v === '1') return true;
    if (v === '0') return false;
  } catch {
    /* ignore */
  }
  return def;
}
function saveBool(key: string, v: boolean) {
  try {
    localStorage.setItem(key, v ? '1' : '0');
  } catch {
    /* ignore */
  }
}

export function App() {
  const [theme, toggleTheme] = useTheme();
  const [status, setStatus] = useState<BackendStatus>({
    state: 'connecting',
    baseUrl: '',
    managed: false,
  });
  // Distraction-free UI preferences. Top-panel hidden + outline persist; Focus
  // Mode is deliberately session-only (always starts off on a fresh launch).
  const [outlineVisible, setOutlineVisible] = useState(() => loadBool('lf-outline', true));
  const [topPanelHidden, setTopPanelHidden] = useState(() => loadBool('lf-top-hidden', false));
  const [focusMode, setFocusMode] = useState(false);
  const [focusHint, setFocusHint] = useState(false);
  const [outlineItems, setOutlineItems] = useState<OutlineItem[]>([]);
  const [psykeOpen, setPsykeOpen] = useState(false);
  const [psykeQuery, setPsykeQuery] = useState('');

  useEffect(() => saveBool('lf-outline', outlineVisible), [outlineVisible]);
  useEffect(() => saveBool('lf-top-hidden', topPanelHidden), [topPanelHidden]);

  // Briefly show "press Esc to exit" when entering Focus Mode (no permanent UI).
  useEffect(() => {
    if (!focusMode) {
      setFocusHint(false);
      return;
    }
    setFocusHint(true);
    const t = setTimeout(() => setFocusHint(false), 2200);
    return () => clearTimeout(t);
  }, [focusMode]);

  const toggleOutline = useCallback(() => setOutlineVisible((v) => !v), []);
  const toggleTopPanel = useCallback(() => setTopPanelHidden((v) => !v), []);
  const toggleFocus = useCallback(
    () =>
      setFocusMode((f) => {
        if (!f) setPsykeOpen(false); // entering: drop floating chrome
        return !f;
      }),
    [],
  );
  const togglePsyke = useCallback(
    () =>
      setPsykeOpen((o) => {
        if (o) return false;
        setPsykeQuery(currentSelectionText());
        return true;
      }),
    [],
  );
  const openPsyke = useCallback(() => {
    setPsykeQuery(currentSelectionText());
    setPsykeOpen(true);
  }, []);

  // Hold the latest action handlers so the menu/keyboard listeners subscribe once.
  const actionsRef = useRef({ toggleOutline, toggleTopPanel, toggleFocus, toggleTheme, togglePsyke });
  actionsRef.current = { toggleOutline, toggleTopPanel, toggleFocus, toggleTheme, togglePsyke };
  const focusRef = useRef(focusMode);
  focusRef.current = focusMode;

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

  // Native View-menu actions (mouse clicks). The matching shortcuts are handled
  // in the keydown listener below (the menu items use registerAccelerator:false).
  useEffect(
    () =>
      onMenuView((action) => {
        const a = actionsRef.current;
        if (action === 'toggleTopPanel') a.toggleTopPanel();
        else if (action === 'toggleOutline') a.toggleOutline();
        else if (action === 'focusMode') a.toggleFocus();
        else if (action === 'toggleTheme') a.toggleTheme();
      }),
    [],
  );

  // Global view shortcuts. (File ops use native menu accelerators; Logos keeps
  // Ctrl/Cmd+K; Focus Mode uses Ctrl/Cmd+Shift+D because Shift+F is folding.)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (focusRef.current) {
          e.preventDefault();
          setFocusMode(false);
        }
        return;
      }
      const mod = e.metaKey || e.ctrlKey;
      if (!mod || !e.shiftKey || e.altKey) return;
      const a = actionsRef.current;
      if (e.code === 'KeyO') {
        e.preventDefault();
        a.toggleOutline();
      } else if (e.code === 'KeyP') {
        e.preventDefault();
        a.togglePsyke();
      } else if (e.code === 'KeyT') {
        e.preventDefault();
        a.toggleTopPanel();
      } else if (e.code === 'KeyD') {
        e.preventDefault();
        a.toggleFocus();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const baseUrl = status.baseUrl || DEFAULT_BASE_URL;
  const ready = status.state === 'connected';
  const appClass = `app${topPanelHidden ? ' is-top-hidden' : ''}${focusMode ? ' is-focus' : ''}`;

  return (
    <div className={appClass}>
      <header className="titlebar">
        <button
          type="button"
          className={`icon-toggle${outlineVisible ? ' is-active' : ''}`}
          onClick={toggleOutline}
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
            onClick={toggleFocus}
            title="Focus Mode (Ctrl/Cmd+Shift+D)"
            aria-label="Enter Focus Mode"
          >
            ◌
          </button>
          <button
            type="button"
            className="icon-toggle"
            onClick={toggleTopPanel}
            title="Hide top panel (Ctrl/Cmd+Shift+T)"
            aria-label="Hide top panel"
          >
            ▲
          </button>
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
      {focusHint && <div className="focus-hint">Focus Mode — press Esc to exit</div>}
    </div>
  );
}
