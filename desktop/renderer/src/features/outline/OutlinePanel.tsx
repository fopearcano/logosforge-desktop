/** The hideable Outline left-panel: a flat, indented list of headings. */

import type { OutlineItem } from './types';
import { useOutline } from './useOutline';

interface Props {
  baseUrl: string;
  ready: boolean;
  revision: number;
  onNavigate?: (item: OutlineItem, index: number) => void;
}

export function OutlinePanel({ baseUrl, ready, revision, onNavigate }: Props) {
  const { items, loading, error } = useOutline({ baseUrl, ready, revision });

  return (
    <aside className="outline-panel" aria-label="Outline">
      <div className="outline-header">Outline</div>
      <div className="outline-body">
        {items.length > 0 ? (
          <ul className="outline-list">
            {items.map((item, index) => (
              <li key={item.id}>
                <button
                  type="button"
                  className="outline-item"
                  style={{ paddingLeft: 8 + Math.max(0, item.level - 1) * 14 }}
                  onClick={() => onNavigate?.(item, index)}
                  title={item.title}
                >
                  {item.title}
                </button>
              </li>
            ))}
          </ul>
        ) : !ready ? (
          <p className="outline-hint">Waiting for backend…</p>
        ) : loading ? (
          <p className="outline-hint">Loading…</p>
        ) : error ? (
          <p className="outline-hint outline-error">{error}</p>
        ) : (
          <p className="outline-hint">No headings yet.</p>
        )}
      </div>
    </aside>
  );
}
