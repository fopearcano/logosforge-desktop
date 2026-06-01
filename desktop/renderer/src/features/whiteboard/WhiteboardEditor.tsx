/**
 * The TipTap (ProseMirror) writing surface.
 *
 * Minimal blank-sheet schema: paragraphs + headings + undo/redo. Inline marks
 * and lists are intentionally off for now because the backend persists plain
 * text per block; richer content (canonical ProseMirror JSON) is a later step.
 * Content is mapped 1:1 to the backend's flat `blocks` contract.
 */

import Placeholder from '@tiptap/extension-placeholder';
import { EditorContent, useEditor, type Editor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { useEffect, useRef } from 'react';

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
    return { type: 'paragraph', content: inline };
  });
  return { type: 'doc', content: content.length ? content : [{ type: 'paragraph' }] };
}

function docToBlocks(json: any): WhiteboardBlock[] {
  const nodes: any[] = Array.isArray(json?.content) ? json.content : [];
  return nodes.map((n, i) => {
    if (n.type === 'heading') {
      return { id: `b${i}`, type: 'heading', text: textOf(n), level: n.attrs?.level ?? 1 };
    }
    return { id: `b${i}`, type: 'paragraph', text: textOf(n) };
  });
}

// --- component --------------------------------------------------------------

interface Props {
  initialBlocks: WhiteboardBlock[];
  mode: string;
  onChangeBlocks: (blocks: WhiteboardBlock[]) => void;
  onEditorReady?: (editor: Editor) => void;
}

export function WhiteboardEditor({ initialBlocks, mode, onChangeBlocks, onEditorReady }: Props) {
  // Keep the latest callbacks without re-creating the editor.
  const onChangeRef = useRef(onChangeBlocks);
  onChangeRef.current = onChangeBlocks;
  const onReadyRef = useRef(onEditorReady);
  onReadyRef.current = onEditorReady;

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
      Placeholder.configure({ placeholder: 'Start writing…' }),
    ],
    content: blocksToDoc(initialBlocks),
    autofocus: 'end',
    editorProps: {
      attributes: { class: 'wb-editor' },
    },
    onUpdate: ({ editor: ed }) => {
      onChangeRef.current(docToBlocks(ed.getJSON()));
    },
  });

  // Reflect the active writing mode on the editor surface. This is the clean
  // boundary for future per-mode behavior (element grammars, schemas); today it
  // drives a small typographic change (screenplay/stage use a monospaced face).
  useEffect(() => {
    editor?.view.dom.setAttribute('data-writing-mode', mode);
  }, [editor, mode]);

  // Expose the editor instance once ready (for the inline Logos assistant).
  useEffect(() => {
    if (editor) onReadyRef.current?.(editor);
  }, [editor]);

  return <EditorContent editor={editor} />;
}
