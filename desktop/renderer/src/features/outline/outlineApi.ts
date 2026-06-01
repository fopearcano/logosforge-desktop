/** Frontend API client for the outline endpoint. */

import type { OutlineResponse } from './types';

const DEFAULT_BASE_URL = 'http://127.0.0.1:8777';

export async function getOutline(
  baseUrl: string = DEFAULT_BASE_URL,
  signal?: AbortSignal,
): Promise<OutlineResponse> {
  const res = await fetch(`${baseUrl}/api/outline`, { signal });
  if (!res.ok) throw new Error(`Request failed (HTTP ${res.status})`);
  return (await res.json()) as OutlineResponse;
}
