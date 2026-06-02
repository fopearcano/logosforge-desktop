/**
 * The TipTap (ProseMirror) writing surface.
 *
 * Per-mode behavior comes from the mode registry (./modes): Screenplay applies
 * the Fountain engine (../screenplay) — inference formatting + screenplay
 * keyboard; prose modes are plain paragraphs/headings. Content maps 1:1 to the
 * backend's `blocks` contract.
 */

import { EditorContent, useEditor, type Editor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { useEffect, useRef, useState } from 'react';

import type { FountainType } from '../screenplay/fountainTypes';
import { ScreenplayAutocomplete } from '../screenplay/ScreenplayAutocomplete';
import {
  ScreenplayEditing,
  currentFountainType,
  fountainKey,
} from '../screenplay/screenplayExtension';
import type { WhiteboardBlock } from './types';

// --- block <-> ProseMirror document mapping --------------------------------

function textOf(node: any): string {
  if (!node) return '';
  if (node.type === 'text') return node.text ?? '';
  if (Array.isArray(node.content)) return node.content.map(textOf).join('');
  return '';
}

function blocksToDoc(blocks: WhiteboardBlock[]) {
  const content = blocks.map((b) => {
    const inline = b.text ? [{ type: 'text', text: b.text }] : [];
    if (b.type === 'heading') {
      return { type: 'heading', attrs: { level: b.level ?? 1 }, content: inline };
    }
    return { type: 'paragraph', attrs: { sp: b.sp ?? null }, content: inline };
  });
  return { type: 'doc', content: content.length ? content : [{ type: 'paragraph' }] };
}

function docToBlocks(json: any): WhiteboardBlock[] {
  const nodes: any[] = Array.isArray(json?.content) ? json.content : [];
  return nodes.map((n, i) => {
    if (n.type === 'heading') {
      return { id: `b${i}`, type: 'heading', text: textOf(n), level: n.attrs?.level ?? 1 };
    }
    return { id: `b${i}`, type: 'paragraph', text: textOf(n), sp: n.attrs?.sp ?? null };
  });
}

// --- component --------------------------------------------------------------

interface Props {
  initialBlocks: WhiteboardBlock[];
  mode: string;
  onChangeBlocks: (blocks: WhiteboardBlock[]) => void;
  onEditorReady?: (editor: Editor) => void;
  /** Reports the inferred screenplay element at the cursor (for the status line). */
  onElementChange?: (type: FountainType | null) => void;
}

interface AcState {
  open: boolean;
  left: number;
  top: number;
  suggestions: string[];
}

export function WhiteboardEditor({
  initialBlocks,
  mode,
  onChangeBlocks,
  onEditorReady,
  onElementChange,
}: Props) {
  const onChangeRef = useRef(onChangeBlocks);
  onChangeRef.current = onChangeBlocks;
  const onReadyRef = useRef(onEditorReady);
  onReadyRef.current = onEditorReady;
  const onElementRef = useRef(onElementChange);
  onElementRef.current = onElementChange;

  const [ac, setAc] = useState<AcState>({ open: false, left: 0, top: 0, suggestions: [] });
  const openAcRef = useRef((ctx: { left: number; top: number; suggestions: string[] }) =>
    setAc({ open: true, ...ctx }),
  );

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
        bold: false,
        italic: false,
        strike: false,
        code: false,
        codeBlock: false,
        blockquote: false,
        horizontalRule: false,
        bulletList: false,
        orderedList: false,
        listItem: false,
        hardBreak: false,
      }),
      ScreenplayEditing.configure({ onAutocomplete: (ctx) => openAcRef.current(ctx) }),
    ],
    content: blocksToDoc(initialBlocks),
    autofocus: 'end',
    editorProps: {
      attributes: { class: 'wb-editor' },
    },
    onUpdate: ({ editor: ed }) => {
      onChangeRef.current(docToBlocks(ed.getJSON()));
      onElementRef.current?.(currentFountainType(ed));
    },
    onSelectionUpdate: ({ editor: ed }) => {
      onElementRef.current?.(currentFountainType(ed));
    },
  });

  // Reflect the mode on the surface (drives per-mode typography) and tell the
  // Fountain plugin whether to infer/format (reliable, no DOM-timing race).
  useEffect(() => {
    if (!editor) return;
    editor.view.dom.setAttribute('data-writing-mode', mode);
    editor.view.dispatch(editor.state.tr.setMeta(fountainKey, { screenplay: mode === 'screenplay' }));
  }, [editor, mode]);

  useEffect(() => {
    if (!editor) return;
    onReadyRef.current?.(editor);
    onElementRef.current?.(currentFountainType(editor));
  }, [editor]);

  return (
    <>
      <EditorContent editor={editor} className="wb-content" />
      <ScreenplayAutocomplete
        open={ac.open}
        left={ac.left}
        top={ac.top}
        suggestions={ac.suggestions}
        onSelect={(text) => {
          editor?.chain().focus().insertContent(text).run();
          setAc((s) => ({ ...s, open: false }));
        }}
        onClose={() => setAc((s) => ({ ...s, open: false }))}
      />
    </>
  );
}
