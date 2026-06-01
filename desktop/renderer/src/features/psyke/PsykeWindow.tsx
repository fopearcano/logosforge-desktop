/**
 * Lightweight PSYKE access: a simple floating panel with search -> result list
 * -> simple detail view. No graph, no Pro workspace, no dockable framework.
 */

import { useEffect, useState } from 'react';

import { PsykeSearch } from './PsykeSearch';
import type { PsykeEntry } from './types';
import { usePsykeSearch } from './usePsykeSearch';

interface Props {
  baseUrl: string;
  initialQuery: string;
  onClose: () => void;
}

export function PsykeWindow({ baseUrl, initialQuery, onClose }: Props) {
  const { query, setQuery, results, loading, error } = usePsykeSearch({ baseUrl, initialQuery });
  const [selected, setSelected] = useState<PsykeEntry | null>(null);

  // Esc closes the panel.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const trimmed = query.trim();

  return (
    <aside className="psyke-window" aria-label="PSYKE">
      <div className="psyke-header">
        <span className="psyke-title">PSYKE</span>
        <button
          type="button"
          className="psyke-close"
          onClick={onClose}
          title="Close (Esc)"
          aria-label="Close PSYKE"
        >
          ×
        </button>
      </div>
      <PsykeSearch
        query={query}
        onChange={(q) => {
          setQuery(q);
          setSelected(null);
        }}
      />
      <div className="psyke-body">
        {selected ? (
          <div className="psyke-detail">
            <button type="button" className="psyke-back" onClick={() => setSelected(null)}>
              ← Back to results
            </button>
            <h3 className="psyke-detail-name">{selected.name}</h3>
            <div className="psyke-detail-type">{selected.entry_type}</div>
            {selected.aliases.length > 0 && (
              <div className="psyke-detail-aliases">
                <span className="psyke-detail-label">Aliases</span>
                {selected.aliases.join(', ')}
              </div>
            )}
          </div>
        ) : !trimmed ? (
          <p className="psyke-hint">Type to search the story bible.</p>
        ) : loading ? (
          <p className="psyke-hint">Searching…</p>
        ) : error ? (
          <p className="psyke-hint psyke-error">{error}</p>
        ) : results.length === 0 ? (
          <p className="psyke-hint">No entries match “{trimmed}”.</p>
        ) : (
          <ul className="psyke-results">
            {results.map((entry) => (
              <li key={entry.id}>
                <button type="button" className="psyke-result" onClick={() => setSelected(entry)}>
                  <span className="psyke-result-name">{entry.name}</span>
                  <span className="psyke-badge">{entry.entry_type}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </aside>
  );
}
