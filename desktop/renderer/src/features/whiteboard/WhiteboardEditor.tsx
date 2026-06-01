/**
 * The TipTap (ProseMirror) writing surface.
 *
 * Minimal blank-sheet schema: paragraphs + headings + undo/redo. Inline marks
 * and lists are intentionally off for now because the backend persists plain
 * text per block; richer content (canonical ProseMirror JSON) is a later step.
 * Content is mapped 1:1 to the backend's flat `blocks` contract.
 */

import Placeholder from '@tiptap/extension-placeholder';
import { EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { useRef } from 'react';

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
  onChangeBlocks: (blocks: WhiteboardBlock[]) => void;
}

export function WhiteboardEditor({ initialBlocks, onChangeBlocks }: Props) {
  // Keep the latest callback without re-creating the editor.
  const onChangeRef = useRef(onChangeBlocks);
  onChangeRef.current = onChangeBlocks;

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

  return <EditorContent editor={editor} />;
}
