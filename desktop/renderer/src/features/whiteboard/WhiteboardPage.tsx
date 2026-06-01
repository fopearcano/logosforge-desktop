/** Composes the whiteboard: writing-mode selector + load/save + editor + Logos. */

import type { Editor } from '@tiptap/react';
import { useState } from 'react';

import { LogosFloatingBox } from '../logos/LogosFloatingBox';
import { useWritingModes } from '../writingModes/useWritingModes';
import { WritingModeSelector } from '../writingModes/WritingModeSelector';
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
  const { doc, loading, loadError, saveStatus, onChangeBlocks, setMode } = useWhiteboardDocument({
    baseUrl,
    ready,
    onSaved,
  });
  const { modes, defaultMode } = useWritingModes({ baseUrl, ready });
  const [editor, setEditor] = useState<Editor | null>(null);

  return (
    <main className="whiteboard">
      <div className="wb-statusline">
        <WritingModeSelector
          modes={modes}
          value={doc?.mode ?? defaultMode}
          onChange={setMode}
          disabled={!doc}
        />
        <span className={`wb-save wb-save-${saveStatus}`}>{SAVE_LABEL[saveStatus]}</span>
      </div>
      <div className="wb-surface">
        {doc ? (
          <WhiteboardEditor
            key={doc.id}
            initialBlocks={doc.blocks}
            mode={doc.mode}
            onChangeBlocks={onChangeBlocks}
            onEditorReady={setEditor}
          />
        ) : !ready ? (
          <p className="wb-hint">Waiting for backend…</p>
        ) : loading ? (
          <p className="wb-hint">Loading…</p>
        ) : loadError ? (
          <p className="wb-hint wb-error">Couldn’t load document: {loadError}</p>
        ) : null}
      </div>
      {editor && doc && <LogosFloatingBox editor={editor} mode={doc.mode} baseUrl={baseUrl} />}
    </main>
  );
}
