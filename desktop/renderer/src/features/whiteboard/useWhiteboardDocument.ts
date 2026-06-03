/**
 * Provides a blank document on startup and autosaves edits to the backend with a
 * debounce. Exposes load/loading/error state and a save status.
 *
 * Task 5 — blank startup: the app deliberately does NOT auto-load the persisted
 * backend session on a normal launch. Autosave still writes the session to the
 * backend on the first edit (a recovery foundation), but startup is always a
 * blank, clean, Untitled document.
 */

import { useCallback, useEffect, useRef, useState } from 'react';

import type { SaveStatus, WhiteboardBlock, WhiteboardDocument } from './types';
import { updateWhiteboard } from './whiteboardApi';

const SAVE_DEBOUNCE_MS = 700;

function blankDocument(): WhiteboardDocument {
  return {
    id: 'session',
    title: 'Untitled',
    mode: 'novel',
    blocks: [{ id: 'b0', type: 'paragraph', text: '' }],
    updated_at: new Date().toISOString(),
  };
}

interface Options {
  baseUrl: string;
  ready: boolean;
  /** Called after each successful save (lets the outline refresh). */
  onSaved?: () => void;
}

interface Result {
  doc: WhiteboardDocument | null;
  loading: boolean;
  loadError: string | null;
  saveStatus: SaveStatus;
  onChangeBlocks: (blocks: WhiteboardBlock[]) => void;
  setMode: (mode: string) => void;
}

export function useWhiteboardDocument({ baseUrl, ready, onSaved }: Options): Result {
  const onSavedRef = useRef(onSaved);
  onSavedRef.current = onSaved;

  const [doc, setDoc] = useState<WhiteboardDocument | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');

  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pending = useRef<WhiteboardBlock[] | null>(null);

  // Start blank once the backend is ready — do NOT auto-load the old session.
  useEffect(() => {
    if (!ready) return;
    setLoadError(null);
    setLoading(false);
    setDoc((prev) => prev ?? blankDocument());
  }, [ready]);

  const flush = useCallback(async () => {
    const blocks = pending.current;
    if (!blocks) return;
    pending.current = null;
    setSaveStatus('saving');
    try {
      // Autosave the session to the backend, but keep our local blank-startup
      // doc id/blocks (the editor + liveBlocks are the source of truth — do NOT
      // replace `doc` with the server copy, which would remount/reset content).
      await updateWhiteboard(baseUrl, { blocks });
      setSaveStatus('saved');
      onSavedRef.current?.();
    } catch {
      setSaveStatus('error');
    }
  }, [baseUrl]);

  const onChangeBlocks = useCallback(
    (blocks: WhiteboardBlock[]) => {
      pending.current = blocks;
      setSaveStatus('saving');
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => {
        void flush();
      }, SAVE_DEBOUNCE_MS);
    },
    [flush],
  );

  // Change the writing mode locally (keep id + blocks) and persist just the mode.
  const setMode = useCallback(
    async (mode: string) => {
      setDoc((prev) => (prev ? { ...prev, mode } : prev));
      setSaveStatus('saving');
      try {
        await updateWhiteboard(baseUrl, { mode });
        setSaveStatus('saved');
        onSavedRef.current?.();
      } catch {
        setSaveStatus('error');
      }
    },
    [baseUrl],
  );

  // Clear any pending debounce on unmount.
  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );

  return { doc, loading, loadError, saveStatus, onChangeBlocks, setMode };
}
