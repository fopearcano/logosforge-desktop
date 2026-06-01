/**
 * Manages a single inline Logos request lifecycle (request/response today,
 * streaming-ready). Renders `output` reactively so a future streaming transport
 * can update it incrementally without UI changes.
 */

import { useCallback, useRef, useState } from 'react';

import { runLogosInline } from './logosApi';
import type { LogosRequest, LogosStatus } from './types';

interface Options {
  baseUrl: string;
}

interface Result {
  status: LogosStatus;
  output: string;
  note: string | null;
  provider: string | null;
  error: string | null;
  run: (req: LogosRequest) => Promise<void>;
  reset: () => void;
}

export function useLogosInline({ baseUrl }: Options): Result {
  const [status, setStatus] = useState<LogosStatus>('idle');
  const [output, setOutput] = useState('');
  const [note, setNote] = useState<string | null>(null);
  const [provider, setProvider] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const controllerRef = useRef<AbortController | null>(null);

  const reset = useCallback(() => {
    controllerRef.current?.abort();
    controllerRef.current = null;
    setStatus('idle');
    setOutput('');
    setNote(null);
    setProvider(null);
    setError(null);
  }, []);

  const run = useCallback(
    async (req: LogosRequest) => {
      controllerRef.current?.abort();
      const controller = new AbortController();
      controllerRef.current = controller;
      setStatus('loading');
      setOutput('');
      setError(null);
      setNote(null);
      try {
        const res = await runLogosInline(baseUrl, req, controller.signal);
        if (controller.signal.aborted) return;
        setOutput(res.output);
        setNote(res.note ?? null);
        setProvider(res.provider);
        setStatus('done');
      } catch (err: unknown) {
        if (controller.signal.aborted) return;
        setError(err instanceof Error ? err.message : String(err));
        setStatus('error');
      }
    },
    [baseUrl],
  );

  return { status, output, note, provider, error, run, reset };
}
