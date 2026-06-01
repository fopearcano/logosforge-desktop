/** Frontend API client for the Logos inline endpoint. */

import type { LogosRequest, LogosResponse } from './types';

const DEFAULT_BASE_URL = 'http://127.0.0.1:8777';

export async function runLogosInline(
  baseUrl: string = DEFAULT_BASE_URL,
  req: LogosRequest,
  signal?: AbortSignal,
): Promise<LogosResponse> {
  const res = await fetch(`${baseUrl}/api/logos/inline`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(req),
    signal,
  });
  if (!res.ok) throw new Error(`Request failed (HTTP ${res.status})`);
  return (await res.json()) as LogosResponse;
}

// Streaming seam: the backend is not streaming yet. A future `streamLogosInline`
// would read a chunked/SSE response body and invoke an `onChunk` callback; the
// floating box already renders `output` reactively, so switching the transport
// will not require UI changes.
