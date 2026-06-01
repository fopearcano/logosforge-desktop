/**
 * Loads the whiteboard document once the backend is ready and autosaves edits
 * with a debounce. Exposes load/loading/error state and a save status.
 */

import { useCallback, useEffect, useRef, useState } from 'react';

import type { SaveStatus, WhiteboardBlock, WhiteboardDocument } from './types';
import { getWhiteboard, updateWhiteboard } from './whiteboardApi';

const SAVE_DEBOUNCE_MS = 700;

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

  // Load the document once the backend reports ready.
  useEffect(() => {
    if (!ready) return;
    let active = true;
    setLoading(true);
    setLoadError(null);
    getWhiteboard(baseUrl)
      .then((d) => {
        if (!active) return;
        setDoc(d);
        setLoading(false);
      })
      .catch((err: unknown) => {
        if (!active) return;
        setLoadError(err instanceof Error ? err.message : String(err));
        setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [baseUrl, ready]);

  const flush = useCallback(async () => {
    const blocks = pending.current;
    if (!blocks) return;
    pending.current = null;
    setSaveStatus('saving');
    try {
      const updated = await updateWhiteboard(baseUrl, { blocks });
      setDoc(updated);
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

  // Clear any pending debounce on unmount.
  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );

  return { doc, loading, loadError, saveStatus, onChangeBlocks };
}
