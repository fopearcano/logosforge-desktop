/**
 * Manual story-outliner model tests. Pure — no React/DOM/backend. Runs
 * headlessly (esbuild + node): `npm run test:outline`. Throws on failure.
 */

import {
  childrenOf,
  childType,
  createNode,
  descendantIds,
  firstChildId,
  getNode,
  hasChildren,
  indentItem,
  insertChild,
  insertRoot,
  insertSibling,
  moveDown,
  moveUp,
  nextVisibleId,
  outdentItem,
  prevVisibleId,
  removeItem,
  rename,
  rootType,
  setAllCollapsed,
  setCollapsed,
  setNodeType,
  setNotes,
  toggleCollapsed,
  visibleRows,
  type OutlineItemType,
  type OutlineNode,
} from './outlineModel';

let passed = 0;
const failures: string[] = [];
function check(label: string, cond: boolean) {
  if (cond) passed += 1;
  else failures.push(label);
}

const NOW = '2026-01-01T00:00:00.000Z';
let idc = 0;
const mk = (type: OutlineItemType): OutlineNode => createNode(`id${++idc}`, type, null, NOW);
const ids = (nodes: OutlineNode[]) => nodes.map((n) => n.id).join(',');

// 1. Mode-aware defaults (Part 8)
check('rootType screenplay', rootType('screenplay') === 'act');
check('rootType novel', rootType('novel') === 'chapter');
check('rootType series', rootType('series') === 'part');
check('rootType scene', rootType('scene') === 'scene');
check('rootType notes', rootType('notes') === 'note');
check('rootType default', rootType('graphic_novel') === 'chapter');
check('childType screenplay act→sequence', childType('screenplay', 'act') === 'sequence');
check('childType screenplay sequence→scene', childType('screenplay', 'sequence') === 'scene');
check('childType screenplay scene→beat', childType('screenplay', 'scene') === 'beat');
check('childType novel part→chapter', childType('novel', 'part') === 'chapter');
check('childType novel chapter→scene', childType('novel', 'chapter') === 'scene');
check('childType scene scene→beat', childType('scene', 'scene') === 'beat');
check('childType notes fallback', childType('notes', 'note') === 'note');

// 2. createNode defaults
{
  const c = createNode('x', 'scene', null, NOW);
  check(
    'createNode defaults',
    c.title === '' &&
      c.notes === '' &&
      c.order === 0 &&
      c.collapsed === false &&
      c.parentId === null &&
      c.linkedLineId === null &&
      c.createdAt === NOW &&
      c.updatedAt === NOW,
  );
}

// 3. insertRoot appends + reindexes
{
  let items: OutlineNode[] = [];
  const r1 = mk('chapter');
  const r2 = mk('chapter');
  items = insertRoot(items, r1);
  items = insertRoot(items, r2);
  const roots = childrenOf(items, null);
  check(
    'insertRoot append + order',
    roots.length === 2 && roots[0].id === r1.id && roots[0].order === 0 && roots[1].order === 1,
  );
}

// 4. insertChild nests + expands a collapsed parent
{
  let items: OutlineNode[] = [];
  const p = mk('act');
  items = insertRoot(items, p);
  items = setCollapsed(items, p.id, true);
  const c = mk('scene');
  items = insertChild(items, p.id, c);
  check('insertChild nests', getNode(items, c.id)?.parentId === p.id);
  check('insertChild expands parent', getNode(items, p.id)?.collapsed === false);
}

// 5. insertSibling places directly after the anchor
{
  let items: OutlineNode[] = [];
  const p = mk('act');
  items = insertRoot(items, p);
  const c1 = mk('scene');
  const c2 = mk('scene');
  items = insertChild(items, p.id, c1);
  items = insertChild(items, p.id, c2);
  const s = mk('scene');
  items = insertSibling(items, c1.id, s);
  check('insertSibling order', ids(childrenOf(items, p.id)) === ids([c1, s, c2]));
}

// 6. rename / setNodeType / setNotes (and updatedAt)
{
  let items = insertRoot([], mk('scene'));
  const id = items[0].id;
  items = rename(items, id, 'Hello', '2026-02-02T00:00:00.000Z');
  check('rename', getNode(items, id)?.title === 'Hello');
  check('rename bumps updatedAt', getNode(items, id)?.updatedAt === '2026-02-02T00:00:00.000Z');
  items = setNodeType(items, id, 'beat', NOW);
  check('setNodeType', getNode(items, id)?.type === 'beat');
  items = setNotes(items, id, 'note text', NOW);
  check('setNotes', getNode(items, id)?.notes === 'note text');
}

// 7. collapse toggles + collapse/expand all (parents only)
{
  let items: OutlineNode[] = [];
  const p = mk('act');
  const c = mk('scene');
  items = insertRoot(items, p);
  items = insertChild(items, p.id, c);
  items = toggleCollapsed(items, p.id);
  check('toggleCollapsed on', getNode(items, p.id)?.collapsed === true);
  items = toggleCollapsed(items, p.id);
  check('toggleCollapsed off', getNode(items, p.id)?.collapsed === false);
  items = setAllCollapsed(items, true);
  check(
    'collapse all sets parents only',
    getNode(items, p.id)?.collapsed === true && getNode(items, c.id)?.collapsed === false,
  );
  items = setAllCollapsed(items, false);
  check('expand all', getNode(items, p.id)?.collapsed === false);
}

// 8. queries: descendantIds / hasChildren
{
  let items: OutlineNode[] = [];
  const p = mk('act');
  const c1 = mk('sequence');
  const g = mk('scene');
  items = insertRoot(items, p);
  items = insertChild(items, p.id, c1);
  items = insertChild(items, c1.id, g);
  check('descendantIds', descendantIds(items, p.id).sort().join(',') === [c1.id, g.id].sort().join(','));
  check('hasChildren true', hasChildren(items, p.id) === true);
  check('hasChildren false', hasChildren(items, g.id) === false);
}

// 9. removeItem deletes the whole subtree + reindexes siblings
{
  let items: OutlineNode[] = [];
  const p = mk('act');
  const c1 = mk('sequence');
  const c2 = mk('sequence');
  const g = mk('scene');
  items = insertRoot(items, p);
  items = insertChild(items, p.id, c1);
  items = insertChild(items, p.id, c2);
  items = insertChild(items, c1.id, g);
  items = removeItem(items, c1.id);
  check('remove subtree', getNode(items, c1.id) === undefined && getNode(items, g.id) === undefined);
  const kids = childrenOf(items, p.id);
  check('remove reindexes', kids.length === 1 && kids[0].id === c2.id && kids[0].order === 0);
}

// 10. indent nests under the previous sibling; no-op for a first child
{
  let items: OutlineNode[] = [];
  const p = mk('act');
  const c1 = mk('sequence');
  const c2 = mk('sequence');
  items = insertRoot(items, p);
  items = insertChild(items, p.id, c1);
  items = insertChild(items, p.id, c2);
  items = indentItem(items, c2.id);
  check('indent nests under prev sibling', getNode(items, c2.id)?.parentId === c1.id);
  check('indent removes from old parent', childrenOf(items, p.id).length === 1);

  let solo: OutlineNode[] = [];
  const sp = mk('act');
  const sc = mk('scene');
  solo = insertRoot(solo, sp);
  solo = insertChild(solo, sp.id, sc);
  const before = JSON.stringify(solo);
  solo = indentItem(solo, sc.id);
  check('indent no-op for first child', JSON.stringify(solo) === before);
}

// 11. outdent reparents to the grandparent, ordered just after the old parent
{
  let items: OutlineNode[] = [];
  const p = mk('act');
  const c1 = mk('sequence');
  const g = mk('scene');
  items = insertRoot(items, p);
  items = insertChild(items, p.id, c1);
  items = insertChild(items, c1.id, g);
  items = outdentItem(items, g.id);
  check('outdent reparents to grandparent', getNode(items, g.id)?.parentId === p.id);
  check('outdent order after old parent', ids(childrenOf(items, p.id)) === ids([c1, g]));

  let root = insertRoot([], mk('act'));
  const before = JSON.stringify(root);
  root = outdentItem(root, root[0].id);
  check('outdent no-op at root', JSON.stringify(root) === before);
}

// 12. moveUp / moveDown + bounds
{
  let items: OutlineNode[] = [];
  const p = mk('act');
  const c1 = mk('scene');
  const c2 = mk('scene');
  const c3 = mk('scene');
  items = insertRoot(items, p);
  items = insertChild(items, p.id, c1);
  items = insertChild(items, p.id, c2);
  items = insertChild(items, p.id, c3);
  items = moveDown(items, c1.id);
  check('moveDown swaps', ids(childrenOf(items, p.id)) === ids([c2, c1, c3]));
  items = moveUp(items, c1.id);
  check('moveUp swaps back', ids(childrenOf(items, p.id)) === ids([c1, c2, c3]));
  const beforeTop = JSON.stringify(items);
  items = moveUp(items, c1.id);
  check('moveUp bound at top', JSON.stringify(items) === beforeTop);
  const beforeBot = JSON.stringify(items);
  items = moveDown(items, c3.id);
  check('moveDown bound at bottom', JSON.stringify(items) === beforeBot);
}

// 13. visibleRows (depth + hasChildren + collapse skipping) and navigation
{
  let items: OutlineNode[] = [];
  const p = mk('act');
  const c1 = mk('sequence');
  const g = mk('scene');
  const c2 = mk('sequence');
  items = insertRoot(items, p);
  items = insertChild(items, p.id, c1);
  items = insertChild(items, c1.id, g);
  items = insertChild(items, p.id, c2);
  let rows = visibleRows(items);
  check('visibleRows count', rows.length === 4);
  check('visibleRows depth', rows[0].depth === 0 && rows[1].depth === 1 && rows[2].depth === 2);
  check('visibleRows hasChildren', rows[0].hasChildren === true && rows[2].hasChildren === false);
  check('firstChildId', firstChildId(items, p.id) === c1.id);
  check('firstChildId none', firstChildId(items, g.id) === null);
  check('nextVisibleId', nextVisibleId(items, p.id) === c1.id);
  check('prevVisibleId', prevVisibleId(items, g.id) === c1.id);
  check('prevVisibleId none at top', prevVisibleId(items, p.id) === null);

  items = setCollapsed(items, c1.id, true);
  rows = visibleRows(items);
  check('collapsed hides descendants', ids(rows.map((r) => r.node)) === ids([p, c1, c2]));
  check('nextVisibleId skips collapsed subtree', nextVisibleId(items, c1.id) === c2.id);
}

// --- report ---
console.log(`Outline model tests: ${passed} passed, ${failures.length} failed`);
for (const f of failures) console.log('  FAIL: ' + f);
if (failures.length) throw new Error(`${failures.length} outline test(s) failed`);
console.log('OUTLINE TESTS: PASS');
