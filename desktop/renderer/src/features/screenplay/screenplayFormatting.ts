/**
 * Builds ProseMirror decorations for Screenplay mode:
 *  - block element classes (sp-scene_heading, sp-character, …) from the classifier;
 *  - inline emphasis (bold/italic/underline) + dimmed markers from the parser.
 *
 * Non-destructive: the document stays plain Fountain-compatible text.
 * TODO (Pro): memoize per-doc to avoid reclassifying on every render.
 */

import { Decoration, DecorationSet } from '@tiptap/pm/view';

import { parseEmphasis } from './fountainParser';
import { classify } from './screenplayClassifier';
import type { FountainBlock } from './fountainTypes';

export function docToFountainBlocks(doc: any): FountainBlock[] {
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

export function buildDecorations(doc: any): DecorationSet {
  const types = classify(docToFountainBlocks(doc));
  const decos: Decoration[] = [];
  doc.forEach((node: any, offset: number, index: number) => {
    if (node.type.name !== 'paragraph') return;

    // Block element formatting.
    const type = types[index];
    if (type && type !== 'action' && type !== 'empty') {
      decos.push(Decoration.node(offset, offset + node.nodeSize, { class: `sp-${type}` }));
    }

    // Inline emphasis (paragraphs contain only text in our schema, so a text
    // char index maps directly to a document position).
    const base = offset + 1;
    for (const r of parseEmphasis(node.textContent)) {
      if (r.to > r.from) {
        decos.push(Decoration.inline(base + r.from, base + r.to, { class: r.className }));
      }
    }
  });
  return DecorationSet.create(doc, decos);
}
