/** Composes the whiteboard: writing-mode selector + load/save + editor + Logos. */

import type { Editor } from '@tiptap/react';
import { useCallback, useEffect, useRef, useState, type CSSProperties } from 'react';

import { deriveOutline } from '../outline/deriveOutline';
import type { OutlineItem } from '../outline/types';
import { LogosFloatingBox } from '../logos/LogosFloatingBox';
import { useWritingModes } from '../writingModes/useWritingModes';
import { WritingModeSelector } from '../writingModes/WritingModeSelector';
import type { FountainType } from './fountain';
import { screenplayLabel } from './fountain';
import { modeBehavior } from './modes';
import type { SaveStatus, WhiteboardBlock } from './types';
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
  onOutlineChange?: (items: OutlineItem[]) => void;
}

export function WhiteboardPage({ baseUrl, ready, onOutlineChange }: Props) {
  const { doc, loading, loadError, saveStatus, onChangeBlocks, setMode } = useWhiteboardDocument({
    baseUrl,
    ready,
  });
  const { modes, defaultMode } = useWritingModes({ baseUrl, ready });
  const [editor, setEditor] = useState<Editor | null>(null);
  const [element, setElement] = useState<FountainType | null>(null);

  const onOutlineRef = useRef(onOutlineChange);
  onOutlineRef.current = onOutlineChange;

  const mode = doc?.mode ?? defaultMode;
  const isScreenplay = mode === 'screenplay';

  // Autosave + recompute the (client-derived) outline on every edit.
  const handleBlocks = useCallback(
    (blocks: WhiteboardBlock[]) => {
      onChangeBlocks(blocks);
      onOutlineRef.current?.(deriveOutline(blocks, doc?.mode ?? 'novel'));
    },
    [onChangeBlocks, doc?.mode],
  );

  // Re-derive the outline whenever the document (or its mode) loads/changes.
  useEffect(() => {
    if (doc) onOutlineRef.current?.(deriveOutline(doc.blocks, doc.mode));
  }, [doc]);

  return (
    <main className="whiteboard">
      <div className="wb-statusline">
        <div className="wb-statusline-left">
          <WritingModeSelector
            modes={modes}
            value={mode}
            onChange={setMode}
            disabled={!doc}
          />
          {isScreenplay && (
            <span className="sp-element" title="Inferred screenplay element">
              {screenplayLabel(element)}
            </span>
          )}
        </div>
        <span className={`wb-save wb-save-${saveStatus}`}>{SAVE_LABEL[saveStatus]}</span>
      </div>
      <div
        className="wb-surface"
        style={{ '--measure': modeBehavior(mode).measure } as CSSProperties}
        onMouseDown={(e) => {
          // Click anywhere on the (full-panel) sheet to start writing.
          if (e.target === e.currentTarget) {
            e.preventDefault();
            editor?.chain().focus('end').run();
          }
        }}
      >
        {doc ? (
          <WhiteboardEditor
            key={doc.id}
            initialBlocks={doc.blocks}
            mode={doc.mode}
            onChangeBlocks={handleBlocks}
            onEditorReady={setEditor}
            onElementChange={setElement}
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
