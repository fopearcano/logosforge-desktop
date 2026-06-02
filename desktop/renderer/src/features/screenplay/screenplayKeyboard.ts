/**
 * Screenplay keyboard handlers (Tab autocomplete, Shift+Tab section depth,
 * Cmd/Ctrl+B/I/U emphasis markers).
 *
 * Enter is intentionally NOT overridden: default Enter splits the paragraph and
 * the live classifier formats the new line by context — so the listed Enter
 * behaviors emerge naturally (a line after a Character becomes Dialogue as you
 * type; a blank line ends the dialogue block; etc.) without risking normal
 * editing. Cmd/Ctrl+K is reserved for the Logos assistant and is never bound here.
 */

import type { Editor } from '@tiptap/react';

import { computeSuggestions } from './screenplayAutocomplete';
import { docToFountainBlocks } from './screenplayFormatting';

export interface AutocompleteContext {
  left: number;
  top: number;
  suggestions: string[];
}

function isScreenplay(editor: Editor): boolean {
  return editor.view.dom.getAttribute('data-writing-mode') === 'screenplay';
}

export function handleTab(
  editor: Editor,
  onAutocomplete?: (ctx: AutocompleteContext) => void,
): boolean {
  // Always consume Tab so it never moves focus out of the editor.
  if (isScreenplay(editor)) {
    const { $from, empty } = editor.state.selection;
    if (empty && $from.parent.textContent.trim() === '' && onAutocomplete) {
      const coords = editor.view.coordsAtPos($from.pos);
      onAutocomplete({
        left: coords.left,
        top: coords.bottom + 4,
        suggestions: computeSuggestions(docToFountainBlocks(editor.state.doc)),
      });
    }
  }
  return true;
}

export function handleShiftTab(editor: Editor): boolean {
  if (editor.isActive('heading')) {
    const level = (editor.getAttributes('heading').level as number) ?? 1;
    if (level > 1) {
      editor.chain().focus().updateAttributes('heading', { level: level - 1 }).run();
    } else {
      editor.chain().focus().setNode('paragraph').run();
    }
  }
  return true; // safe no-op otherwise
}

export function wrapMarker(editor: Editor, marker: string): boolean {
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
