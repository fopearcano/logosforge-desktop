/**
 * The TipTap (ProseMirror) writing surface.
 *
 * Minimal blank-sheet schema: paragraphs + headings + undo/redo, with a
 * Screenplay-element attribute (`sp`) on paragraphs (see ./screenplay). Inline
 * marks and lists stay off; content maps 1:1 to the backend's flat `blocks`
 * contract (including `sp`, so screenplay element types persist).
 */

import Placeholder from '@tiptap/extension-placeholder';
import { EditorContent, useEditor, type Editor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { useEffect, useRef } from 'react';

import { ScreenplayElements } from './screenplay';
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

function currentScreenplayElement(ed: Editor): string | null {
  return (ed.getAttributes('paragraph').sp as string | null | undefined) ?? null;
}

// --- component --------------------------------------------------------------

interface Props {
  initialBlocks: WhiteboardBlock[];
  mode: string;
  onChangeBlocks: (blocks: WhiteboardBlock[]) => void;
  onEditorReady?: (editor: Editor) => void;
  /** Reports the screenplay element type at the cursor (for the status line). */
  onElementChange?: (sp: string | null) => void;
}

export function WhiteboardEditor({
  initialBlocks,
  mode,
  onChangeBlocks,
  onEditorReady,
  onElementChange,
}: Props) {
  // Keep the latest callbacks without re-creating the editor.
  const onChangeRef = useRef(onChangeBlocks);
  onChangeRef.current = onChangeBlocks;
  const onReadyRef = useRef(onEditorReady);
  onReadyRef.current = onEditorReady;
  const onElementRef = useRef(onElementChange);
  onElementRef.current = onElementChange;

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
      ScreenplayElements,
      Placeholder.configure({ placeholder: 'Start writing…' }),
    ],
    content: blocksToDoc(initialBlocks),
    autofocus: 'end',
    editorProps: {
      attributes: { class: 'wb-editor' },
    },
    onUpdate: ({ editor: ed }) => {
      onChangeRef.current(docToBlocks(ed.getJSON()));
      onElementRef.current?.(currentScreenplayElement(ed));
    },
    onSelectionUpdate: ({ editor: ed }) => {
      onElementRef.current?.(currentScreenplayElement(ed));
    },
  });

  // Reflect the active writing mode on the editor surface (drives Screenplay
  // element formatting in CSS, scoped to Screenplay mode).
  useEffect(() => {
    editor?.view.dom.setAttribute('data-writing-mode', mode);
  }, [editor, mode]);

  // Expose the editor instance once ready (for the inline Logos assistant) and
  // report the initial screenplay element.
  useEffect(() => {
    if (!editor) return;
    onReadyRef.current?.(editor);
    onElementRef.current?.(currentScreenplayElement(editor));
  }, [editor]);

  return <EditorContent editor={editor} />;
}
