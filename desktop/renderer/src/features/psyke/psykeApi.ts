/** Frontend API client for the PSYKE search endpoint. */

import type { PsykeSearchResponse } from './types';

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
