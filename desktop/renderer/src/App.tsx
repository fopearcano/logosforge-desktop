import { useCallback, useEffect, useRef, useState } from 'react';

import { bridge, type BackendStatus } from './api/backend';
import { StatusBar } from './components/StatusBar';
import { onMenuView } from './features/files/fileApi';
import { OutlinePanel } from './features/outline/OutlinePanel';
import type { OutlineItem } from './features/outline/types';
import { PsykeWindow } from './features/psyke/PsykeWindow';
import { DEFAULT_BASE_URL } from './features/whiteboard/whiteboardApi';
import { WhiteboardPage } from './features/whiteboard/WhiteboardPage';
import { useUiVisibility } from './state/uiVisibilityStore';
import { PREDEFINED_THEMES } from './styles/themes/predefinedThemes';
import { ThemeSelector } from './styles/themes/ThemeSelector';
import { useTheme } from './styles/themes/useTheme';

function scrollToBlock(index: number) {
  const surface = document.querySelector('.wb-editor');
  const child = surface?.children[index] as HTMLElement | undefined;
  child?.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

function currentSelectionText(): string {
  return window.getSelection()?.toString().trim() ?? '';
}

export function App() {
  const ui = useUiVisibility();
  const { themeId, setThemeId } = useTheme();
  const [status, setStatus] = useState<BackendStatus>({
    state: 'connecting',
    baseUrl: '',
    managed: false,
  });
  const [focusHint, setFocusHint] = useState(false);
  const [outlineItems, setOutlineItems] = useState<OutlineItem[]>([]);
  // The writing mode is owned by the document (WhiteboardPage); lift it here so
  // the Outline panel can apply mode-aware defaults to the manual outliner.
  const [docMode, setDocMode] = useState('novel');
  const [psykeOpen, setPsykeOpen] = useState(false);
  const [psykeQuery, setPsykeQuery] = useState('');

  // Briefly show "press Esc to exit" when entering Focus Mode (no permanent UI).
  useEffect(() => {
    if (!ui.focusModeActive) {
      setFocusHint(false);
      return;
    }
    setFocusHint(true);
    const t = setTimeout(() => setFocusHint(false), 2200);
    return () => clearTimeout(t);
  }, [ui.focusModeActive]);

  const toggleFocus = useCallback(() => {
    if (ui.focusModeActive) {
      ui.exitFocusMode();
    } else {
      setPsykeOpen(false); // entering: drop floating chrome
      ui.enterFocusMode();
    }
  }, [ui]);

  const cycleTheme = useCallback(() => {
    const i = PREDEFINED_THEMES.findIndex((t) => t.id === themeId);
    setThemeId(PREDEFINED_THEMES[(i + 1) % PREDEFINED_THEMES.length].id);
  }, [themeId, setThemeId]);

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

  // Hold latest handlers so the menu/keyboard listeners subscribe once.
  const actionsRef = useRef({
    toggleOutline: ui.toggleOutline,
    toggleTopPanel: ui.toggleTopPanel,
    toggleFocus,
    cycleTheme,
    togglePsyke,
    handleEscape: ui.handleEscape,
  });
  actionsRef.current = {
    toggleOutline: ui.toggleOutline,
    toggleTopPanel: ui.toggleTopPanel,
    toggleFocus,
    cycleTheme,
    togglePsyke,
    handleEscape: ui.handleEscape,
  };
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

  // Native View-menu actions (mouse clicks). Matching shortcuts are handled below.
  useEffect(
    () =>
      onMenuView((action) => {
        const a = actionsRef.current;
        if (action === 'toggleTopPanel') a.toggleTopPanel();
        else if (action === 'toggleOutline') a.toggleOutline();
        else if (action === 'focusMode') a.toggleFocus();
        else if (action === 'toggleTheme') a.cycleTheme();
      }),
    [],
  );

  // Global view shortcuts + ESC restore. (Cmd/Ctrl+K stays Logos; never bound here.)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const a = actionsRef.current;
      if (e.key === 'Escape') {
        const ae = document.activeElement as HTMLElement | null;
        // Let a focused transient (popover/menu/PSYKE/LittleBoy/input) handle ESC
        // first. LittleBoy (Billy/Logos) closes via its own capture-phase handler.
        if (
          ae &&
          (ae.closest('.wb-popover') ||
            ae.closest('.psyke-window') ||
            ae.closest('.littleboy-box') ||
            /^(INPUT|SELECT|TEXTAREA)$/.test(ae.tagName))
        ) {
          return;
        }
        if (psykeOpenRef.current) {
          e.preventDefault();
          setPsykeOpen(false); // close the PSYKE window (a transient) first
          return;
        }
        if (a.handleEscape()) e.preventDefault(); // restore hidden panels / exit focus
        return;
      }
      const mod = e.metaKey || e.ctrlKey;
      if (!mod || !e.shiftKey || e.altKey) return;
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
  const appClass = `app${ui.topPanelVisible ? '' : ' is-top-hidden'}${ui.focusModeActive ? ' is-focus' : ''}`;

  return (
    <div className={appClass}>
      <header className="titlebar">
        <button
          type="button"
          className={`icon-toggle${ui.outlineVisible ? ' is-active' : ''}`}
          onClick={ui.toggleOutline}
          aria-pressed={ui.outlineVisible}
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
            title="Focus Mode (Ctrl/Cmd+Shift+D · Esc restores)"
            aria-label="Enter Focus Mode"
          >
            ◌
          </button>
          <button
            type="button"
            className="icon-toggle"
            onClick={ui.toggleTopPanel}
            title="Hide top panel (Ctrl/Cmd+Shift+T · Esc restores)"
            aria-label="Hide top panel"
          >
            ▲
          </button>
          <ThemeSelector />
          {ui.psykeButtonVisible && (
            <button
              type="button"
              className={`psyke-toggle${psykeOpen ? ' is-active' : ''}`}
              onClick={() => (psykeOpen ? setPsykeOpen(false) : openPsyke())}
              aria-pressed={psykeOpen}
              title="Toggle PSYKE (Ctrl/Cmd+Shift+P)"
            >
              PSYKE
            </button>
          )}
        </div>
      </header>
      <div className="workarea">
        {ui.outlineVisible && (
          <OutlinePanel
            derivedItems={outlineItems}
            onNavigate={(item) => scrollToBlock(item.blockIndex)}
            baseUrl={baseUrl}
            ready={ready}
            mode={docMode}
          />
        )}
        <WhiteboardPage
          baseUrl={baseUrl}
          ready={ready}
          onOutlineChange={setOutlineItems}
          onModeChange={setDocMode}
        />
      </div>
      {psykeOpen && (
        <PsykeWindow baseUrl={baseUrl} initialQuery={psykeQuery} onClose={() => setPsykeOpen(false)} />
      )}
      {ui.statusBarVisible && <StatusBar status={status} />}
      {focusHint && <div className="focus-hint">Focus Mode — press Esc to exit</div>}
    </div>
  );
}
