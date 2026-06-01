/**
 * Loads the document outline from GET /api/outline once the backend is ready,
 * and re-fetches whenever `revision` changes (e.g. after the document saves).
 */

import { useEffect, useState } from 'react';

import { getOutline } from './outlineApi';
import type { OutlineItem } from './types';

interface Options {
  baseUrl: string;
  ready: boolean;
  /** Bump to trigger a refresh (the outline is derived from the document). */
  revision: number;
}

interface Result {
  items: OutlineItem[];
  loading: boolean;
  error: string | null;
}

export function useOutline({ baseUrl, ready, revision }: Options): Result {
  const [items, setItems] = useState<OutlineItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!ready) return;
    let active = true;
    const controller = new AbortController();
    setLoading(true);
    setError(null);
    getOutline(baseUrl, controller.signal)
      .then((res) => {
        if (!active) return;
        setItems(res.items);
        setLoading(false);
      })
      .catch((err: unknown) => {
        if (!active || controller.signal.aborted) return;
        setError(err instanceof Error ? err.message : String(err));
        setLoading(false);
      });
    return () => {
      active = false;
      controller.abort();
    };
  }, [baseUrl, ready, revision]);

  return { items, loading, error };
}
