/** The hideable Outline left-panel — presentational; items derived upstream. */

import type { OutlineItem } from './types';

interface Props {
  items: OutlineItem[];
  onNavigate?: (item: OutlineItem) => void;
}

function indent(item: OutlineItem): number {
  if (item.kind === 'section') return 10 + Math.max(0, item.level - 1) * 14;
  return 24; // scenes / synopses / notes sit nested under sections
}

export function OutlinePanel({ items, onNavigate }: Props) {
  return (
    <aside className="outline-panel" aria-label="Outline">
      <div className="outline-header">Outline</div>
      <div className="outline-body">
        {items.length === 0 ? (
          <p className="outline-hint">No structure yet.</p>
        ) : (
          <ul className="outline-list">
            {items.map((item) => (
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
