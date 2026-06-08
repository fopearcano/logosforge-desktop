/** Frontend API client for the PSYKE endpoints (search + element creation). */

import type { PsykeCreatePayload, PsykeCreateResponse, PsykeSearchResponse } from './types';

const DEFAULT_BASE_URL = 'http://127.0.0.1:8777';

export async function searchPsyke(
  baseUrl: string = DEFAULT_BASE_URL,
  query: string,
  signal?: AbortSignal,
): Promise<PsykeSearchResponse> {
  const url = `${baseUrl}/api/psyke/search?q=${encodeURIComponent(query)}`;
  const res = await fetch(url, { signal });
  if (!res.ok) throw new Error(`Request failed (HTTP ${res.status})`);
  return (await res.json()) as PsykeSearchResponse;
}

export async function createPsykeElement(
  baseUrl: string = DEFAULT_BASE_URL,
  payload: PsykeCreatePayload,
  signal?: AbortSignal,
): Promise<PsykeCreateResponse> {
  const res = await fetch(`${baseUrl}/api/psyke/elements`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
    signal,
  });
  if (!res.ok) throw new Error(`Save failed (HTTP ${res.status})`);
  return (await res.json()) as PsykeCreateResponse;
}
