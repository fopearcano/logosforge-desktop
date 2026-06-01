/** Composes the whiteboard: load/save state + the editor + save indicator. */

import type { SaveStatus } from './types';
import { useWhiteboardDocument } from './useWhiteboardDocument';
import { WhiteboardEditor } from './WhiteboardEditor';

const SAVE_LABEL: Record<SaveStatus, string> = {
  idle: '',
  saving: 'Saving…',
  saved: 'Saved',
  error: 'Save failed',
};

interface Props {
  baseUrl: string;
  ready: boolean;
  onSaved?: () => void;
}

export function WhiteboardPage({ baseUrl, ready, onSaved }: Props) {
  const { doc, loading, loadError, saveStatus, onChangeBlocks } = useWhiteboardDocument({
    baseUrl,
    ready,
    onSaved,
  });

  return (
    <main className="whiteboard">
      <div className="wb-statusline">
        <span className={`wb-save wb-save-${saveStatus}`}>{SAVE_LABEL[saveStatus]}</span>
      </div>
      <div className="wb-surface">
        {!ready ? (
          <p className="wb-hint">Waiting for backend…</p>
        ) : loading ? (
          <p className="wb-hint">Loading…</p>
        ) : loadError ? (
          <p className="wb-hint wb-error">Couldn’t load document: {loadError}</p>
        ) : doc ? (
          <WhiteboardEditor key={doc.id} initialBlocks={doc.blocks} onChangeBlocks={onChangeBlocks} />
        ) : null}
      </div>
    </main>
  );
}
