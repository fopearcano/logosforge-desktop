/**
 * The manual story outliner — a Dynalist-style editable tree.
 *
 * Rendering is a flat list of currently-visible rows (collapsed subtrees are
 * skipped). The keyboard model is centralized here and only runs while a row's
 * title input is focused, so it never interferes with the editor's shortcuts:
 *
 *   Enter            new sibling below            Shift+Enter   edit details/notes
 *   Tab / Shift+Tab  indent / outdent             Ctrl/Cmd+Enter add child
 *   Arrow Up/Down    move selection               Ctrl/Cmd+Arrow Up/Down  move item
 *   Arrow Left       collapse, else select parent (only at caret start)
 *   Arrow Right      expand, else first child     (only at caret end)
 *   Backspace        delete when title empty (confirm if it has children)
 *   Escape           deselect (blur)
 */

import { type KeyboardEvent } from 'react';

import {
  firstChildId,
  hasChildren,
  nextVisibleId,
  prevVisibleId,
  visibleRows,
} from './outlineModel';
import { OutlineRow } from './OutlineRow';
import type { OutlineStore } from './useOutline';

interface Props {
  store: OutlineStore;
}

export function OutlineOutliner({ store }: Props) {
  const rows = visibleRows(store.items);

  const confirmDelete = (id: string) => {
    if (hasChildren(store.items, id) && !window.confirm('Delete this item and all its children?')) {
      return;
    }
    store.remove(id);
  };

  const handleKey = (
    e: KeyboardEvent<HTMLInputElement>,
    atStart: boolean,
    atEnd: boolean,
  ) => {
    const id = store.selectedId;
    if (!id) return;
    const node = store.items.find((n) => n.id === id);
    if (!node) return;
    const mod = e.metaKey || e.ctrlKey;

    if (e.key === 'Enter') {
      e.preventDefault();
      e.stopPropagation();
      if (e.shiftKey) store.setDetailsOpenId(store.detailsOpenId === id ? null : id);
      else if (mod) store.addChild(id);
      else store.addSibling(id);
      return;
    }
    if (e.key === 'Tab') {
      e.preventDefault();
      e.stopPropagation();
      if (e.shiftKey) store.outdent(id);
      else store.indent(id);
      return;
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      e.stopPropagation();
      if (mod) store.moveUp(id);
      else {
        const prev = prevVisibleId(store.items, id);
        if (prev) store.setSelectedId(prev);
      }
      return;
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      e.stopPropagation();
      if (mod) store.moveDown(id);
      else {
        const next = nextVisibleId(store.items, id);
        if (next) store.setSelectedId(next);
      }
      return;
    }
    if (e.key === 'ArrowLeft' && atStart) {
      e.preventDefault();
      e.stopPropagation();
      if (hasChildren(store.items, id) && !node.collapsed) store.toggleCollapse(id);
      else if (node.parentId) store.setSelectedId(node.parentId);
      return;
    }
    if (e.key === 'ArrowRight' && atEnd) {
      const kids = hasChildren(store.items, id);
      if (!kids) return;
      e.preventDefault();
      e.stopPropagation();
      if (node.collapsed) store.toggleCollapse(id);
      else {
        const first = firstChildId(store.items, id);
        if (first) store.setSelectedId(first);
      }
      return;
    }
    if ((e.key === 'Backspace' || e.key === 'Delete') && node.title.length === 0) {
      e.preventDefault();
      e.stopPropagation();
      confirmDelete(id);
      return;
    }
    if (e.key === 'Escape') {
      e.preventDefault();
      e.stopPropagation();
      store.setSelectedId(null);
      e.currentTarget.blur();
    }
  };

  if (rows.length === 0) {
    return (
      <p className="outline-hint">
        No outline yet. Use <strong>+ Add</strong> to start your story structure.
      </p>
    );
  }

  return (
    <ul className="outline-tree">
      {rows.map((row) => (
        <OutlineRow
          key={row.node.id}
          row={row}
          store={store}
          onKeyDown={handleKey}
          onDelete={confirmDelete}
        />
      ))}
    </ul>
  );
}
