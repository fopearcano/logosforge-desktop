/** The hideable Outline left-panel — presentational; items derived upstream. */

import { useMemo, useState } from 'react';

import type { OutlineItem, OutlineKind } from './types';

interface Props {
  items: OutlineItem[];
  onNavigate?: (item: OutlineItem) => void;
}

const KIND_ORDER: OutlineKind[] = ['section', 'scene', 'synopsis', 'note'];
const KIND_LABELS: Record<OutlineKind, string> = {
  section: 'Sections',
  scene: 'Scenes',
  synopsis: 'Synopses',
  note: 'Notes',
};

function indent(item: OutlineItem): number {
  if (item.kind === 'section') return 10 + Math.max(0, item.level - 1) * 14;
  return 24; // scenes / synopses / notes sit nested under sections
}

export function OutlinePanel({ items, onNavigate }: Props) {
  // Which kinds are hidden (minimal show/hide filters, only shown when the
  // document actually contains more than one kind of structure).
  const [hidden, setHidden] = useState<Set<OutlineKind>>(() => new Set());

  const kinds = useMemo(() => {
    const present = new Set(items.map((i) => i.kind));
    return KIND_ORDER.filter((k) => present.has(k));
  }, [items]);

  const visible = items.filter((i) => !hidden.has(i.kind));

  const toggle = (k: OutlineKind) =>
    setHidden((prev) => {
      const next = new Set(prev);
      if (next.has(k)) next.delete(k);
      else next.add(k);
      return next;
    });

  return (
    <aside className="outline-panel" aria-label="Outline">
      <div className="outline-header">Outline</div>
      {kinds.length > 1 && (
        <div className="outline-filters" role="group" aria-label="Filter outline">
          {kinds.map((k) => (
            <button
              key={k}
              type="button"
              className={`outline-filter${hidden.has(k) ? '' : ' is-active'}`}
              aria-pressed={!hidden.has(k)}
              onClick={() => toggle(k)}
            >
              {KIND_LABELS[k]}
            </button>
          ))}
        </div>
      )}
      <div className="outline-body">
        {visible.length === 0 ? (
          <p className="outline-hint">{items.length === 0 ? 'No structure yet.' : 'All hidden.'}</p>
        ) : (
          <ul className="outline-list">
            {visible.map((item) => (
              <li key={item.id}>
                <button
                  type="button"
                  className={`outline-item outline-${item.kind}`}
                  style={{ paddingLeft: indent(item) }}
                  onClick={() => onNavigate?.(item)}
                  title={item.label}
                >
                  {item.label}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </aside>
  );
}
