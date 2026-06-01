/**
 * Minimal Screenplay mode for the editor.
 *
 * Screenplay element type is stored as an `sp` attribute on paragraph nodes
 * (rendered as `data-sp`), so the document structure stays clean and the
 * attribute round-trips through the backend's block contract. Tab / Shift+Tab
 * cycle the element type — but only in Screenplay mode; in other modes Tab is
 * consumed (a no-op) so it never yanks focus out of the editor.
 *
 * Formatting is applied in CSS (see app.css), scoped to Screenplay mode.
 * This is a clean minimal foundation, not Final Draft-level behavior.
 * TODO (Pro): smart Enter transitions (Character -> Dialogue -> Action),
 * auto-uppercasing, scene-heading autocomplete, outline integration.
 */

import { Extension } from '@tiptap/core';
import type { Editor } from '@tiptap/react';

export const SCREENPLAY_ELEMENTS = [
  'scene_heading',
  'action',
  'character',
  'dialogue',
  'parenthetical',
  'transition',
] as const;

export type ScreenplayElement = (typeof SCREENPLAY_ELEMENTS)[number];

const LABELS: Record<string, string> = {
  scene_heading: 'Scene Heading',
  action: 'Action',
  character: 'Character',
  dialogue: 'Dialogue',
  parenthetical: 'Parenthetical',
  transition: 'Transition',
};

/** Human label for a screenplay element (defaults to "Action"). */
export function screenplayLabel(sp: string | null | undefined): string {
  return sp ? LABELS[sp] ?? 'Action' : 'Action';
}

function isScreenplay(editor: Editor): boolean {
  return editor.view.dom.getAttribute('data-writing-mode') === 'screenplay';
}

function cycle(editor: Editor, dir: 1 | -1): boolean {
  // Consume Tab everywhere (so focus never leaves the editor); only cycle when
  // in Screenplay mode.
  if (!isScreenplay(editor)) return true;
  const order = SCREENPLAY_ELEMENTS as readonly string[];
  const cur = editor.getAttributes('paragraph').sp as string | null | undefined;
  const i = cur ? order.indexOf(cur) : -1;
  const next = order[(i + dir + order.length) % order.length];
  editor.chain().focus().updateAttributes('paragraph', { sp: next }).run();
  return true;
}

export const ScreenplayElements = Extension.create({
  name: 'screenplayElements',

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

  addKeyboardShortcuts() {
    return {
      Tab: () => cycle(this.editor, 1),
      'Shift-Tab': () => cycle(this.editor, -1),
    };
  },
});
