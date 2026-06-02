/**
 * Screenplay keyboard handlers.
 *
 *  - Tab on a Section (heading) deepens it; on a paragraph it opens autocomplete
 *    (filtered by the current line); always consumes Tab so focus never leaves.
 *  - Shift+Tab on a Section shallows it (or drops the section); else safe no-op.
 *  - Cmd/Ctrl+B/I/U wrap emphasis markers. Note/Omit wrap [[ ]] and the boneyard.
 *
 * Enter is not overridden — the live classifier formats the new line by context.
 * Cmd/Ctrl+K is reserved for Logos and never bound here. (Note: Cmd/Ctrl+Y is
 * NOT used for Note because TipTap's history binds it to redo on Windows; the
 * Note/Omit commands use Cmd/Ctrl+Alt+N / Cmd/Ctrl+Alt+O instead.)
 */

import type { Editor } from '@tiptap/react';

import { computeSuggestions } from './screenplayAutocomplete';
import { classify } from './screenplayClassifier';
import { docToFountainBlocks } from './screenplayFormatting';
import { sectionShiftTabLevel, sectionTabLevel } from './screenplaySections';

export interface AutocompleteContext {
  left: number;
  top: number;
  query: string;
  from: number;
  to: number;
  suggestions: string[];
}

function isScreenplay(editor: Editor): boolean {
  return editor.view.dom.getAttribute('data-writing-mode') === 'screenplay';
}

export function handleTab(
  editor: Editor,
  onAutocomplete?: (ctx: AutocompleteContext) => void,
): boolean {
  if (!isScreenplay(editor)) return true; // consume; protect focus

  // Section indent (Tab adds a #).
  if (editor.isActive('heading')) {
    const level = (editor.getAttributes('heading').level as number) ?? 1;
    editor.chain().focus().updateAttributes('heading', { level: sectionTabLevel(level) }).run();
    return true;
  }

  // Otherwise open autocomplete filtered by the current line text.
  if (onAutocomplete) {
    const { $from } = editor.state.selection;
    const from = $from.start();
    const to = $from.end();
    const blocks = docToFountainBlocks(editor.state.doc);
    const types = classify(blocks);
    const prev = types[$from.index(0) - 1];
    const charactersFirst =
      prev === 'scene_heading' ||
      prev === 'action' ||
      prev === 'character' ||
      prev === 'dialogue' ||
      prev === 'parenthetical';
    const coords = editor.view.coordsAtPos(from);
    onAutocomplete({
      left: coords.left,
      top: coords.bottom + 4,
      query: $from.parent.textContent,
      from,
      to,
      suggestions: computeSuggestions(blocks, charactersFirst),
    });
  }
  return true;
}

export function handleShiftTab(editor: Editor): boolean {
  if (editor.isActive('heading')) {
    const level = (editor.getAttributes('heading').level as number) ?? 1;
    const next = sectionShiftTabLevel(level);
    if (next === 0) editor.chain().focus().setNode('paragraph').run();
    else editor.chain().focus().updateAttributes('heading', { level: next }).run();
  }
  return true; // safe no-op otherwise
}

function wrapPair(editor: Editor, open: string, close: string): boolean {
  const { from, to, empty } = editor.state.selection;
  if (empty) {
    editor.chain().focus().insertContent(open + close).run();
    editor.commands.setTextSelection(from + open.length);
  } else {
    const text = editor.state.doc.textBetween(from, to, '');
    editor.chain().focus().insertContentAt({ from, to }, open + text + close).run();
  }
  return true;
}

export const wrapMarker = (editor: Editor, marker: string) => wrapPair(editor, marker, marker);
export const wrapNote = (editor: Editor) => wrapPair(editor, '[[', ']]');
export const wrapOmit = (editor: Editor) => wrapPair(editor, '/*', '*/');
