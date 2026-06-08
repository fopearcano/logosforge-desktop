/** One outliner row: disclosure + subtle type label + inline-editable title,
 *  plus (when selected) quick actions and an optional details panel. */

import { useEffect, useRef, type KeyboardEvent } from 'react';

import { Popover } from '../../components/Popover';
import {
  OUTLINE_TYPES,
  TYPE_LABELS,
  type OutlineItemType,
  type VisibleRow,
} from './outlineModel';
import type { OutlineStore } from './useOutline';

const INDENT_STEP = 14;
const BASE_PAD = 8;

interface Props {
  row: VisibleRow;
  store: OutlineStore;
  onKeyDown: (e: KeyboardEvent<HTMLInputElement>, atStart: boolean, atEnd: boolean) => void;
  onDelete: (id: string) => void;
}

export function OutlineRow({ row, store, onKeyDown, onDelete }: Props) {
  const { node, depth, hasChildren } = row;
  const selected = store.selectedId === node.id;
  const detailsOpen = store.detailsOpenId === node.id;
  const inputRef = useRef<HTMLInputElement>(null);

  // When this row becomes selected, focus the title and place the caret at end.
  useEffect(() => {
    if (selected && inputRef.current) {
      const el = inputRef.current;
      el.focus();
      const len = el.value.length;
      el.setSelectionRange(len, len);
    }
  }, [selected]);

  const pad = BASE_PAD + depth * INDENT_STEP;

  return (
    <li className="outline-node">
      <div
        className={`outline-row${selected ? ' is-selected' : ''}`}
        style={{ paddingLeft: pad }}
      >
        {hasChildren ? (
          <button
            type="button"
            className="outline-disclosure"
            aria-label={node.collapsed ? 'Expand' : 'Collapse'}
            aria-expanded={!node.collapsed}
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => store.toggleCollapse(node.id)}
          >
            {node.collapsed ? '▸' : '▾'}
          </button>
        ) : (
          <span className="outline-disclosure outline-disclosure-leaf" aria-hidden>
            •
          </span>
        )}

        <span className="outline-type" title={TYPE_LABELS[node.type]}>
          {TYPE_LABELS[node.type]}
        </span>

        {selected ? (
          <input
            ref={inputRef}
            className="outline-title-input"
            value={node.title}
            placeholder="Untitled"
            spellCheck={false}
            onChange={(e) => store.rename(node.id, e.target.value)}
            onKeyDown={(e) => {
              const el = e.currentTarget;
              const atStart = el.selectionStart === 0 && el.selectionEnd === 0;
              const atEnd =
                el.selectionStart === el.value.length && el.selectionEnd === el.value.length;
              onKeyDown(e, atStart, atEnd);
            }}
          />
        ) : (
          <button
            type="button"
            className={`outline-title${node.title ? '' : ' is-untitled'}`}
            title={node.title || 'Untitled'}
            onClick={() => store.setSelectedId(node.id)}
          >
            {node.title || 'Untitled'}
          </button>
        )}

        {selected && (
          <span className="outline-row-actions">
            <button
              type="button"
              className="outline-act"
              title="Add child (Ctrl/Cmd+Enter)"
              aria-label="Add child"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => store.addChild(node.id)}
            >
              +
            </button>
            <Popover label="⋯" title="Item actions" align="right">
              {(close) => (
                <div className="wb-menu outline-menu">
                  <button
                    type="button"
                    className="wb-menu-item"
                    onClick={() => {
                      store.setDetailsOpenId(detailsOpen ? null : node.id);
                      close();
                    }}
                  >
                    {detailsOpen ? 'Hide details' : 'Details…'}
                  </button>
                  <button
                    type="button"
                    className="wb-menu-item"
                    onClick={() => {
                      store.indent(node.id);
                      close();
                    }}
                  >
                    Indent
                  </button>
                  <button
                    type="button"
                    className="wb-menu-item"
                    onClick={() => {
                      store.outdent(node.id);
                      close();
                    }}
                  >
                    Outdent
                  </button>
                  <button
                    type="button"
                    className="wb-menu-item"
                    onClick={() => {
                      store.moveUp(node.id);
                      close();
                    }}
                  >
                    Move up
                  </button>
                  <button
                    type="button"
                    className="wb-menu-item"
                    onClick={() => {
                      store.moveDown(node.id);
                      close();
                    }}
                  >
                    Move down
                  </button>
                  <button
                    type="button"
                    className="wb-menu-item is-danger"
                    onClick={() => {
                      onDelete(node.id);
                      close();
                    }}
                  >
                    Delete
                  </button>
                </div>
              )}
            </Popover>
          </span>
        )}
      </div>

      {detailsOpen && (
        <div className="outline-details" style={{ paddingLeft: pad + INDENT_STEP }}>
          <label className="outline-details-row">
            <span>Type</span>
            <select
              value={node.type}
              onChange={(e) => store.setType(node.id, e.target.value as OutlineItemType)}
            >
              {OUTLINE_TYPES.map((t) => (
                <option key={t} value={t}>
                  {TYPE_LABELS[t]}
                </option>
              ))}
            </select>
          </label>
          <textarea
            className="outline-notes"
            placeholder="Notes…"
            value={node.notes}
            rows={3}
            onChange={(e) => store.setNotes(node.id, e.target.value)}
          />
          <div className="outline-details-actions">
            <button
              type="button"
              className="outline-details-done"
              onClick={() => store.setDetailsOpenId(null)}
            >
              Done
            </button>
          </div>
        </div>
      )}
    </li>
  );
}
