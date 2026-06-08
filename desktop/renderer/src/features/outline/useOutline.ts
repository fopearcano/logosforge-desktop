/**
 * Manual story-outliner store hook.
 *
 * Loads the persisted node list once the backend is ready, exposes editing
 * operations (wrapping the pure `outlineModel` mutations), and autosaves edits
 * back to the backend with a debounce. Selection + which row's details panel is
 * open are tracked here too. New nodes are created with a real id + timestamps
 * and become the selection (so the row autofocuses for inline rename).
 *
 * Mode-aware defaults (Part 8) are read from a live ref so the *current* writing
 * mode decides the type of a freshly added root/child.
 */

import { useCallback, useEffect, useRef, useState } from 'react';

import { getOutlineItems, onOutlineRefresh, saveOutlineItems } from './outlineApi';
import * as M from './outlineModel';
import type { OutlineItemType, OutlineNode } from './outlineModel';

const SAVE_DEBOUNCE_MS = 600;

type SaveState = 'idle' | 'saving' | 'saved' | 'error';

function newId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `o-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

const now = (): string => new Date().toISOString();

export interface OutlineStore {
  items: OutlineNode[];
  loading: boolean;
  error: string | null;
  saveState: SaveState;
  selectedId: string | null;
  setSelectedId: (id: string | null) => void;
  detailsOpenId: string | null;
  setDetailsOpenId: (id: string | null) => void;
  // mutations
  addRoot: () => void;
  addChild: (parentId: string) => void;
  addSibling: (afterId: string) => void;
  rename: (id: string, title: string) => void;
  setType: (id: string, type: OutlineItemType) => void;
  setNotes: (id: string, notes: string) => void;
  remove: (id: string) => void;
  indent: (id: string) => void;
  outdent: (id: string) => void;
  moveUp: (id: string) => void;
  moveDown: (id: string) => void;
  toggleCollapse: (id: string) => void;
  collapseAll: () => void;
  expandAll: () => void;
}

interface Options {
  baseUrl: string;
  ready: boolean;
  mode: string;
}

export function useOutline({ baseUrl, ready, mode }: Options): OutlineStore {
  const [items, setItems] = useState<OutlineNode[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saveState, setSaveState] = useState<SaveState>('idle');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detailsOpenId, setDetailsOpenId] = useState<string | null>(null);

  // Live refs so callbacks stay stable but always see current values.
  const itemsRef = useRef<OutlineNode[]>(items);
  const modeRef = useRef(mode);
  modeRef.current = mode;
  const baseUrlRef = useRef(baseUrl);
  baseUrlRef.current = baseUrl;

  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pending = useRef<OutlineNode[] | null>(null);

  const flush = useCallback(async () => {
    const next = pending.current;
    if (!next) return;
    pending.current = null;
    setSaveState('saving');
    try {
      await saveOutlineItems(baseUrlRef.current, next);
      setSaveState('saved');
    } catch {
      setSaveState('error');
    }
  }, []);

  const scheduleSave = useCallback(
    (next: OutlineNode[]) => {
      pending.current = next;
      setSaveState('saving');
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => void flush(), SAVE_DEBOUNCE_MS);
    },
    [flush],
  );

  // Apply a pure model mutation, update state + ref, and queue a save.
  const mutate = useCallback(
    (fn: (items: OutlineNode[]) => OutlineNode[]): OutlineNode[] => {
      const next = fn(itemsRef.current);
      itemsRef.current = next;
      setItems(next);
      scheduleSave(next);
      return next;
    },
    [scheduleSave],
  );

  // Load once the backend is reachable.
  useEffect(() => {
    if (!ready) return;
    const controller = new AbortController();
    setLoading(true);
    setError(null);
    getOutlineItems(baseUrl, controller.signal)
      .then((loaded) => {
        itemsRef.current = loaded;
        setItems(loaded);
        setLoading(false);
      })
      .catch((err: unknown) => {
        if (controller.signal.aborted) return;
        setError(err instanceof Error ? err.message : String(err));
        setLoading(false);
      });
    return () => controller.abort();
  }, [ready, baseUrl]);

  // Reload when the persisted list is rewritten out-of-band (e.g. a LogosForge
  // import). Keeps the panel in sync without a manual refresh.
  useEffect(() => {
    if (!ready) return undefined;
    return onOutlineRefresh(() => {
      getOutlineItems(baseUrl)
        .then((loaded) => {
          itemsRef.current = loaded;
          setItems(loaded);
        })
        .catch(() => {
          /* best-effort; the next mount reload will recover */
        });
    });
  }, [ready, baseUrl]);

  // Flush a pending save on unmount (e.g. when the Outline panel is hidden).
  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
      if (pending.current) void flush();
    },
    [flush],
  );

  const addRoot = useCallback(() => {
    const id = newId();
    const node = M.createNode(id, M.rootType(modeRef.current), null, now());
    mutate((list) => M.insertRoot(list, node));
    setSelectedId(id);
    setDetailsOpenId(null);
  }, [mutate]);

  const addChild = useCallback(
    (parentId: string) => {
      const parent = M.getNode(itemsRef.current, parentId);
      const type = parent
        ? M.childType(modeRef.current, parent.type)
        : M.rootType(modeRef.current);
      const id = newId();
      const node = M.createNode(id, type, parentId, now());
      mutate((list) => M.insertChild(list, parentId, node));
      setSelectedId(id);
      setDetailsOpenId(null);
    },
    [mutate],
  );

  const addSibling = useCallback(
    (afterId: string) => {
      const after = M.getNode(itemsRef.current, afterId);
      if (!after) {
        addRoot();
        return;
      }
      const id = newId();
      const node = M.createNode(id, after.type, after.parentId, now());
      mutate((list) => M.insertSibling(list, afterId, node));
      setSelectedId(id);
      setDetailsOpenId(null);
    },
    [mutate, addRoot],
  );

  const rename = useCallback(
    (id: string, title: string) => mutate((list) => M.rename(list, id, title, now())),
    [mutate],
  );
  const setType = useCallback(
    (id: string, type: OutlineItemType) => mutate((list) => M.setNodeType(list, id, type, now())),
    [mutate],
  );
  const setNotes = useCallback(
    (id: string, notes: string) => mutate((list) => M.setNotes(list, id, notes, now())),
    [mutate],
  );

  const remove = useCallback(
    (id: string) => {
      const fallback = M.prevVisibleId(itemsRef.current, id) ?? M.nextVisibleId(itemsRef.current, id);
      mutate((list) => M.removeItem(list, id));
      setSelectedId(fallback);
      setDetailsOpenId((open) => (open === id ? null : open));
    },
    [mutate],
  );

  const indent = useCallback((id: string) => mutate((list) => M.indentItem(list, id)), [mutate]);
  const outdent = useCallback((id: string) => mutate((list) => M.outdentItem(list, id)), [mutate]);
  const moveUp = useCallback((id: string) => mutate((list) => M.moveUp(list, id)), [mutate]);
  const moveDown = useCallback((id: string) => mutate((list) => M.moveDown(list, id)), [mutate]);
  const toggleCollapse = useCallback(
    (id: string) => mutate((list) => M.toggleCollapsed(list, id)),
    [mutate],
  );
  const collapseAll = useCallback(() => mutate((list) => M.setAllCollapsed(list, true)), [mutate]);
  const expandAll = useCallback(() => mutate((list) => M.setAllCollapsed(list, false)), [mutate]);

  return {
    items,
    loading,
    error,
    saveState,
    selectedId,
    setSelectedId,
    detailsOpenId,
    setDetailsOpenId,
    addRoot,
    addChild,
    addSibling,
    rename,
    setType,
    setNotes,
    remove,
    indent,
    outdent,
    moveUp,
    moveDown,
    toggleCollapse,
    collapseAll,
    expandAll,
  };
}
