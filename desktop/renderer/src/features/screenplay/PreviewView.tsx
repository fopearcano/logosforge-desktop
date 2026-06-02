/** Readable Screenplay Preview — renders the pure buildPreview() output.
 *  (File named PreviewView to avoid a case-only clash with screenplayPreview.ts.) */

import type { DocumentSettings } from '../whiteboard/documentSettings';
import type { WhiteboardBlock } from '../whiteboard/types';
import { toFountainBlocks } from './screenplayExport';
import { buildPreview, previewSegments } from './screenplayPreview';

function Inline({ text }: { text: string }) {
  const segs = previewSegments(text);
  if (segs.length === 0) return <>{' '}</>; // keep empty lines from collapsing
  return (
    <>
      {segs.map((s, i) => {
        if (s.cls === 'sp-bold') return <strong key={i}>{s.text}</strong>;
        if (s.cls === 'sp-italic') return <em key={i}>{s.text}</em>;
        if (s.cls === 'sp-bold-italic')
          return (
            <strong key={i}>
              <em>{s.text}</em>
            </strong>
          );
        if (s.cls === 'sp-underline') return <u key={i}>{s.text}</u>;
        return <span key={i}>{s.text}</span>;
      })}
    </>
  );
}

const cap = (k: string) => k.charAt(0).toUpperCase() + k.slice(1);
const META_SKIP = new Set(['title', 'credit', 'author', 'authors']);

interface Props {
  blocks: WhiteboardBlock[];
  settings: DocumentSettings;
}

export function PreviewView({ blocks, settings }: Props) {
  const preview = buildPreview(toFountainBlocks(blocks), settings);
  const fields = preview.titlePage;
  const keys = Object.keys(fields);
  const author = fields.author ?? fields.authors;

  return (
    <div className="wb-preview" role="document" aria-label="Screenplay preview">
      {keys.length > 0 && (
        <div className="sp-pv-titlepage">
          {fields.title && <div className="sp-pv-title">{fields.title}</div>}
          {fields.credit && <div className="sp-pv-credit">{fields.credit}</div>}
          {author && <div className="sp-pv-author">{author}</div>}
          {keys
            .filter((k) => !META_SKIP.has(k))
            .map((k) => (
              <div className="sp-pv-meta" key={k}>
                {cap(k)}: {fields[k]}
              </div>
            ))}
        </div>
      )}
      <div className="sp-pv-body">
        {preview.lines.length === 0 ? (
          <p className="sp-pv-empty">Nothing to preview yet.</p>
        ) : (
          preview.lines.map((l, i) => (
            <p key={i} className={`sp-${l.type}`}>
              <Inline text={l.text} />
            </p>
          ))
        )}
      </div>
    </div>
  );
}
