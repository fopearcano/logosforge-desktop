/**
 * Frontend API client for the manual story outliner.
 *
 *   - GET /api/outline/items  → load the persisted node list
 *   - PUT /api/outline/items  → replace the persisted node list
 *
 * The backend stores the node shape opaquely (the frontend owns it), so we
 * normalize loaded rows defensively to tolerate partial/legacy data.
 */

import { OUTLINE_TYPES, type OutlineItemType, type OutlineNode } from './outlineModel';

const DEFAULT_BASE_URL = 'http://127.0.0.1:8777';

interface OutlineItemsResponse {
  items?: unknown;
}

const asString = (v: unknown, fallback = ''): string => (typeof v === 'string' ? v : fallback);

function normalize(raw: unknown): OutlineNode | null {
  if (!raw || typeof raw !== 'object') return null;
  const r = raw as Record<string, unknown>;
  if (typeof r.id !== 'string' || !r.id) return null;
  const type = typeof r.type === 'string' && (OUTLINE_TYPES as string[]).includes(r.type)
    ? (r.type as OutlineItemType)
    : 'custom';
  const now = new Date().toISOString();
  return {
    id: r.id,
    parentId: typeof r.parentId === 'string' ? r.parentId : null,
    type,
    title: asString(r.title),
    notes: asString(r.notes),
    order: typeof r.order === 'number' ? r.order : 0,
    collapsed: r.collapsed === true,
    linkedLineId: typeof r.linkedLineId === 'string' ? r.linkedLineId : null,
    createdAt: asString(r.createdAt, now),
    updatedAt: asString(r.updatedAt, now),
  };
}

function toNodes(data: OutlineItemsResponse): OutlineNode[] {
  const list = Array.isArray(data.items) ? data.items : [];
  return list.map(normalize).filter((n): n is OutlineNode => n !== null);
}

export async function getOutlineItems(
  baseUrl: string = DEFAULT_BASE_URL,
  signal?: AbortSignal,
): Promise<OutlineNode[]> {
  const res = await fetch(`${baseUrl}/api/outline/items`, { signal });
  if (!res.ok) throw new Error(`Request failed (HTTP ${res.status})`);
  return toNodes((await res.json()) as OutlineItemsResponse);
}

export async function saveOutlineItems(
  baseUrl: string = DEFAULT_BASE_URL,
  items: OutlineNode[],
  signal?: AbortSignal,
): Promise<OutlineNode[]> {
  const res = await fetch(`${baseUrl}/api/outline/items`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ items }),
    signal,
  });
  if (!res.ok) throw new Error(`Save failed (HTTP ${res.status})`);
  return toNodes((await res.json()) as OutlineItemsResponse);
}
