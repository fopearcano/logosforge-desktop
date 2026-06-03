/** Composes the whiteboard: writing-mode selector + load/save + editor + Logos,
 *  plus the Screenplay Preview / Settings / scale / export toolbar. */

import type { Editor } from '@tiptap/react';
import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';

import { deriveOutline } from '../outline/deriveOutline';
import type { OutlineItem } from '../outline/types';
import { EditorSettingsPopover } from '../editorTools/EditorSettingsPopover';
import { editorToolsAttrs, editorToolsVars } from '../editorTools/editorToolsSurface';
import { useFolding } from '../editorTools/folding/useFolding';
import { useEditorTools } from '../editorTools/useEditorTools';
import { useFileDocument } from '../files/useFileDocument';
import { LogosFloatingBox } from '../logos/LogosFloatingBox';
import { PreviewView } from '../screenplay/PreviewView';
import { toFountainBlocks } from '../screenplay/screenplayExport';
import type { FountainType } from '../screenplay/fountainTypes';
import { approxPageCount } from '../screenplay/screenplayPageCount';
import { screenplayLabel } from '../screenplay/screenplayClassifier';
import { useWritingModes } from '../writingModes/useWritingModes';
import { WritingModeSelector } from '../writingModes/WritingModeSelector';
import { surfaceDataAttrs } from './documentSettings';
import { modeBehavior } from './modes';
import { ScreenplayToolbar } from './ScreenplayToolbar';
import type { SaveStatus, WhiteboardBlock } from './types';
import { useDocumentSettings } from './useDocumentSettings';
import { useEditorScale } from './useEditorScale';
import { useWhiteboardDocument } from './useWhiteboardDocument';
import { blocksToDoc, WhiteboardEditor } from './WhiteboardEditor';

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
  const [preview, setPreview] = useState(false);
  const [liveBlocks, setLiveBlocks] = useState<WhiteboardBlock[]>([]);

  const settingsApi = useDocumentSettings();
  const { scale, apply: applyScale } = useEditorScale();

  // Optional Nerd Mode editor aids (all default off → clean by default).
  const editorToolsApi = useEditorTools();
  const editorTools = editorToolsApi.tools;
  const toggleTool = editorToolsApi.toggle;
  const resetTools = editorToolsApi.reset;
  const { folds, toggleFold, clearFolds } = useFolding();
  const resetEditorView = useCallback(() => {
    resetTools();
    clearFolds();
  }, [resetTools, clearFolds]);

  const onOutlineRef = useRef(onOutlineChange);
  onOutlineRef.current = onOutlineChange;
  const lastDocIdRef = useRef<string | null>(null);
  const previewRef = useRef(preview);
  previewRef.current = preview;

  const mode = doc?.mode ?? defaultMode;
  const isScreenplay = mode === 'screenplay';
  const showPreview = isScreenplay && preview;

  // Desktop file management (New/Open/Save/Save As) — backend autosave keeps the
  // session; these write user-chosen files. Loading a file replaces the editor
  // content (which re-autosaves), so the session copy stays in sync.
  const editorRef = useRef(editor);
  editorRef.current = editor;
  const liveBlocksRef = useRef(liveBlocks);
  liveBlocksRef.current = liveBlocks;
  const loadBlocks = useCallback((blocks: WhiteboardBlock[]) => {
    editorRef.current?.commands.setContent(blocksToDoc(blocks), true);
  }, []);
  const fileDoc = useFileDocument({ getBlocks: () => liveBlocksRef.current, loadBlocks, mode });
  const markFileDirty = fileDoc.markDirty;

  // Autosave + recompute the (client-derived) outline + live snapshot on edit.
  const handleBlocks = useCallback(
    (blocks: WhiteboardBlock[]) => {
      markFileDirty();
      setLiveBlocks(blocks);
      onChangeBlocks(blocks);
      onOutlineRef.current?.(deriveOutline(blocks, doc?.mode ?? 'novel'));
    },
    [onChangeBlocks, doc?.mode, markFileDirty],
  );

  // Reflect the current file + dirty state in the window/document title.
  useEffect(() => {
    document.title = `LogosForge Whiteboard — ${fileDoc.fileName}${fileDoc.dirty ? ' *' : ''}`;
  }, [fileDoc.fileName, fileDoc.dirty]);

  // Re-derive the outline whenever the document loads/changes; reset the live
  // snapshot only when a different document loads.
  useEffect(() => {
    if (!doc) return;
    onOutlineRef.current?.(deriveOutline(doc.blocks, doc.mode));
    if (doc.id !== lastDocIdRef.current) {
      lastDocIdRef.current = doc.id;
      setLiveBlocks(doc.blocks);
    }
  }, [doc]);

  // Leaving Screenplay mode exits Preview.
  useEffect(() => {
    if (!isScreenplay) setPreview(false);
  }, [isScreenplay]);

  // View scale (Ctrl/Cmd +/-/0), Preview toggle (Ctrl/Cmd+Shift+E), Esc exits.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const mod = e.metaKey || e.ctrlKey;
      if (mod && !e.altKey) {
        if (e.key === '=' || e.key === '+') {
          e.preventDefault();
          applyScale('bigger');
          return;
        }
        if (e.key === '-' || e.key === '_') {
          e.preventDefault();
          applyScale('smaller');
          return;
        }
        if (e.key === '0') {
          e.preventDefault();
          applyScale('actual');
          return;
        }
      }
      if (isScreenplay && mod && e.shiftKey && !e.altKey && (e.key === 'E' || e.key === 'e')) {
        e.preventDefault();
        setPreview((p) => !p);
        return;
      }
      // Nerd Mode toggles (work in every mode). Cmd/Ctrl+K stays free for Logos.
      if (mod && e.shiftKey && !e.altKey && (e.key === 'F' || e.key === 'f')) {
        e.preventDefault();
        toggleTool('folding');
        return;
      }
      if (mod && e.shiftKey && !e.altKey && (e.key === 'H' || e.key === 'h')) {
        e.preventDefault();
        toggleTool('syntax');
        return;
      }
      if (mod && !e.shiftKey && !e.altKey && (e.key === 'l' || e.key === 'L')) {
        e.preventDefault();
        toggleTool('lineNumbers');
        return;
      }
      if (e.key === 'Escape' && previewRef.current) {
        const ae = document.activeElement as HTMLElement | null;
        if (ae && (ae.closest('.wb-popover') || /^(INPUT|SELECT|TEXTAREA)$/.test(ae.tagName))) return;
        setPreview(false);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isScreenplay, applyScale, toggleTool]);

  const approxPages = useMemo(
    () => (isScreenplay ? approxPageCount(toFountainBlocks(liveBlocks)) : 0),
    [isScreenplay, liveBlocks],
  );

  const surfaceStyle = {
    '--measure': modeBehavior(mode).measure,
    '--wb-scale': String(scale),
    ...editorToolsVars(editorTools),
  } as CSSProperties;
  const surfaceAttrs = {
    ...(isScreenplay ? { 'data-screenplay': '', ...surfaceDataAttrs(settingsApi.settings) } : {}),
    ...editorToolsAttrs(editorTools),
  };

  return (
    <main className="whiteboard">
      <div className="wb-statusline">
        <div className="wb-statusline-left">
          <WritingModeSelector modes={modes} value={mode} onChange={setMode} disabled={!doc} />
          {isScreenplay && (
            <span className="sp-element" title="Inferred screenplay element">
              {screenplayLabel(element)}
            </span>
          )}
          <span className="wb-file" title={fileDoc.filePath ?? 'Not saved to a file yet'}>
            {fileDoc.fileName}
            {fileDoc.status === 'saving'
              ? ' · Saving…'
              : fileDoc.status === 'error'
                ? ' · Save failed'
                : fileDoc.dirty
                  ? ' *'
                  : ''}
          </span>
        </div>
        <div className="wb-statusline-right">
          <span className={`wb-save wb-save-${saveStatus}`}>{SAVE_LABEL[saveStatus]}</span>
          <EditorSettingsPopover api={editorToolsApi} onReset={resetEditorView} />
        </div>
      </div>

      {isScreenplay && (
        <ScreenplayToolbar
          editor={editor}
          blocks={liveBlocks}
          settingsApi={settingsApi}
          preview={preview}
          onTogglePreview={() => setPreview((p) => !p)}
          scale={scale}
          onScale={applyScale}
          approxPages={approxPages}
        />
      )}

      <div
        className={`wb-surface${showPreview ? ' is-preview' : ''}`}
        style={surfaceStyle}
        {...surfaceAttrs}
        onMouseDown={(e) => {
          // Click anywhere on the (full-panel) sheet to start writing.
          if (!showPreview && e.target === e.currentTarget) {
            e.preventDefault();
            editor?.chain().focus('end').run();
          }
        }}
      >
        {doc ? (
          <>
            <WhiteboardEditor
              key={doc.id}
              initialBlocks={doc.blocks}
              mode={doc.mode}
              onChangeBlocks={handleBlocks}
              onEditorReady={setEditor}
              onElementChange={setElement}
              editorTools={editorTools}
              folds={folds}
              onToggleFold={toggleFold}
            />
            {showPreview && <PreviewView blocks={liveBlocks} settings={settingsApi.settings} />}
          </>
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
