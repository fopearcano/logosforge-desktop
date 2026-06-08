/**
 * Manual story-outliner model (pure, testable).
 *
 * Items are a flat list, each carrying `parentId` + `order`; the tree is derived
 * for rendering. All mutations are pure (return a new, re-indexed list). No
 * editor/DOM/backend imports.
 */

export type OutlineItemType =
  | 'act'
  | 'part'
  | 'chapter'
  | 'sequence'
  | 'scene'
  | 'beat'
  | 'note'
  | 'custom';

export const OUTLINE_TYPES: OutlineItemType[] = [
  'act',
  'part',
  'chapter',
  'sequence',
  'scene',
  'beat',
  'note',
  'custom',
];

export const TYPE_LABELS: Record<OutlineItemType, string> = {
  act: 'Act',
  part: 'Part',
  chapter: 'Chapter',
  sequence: 'Sequence',
  scene: 'Scene',
  beat: 'Beat',
  note: 'Note',
  custom: 'Custom',
};

export interface OutlineNode {
  id: string;
  parentId: string | null;
  type: OutlineItemType;
  title: string;
  notes: string;
  order: number;
  collapsed: boolean;
  linkedLineId?: string | null;
  createdAt: string;
  updatedAt: string;
}

export function createNode(
  id: string,
  type: OutlineItemType,
  parentId: string | null,
  now: string,
): OutlineNode {
  return {
    id,
    parentId,
    type,
    title: '',
    notes: '',
    order: 0,
    collapsed: false,
    linkedLineId: null,
    createdAt: now,
    updatedAt: now,
  };
}

// --- mode-aware defaults (Part 8) ------------------------------------------

export function rootType(mode: string): OutlineItemType {
  switch (mode) {
    case 'screenplay':
      return 'act';
    case 'novel':
      return 'chapter';
    case 'series':
      return 'part';
    case 'scene':
      return 'scene';
    case 'notes':
      return 'note';
    default:
      return 'chapter';
  }
}

export function childType(mode: string, parentType: OutlineItemType): OutlineItemType {
  const chains: Record<string, Partial<Record<OutlineItemType, OutlineItemType>>> = {
    screenplay: { act: 'sequence', sequence: 'scene', scene: 'beat', beat: 'note' },
    novel: { part: 'chapter', chapter: 'scene', scene: 'beat', beat: 'note' },
    series: { part: 'chapter', chapter: 'scene', scene: 'beat', beat: 'note' },
    scene: { scene: 'beat', beat: 'note' },
  };
  const fallback = mode === 'notes' ? 'note' : mode === 'scene' ? 'beat' : 'note';
  return chains[mode]?.[parentType] ?? fallback;
}

// --- queries ----------------------------------------------------------------

export function childrenOf(items: OutlineNode[], parentId: string | null): OutlineNode[] {
  return items.filter((i) => i.parentId === parentId).sort((a, b) => a.order - b.order);
}

export function getNode(items: OutlineNode[], id: string): OutlineNode | undefined {
  return items.find((i) => i.id === id);
}

export function hasChildren(items: OutlineNode[], id: string): boolean {
  return items.some((i) => i.parentId === id);
}

export function descendantIds(items: OutlineNode[], id: string): string[] {
  const out: string[] = [];
  const stack = childrenOf(items, id).map((c) => c.id);
  while (stack.length) {
    const cur = stack.pop() as string;
    out.push(cur);
    for (const c of childrenOf(items, cur)) stack.push(c.id);
  }
  return out;
}

export interface VisibleRow {
  node: OutlineNode;
  depth: number;
  hasChildren: boolean;
}

/** Depth-first list of rows that are currently visible (collapsed subtrees skipped). */
export function visibleRows(items: OutlineNode[]): VisibleRow[] {
  const out: VisibleRow[] = [];
  const walk = (parentId: string | null, depth: number) => {
    for (const node of childrenOf(items, parentId)) {
      const kids = hasChildren(items, node.id);
      out.push({ node, depth, hasChildren: kids });
      if (kids && !node.collapsed) walk(node.id, depth + 1);
    }
  };
  walk(null, 0);
  return out;
}

export function prevVisibleId(items: OutlineNode[], id: string): string | null {
  const rows = visibleRows(items);
  const i = rows.findIndex((r) => r.node.id === id);
  return i > 0 ? rows[i - 1].node.id : null;
}
export function nextVisibleId(items: OutlineNode[], id: string): string | null {
  const rows = visibleRows(items);
  const i = rows.findIndex((r) => r.node.id === id);
  return i >= 0 && i < rows.length - 1 ? rows[i + 1].node.id : null;
}
export function firstChildId(items: OutlineNode[], id: string): string | null {
  const c = childrenOf(items, id);
  return c.length ? c[0].id : null;
}

// --- mutations (pure; re-index orders to 0..n per sibling group) -------------

function reindex(items: OutlineNode[]): OutlineNode[] {
  const byParent = new Map<string | null, OutlineNode[]>();
  for (const i of items) {
    const group = byParent.get(i.parentId);
    if (group) group.push(i);
    else byParent.set(i.parentId, [i]);
  }
  const result: OutlineNode[] = [];
  for (const group of byParent.values()) {
    group.sort((a, b) => a.order - b.order);
    group.forEach((n, idx) => result.push(n.order === idx ? n : { ...n, order: idx }));
  }
  return result;
}

const maxOrder = (items: OutlineNode[], parentId: string | null): number =>
  childrenOf(items, parentId).reduce((m, n) => Math.max(m, n.order), -1);

export function insertRoot(items: OutlineNode[], node: OutlineNode): OutlineNode[] {
  return reindex([...items, { ...node, parentId: null, order: maxOrder(items, null) + 1 }]);
}

export function insertChild(items: OutlineNode[], parentId: string, node: OutlineNode): OutlineNode[] {
  const expanded = items.map((i) => (i.id === parentId && i.collapsed ? { ...i, collapsed: false } : i));
  return reindex([...expanded, { ...node, parentId, order: maxOrder(items, parentId) + 1 }]);
}

export function insertSibling(items: OutlineNode[], afterId: string, node: OutlineNode): OutlineNode[] {
  const after = getNode(items, afterId);
  if (!after) return insertRoot(items, node);
  return reindex([...items, { ...node, parentId: after.parentId, order: after.order + 0.5 }]);
}

export function rename(items: OutlineNode[], id: string, title: string, now: string): OutlineNode[] {
  return items.map((i) => (i.id === id ? { ...i, title, updatedAt: now } : i));
}
export function setNodeType(items: OutlineNode[], id: string, type: OutlineItemType, now: string): OutlineNode[] {
  return items.map((i) => (i.id === id ? { ...i, type, updatedAt: now } : i));
}
export function setNotes(items: OutlineNode[], id: string, notes: string, now: string): OutlineNode[] {
  return items.map((i) => (i.id === id ? { ...i, notes, updatedAt: now } : i));
}

export function toggleCollapsed(items: OutlineNode[], id: string): OutlineNode[] {
  return items.map((i) => (i.id === id ? { ...i, collapsed: !i.collapsed } : i));
}
export function setCollapsed(items: OutlineNode[], id: string, collapsed: boolean): OutlineNode[] {
  return items.map((i) => (i.id === id ? { ...i, collapsed } : i));
}
export function setAllCollapsed(items: OutlineNode[], collapsed: boolean): OutlineNode[] {
  const parents = new Set(items.map((i) => i.parentId).filter((p): p is string => p !== null));
  return items.map((i) => (parents.has(i.id) ? { ...i, collapsed } : i));
}

export function removeItem(items: OutlineNode[], id: string): OutlineNode[] {
  const doomed = new Set([id, ...descendantIds(items, id)]);
  return reindex(items.filter((i) => !doomed.has(i.id)));
}

export function indentItem(items: OutlineNode[], id: string): OutlineNode[] {
  const node = getNode(items, id);
  if (!node) return items;
  const sibs = childrenOf(items, node.parentId);
  const idx = sibs.findIndex((s) => s.id === id);
  if (idx <= 0) return items; // no previous sibling to nest under
  const newParent = sibs[idx - 1];
  const order = maxOrder(items, newParent.id) + 1;
  return reindex(
    items.map((i) => {
      if (i.id === id) return { ...i, parentId: newParent.id, order };
      if (i.id === newParent.id && i.collapsed) return { ...i, collapsed: false };
      return i;
    }),
  );
}

export function outdentItem(items: OutlineNode[], id: string): OutlineNode[] {
  const node = getNode(items, id);
  if (!node || node.parentId === null) return items; // already top-level
  const parent = getNode(items, node.parentId);
  if (!parent) return items;
  return reindex(
    items.map((i) => (i.id === id ? { ...i, parentId: parent.parentId, order: parent.order + 0.5 } : i)),
  );
}

export function moveUp(items: OutlineNode[], id: string): OutlineNode[] {
  const node = getNode(items, id);
  if (!node) return items;
  const sibs = childrenOf(items, node.parentId);
  const idx = sibs.findIndex((s) => s.id === id);
  if (idx <= 0) return items;
  const prev = sibs[idx - 1];
  return reindex(
    items.map((i) => {
      if (i.id === id) return { ...i, order: prev.order };
      if (i.id === prev.id) return { ...i, order: node.order };
      return i;
    }),
  );
}

export function moveDown(items: OutlineNode[], id: string): OutlineNode[] {
  const node = getNode(items, id);
  if (!node) return items;
  const sibs = childrenOf(items, node.parentId);
  const idx = sibs.findIndex((s) => s.id === id);
  if (idx === -1 || idx >= sibs.length - 1) return items;
  const next = sibs[idx + 1];
  return reindex(
    items.map((i) => {
      if (i.id === id) return { ...i, order: next.order };
      if (i.id === next.id) return { ...i, order: node.order };
      return i;
    }),
  );
}
