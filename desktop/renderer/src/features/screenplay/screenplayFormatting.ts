/**
 * Builds ProseMirror decorations for Screenplay mode:
 *  - title-page metadata (subdued) at the top of the document;
 *  - boneyard / omitted text (subdued) wherever it appears;
 *  - block element classes (sp-scene_heading, sp-character, …) from the classifier;
 *  - inline emphasis (bold/italic/underline) + dimmed markers from the parser.
 *
 * Non-destructive: the document stays plain Fountain-compatible text.
 * TODO (Pro): memoize per-doc to avoid reclassifying on every render.
 */

import { Decoration, DecorationSet } from '@tiptap/pm/view';

import { parseEmphasis } from './fountainParser';
import { detectBoneyard } from './screenplayBoneyard';
import { classify } from './screenplayClassifier';
import { parseTitlePage } from './screenplayTitlePage';
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
  const blocks = docToFountainBlocks(doc);
  const types = classify(blocks);
  const boneyard = detectBoneyard(blocks);
  const titleEnd = parseTitlePage(blocks).endIndex;
  const decos: Decoration[] = [];

  doc.forEach((node: any, offset: number, index: number) => {
    if (node.type.name !== 'paragraph') return;
    const range = { from: offset, to: offset + node.nodeSize };

    // Title page + boneyard are rendered subdued and skip element/emphasis.
    if (index < titleEnd) {
      decos.push(Decoration.node(range.from, range.to, { class: 'sp-title-page' }));
      return;
    }
    if (boneyard[index]) {
      decos.push(Decoration.node(range.from, range.to, { class: 'sp-boneyard' }));
      return;
    }

    // Block element formatting.
    const type = types[index];
    if (type && type !== 'action' && type !== 'empty') {
      decos.push(Decoration.node(range.from, range.to, { class: `sp-${type}` }));
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
