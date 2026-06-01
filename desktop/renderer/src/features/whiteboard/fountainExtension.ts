/**
 * Fountain editing for Screenplay mode (TipTap extension):
 *  - infers screenplay element types from text and applies formatting via
 *    ProseMirror node decorations (non-destructive — the document stays plain text);
 *  - Tab opens an autocomplete popup at an empty line (via the onAutocomplete option);
 *  - Shift+Tab reduces Section depth on headings (else a safe no-op);
 *  - Cmd/Ctrl+B/I/U wrap the selection in Fountain emphasis markers.
 *
 * Cmd/Ctrl+K is intentionally NOT bound here — it belongs to the Logos assistant.
 * TODO (Pro): render emphasis markers, hide forcing characters, memoize classify.
 */

import { Extension } from '@tiptap/core';
import { Plugin, PluginKey } from '@tiptap/pm/state';
import { Decoration, DecorationSet } from '@tiptap/pm/view';
import type { Editor } from '@tiptap/react';

import {
  classify,
  extractCharacters,
  extractSceneHeadings,
  extractTransitions,
  type FountainBlock,
  type FountainType,
} from './fountain';

export const fountainKey = new PluginKey('fountainMode');

export interface AutocompleteContext {
  left: number;
  top: number;
  suggestions: string[];
}

export interface FountainOptions {
  onAutocomplete?: (ctx: AutocompleteContext) => void;
}

const STATIC_SUGGESTIONS = [
  'INT. ',
  'EXT. ',
  'INT./EXT. ',
  'CUT TO:',
  'FADE OUT:',
  'FADE IN:',
  'DISSOLVE TO:',
];

function blocksFromDoc(doc: any): FountainBlock[] {
  const blocks: FountainBlock[] = [];
  doc.forEach((node: any) => {
    blocks.push({
      text: node.textContent,
      isHeading: node.type.name === 'heading',
      level: node.attrs?.level,
    });
  });
  return blocks;
}

function buildDecorations(doc: any): DecorationSet {
  const types = classify(blocksFromDoc(doc));
  const decos: Decoration[] = [];
  doc.forEach((node: any, offset: number, index: number) => {
    if (node.type.name !== 'paragraph') return;
    const type = types[index];
    if (!type || type === 'action' || type === 'empty') return;
    decos.push(Decoration.node(offset, offset + node.nodeSize, { class: `sp-${type}` }));
  });
  return DecorationSet.create(doc, decos);
}

export function currentFountainType(editor: Editor): FountainType | null {
  const types = classify(blocksFromDoc(editor.state.doc));
  const idx = editor.state.selection.$from.index(0);
  return types[idx] ?? null;
}

function screenplayActive(editor: Editor): boolean {
  return fountainKey.getState(editor.state)?.screenplay === true;
}

function computeSuggestions(editor: Editor): string[] {
  const blocks = blocksFromDoc(editor.state.doc);
  const all = [
    ...STATIC_SUGGESTIONS,
    ...extractCharacters(blocks),
    ...extractSceneHeadings(blocks),
    ...extractTransitions(blocks),
  ];
  return [...new Set(all.filter(Boolean))];
}

function wrapMarker(editor: Editor, marker: string): boolean {
  const { from, to, empty } = editor.state.selection;
  if (empty) {
    editor.chain().focus().insertContent(marker + marker).run();
    editor.commands.setTextSelection(from + marker.length);
  } else {
    const text = editor.state.doc.textBetween(from, to, '');
    editor.chain().focus().insertContentAt({ from, to }, marker + text + marker).run();
  }
  return true;
}

export const FountainEditing = Extension.create<FountainOptions>({
  name: 'fountainEditing',

  addOptions() {
    return { onAutocomplete: undefined };
  },

  // Keep `sp` on paragraphs for backward-compatible persistence (older docs may
  // carry it). Formatting now comes from inference, not this attribute.
  addGlobalAttributes() {
    return [
      {
        types: ['paragraph'],
        attributes: {
          sp: {
            default: null,
            parseHTML: (el) => el.getAttribute('data-sp'),
            renderHTML: (attrs) => (attrs.sp ? { 'data-sp': attrs.sp } : {}),
          },
        },
      },
    ];
  },

  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: fountainKey,
        state: {
          init: () => ({ screenplay: false }),
          apply: (tr, value) => {
            const meta = tr.getMeta(fountainKey);
            return meta ? { screenplay: !!meta.screenplay } : value;
          },
        },
        props: {
          decorations(state) {
            return fountainKey.getState(state)?.screenplay ? buildDecorations(state.doc) : null;
          },
        },
      }),
    ];
  },

  addKeyboardShortcuts() {
    return {
      Tab: () => {
        const editor = this.editor;
        // Always consume Tab so it never moves focus out of the editor.
        if (screenplayActive(editor)) {
          const { $from, empty } = editor.state.selection;
          const onAutocomplete = this.options.onAutocomplete;
          if (empty && $from.parent.textContent.trim() === '' && onAutocomplete) {
            const coords = editor.view.coordsAtPos($from.pos);
            onAutocomplete({
              left: coords.left,
              top: coords.bottom + 4,
              suggestions: computeSuggestions(editor),
            });
          }
        }
        return true;
      },
      'Shift-Tab': () => {
        const editor = this.editor;
        if (editor.isActive('heading')) {
          const level = (editor.getAttributes('heading').level as number) ?? 1;
          if (level > 1) {
            editor.chain().focus().updateAttributes('heading', { level: level - 1 }).run();
          } else {
            editor.chain().focus().setNode('paragraph').run();
          }
        }
        return true; // safe no-op otherwise
      },
      'Mod-b': () => wrapMarker(this.editor, '**'),
      'Mod-i': () => wrapMarker(this.editor, '*'),
      'Mod-u': () => wrapMarker(this.editor, '_'),
    };
  },
});
