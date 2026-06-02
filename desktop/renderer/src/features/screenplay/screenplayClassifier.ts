/**
 * Fountain-style screenplay line classifier (pure, testable). Classifies a
 * sequence of document blocks into screenplay element types using simple
 * patterns + neighbour context.
 *
 * TODO (Pro): dual dialogue, title page, lyrics, boneyard/comments, hiding the
 * forcing characters from the rendered view.
 */

import type { FountainBlock, FountainType } from './fountainTypes';

const SCENE_PREFIXES = ['INT./EXT.', 'INT/EXT.', 'I/E.', 'INT.', 'EXT.', 'EST.'];

function isSceneHeading(t: string): boolean {
  if (t.startsWith('.') && !t.startsWith('..')) return true; // forced
  const up = t.toUpperCase();
  return SCENE_PREFIXES.some((p) => up.startsWith(p));
}

function isAllCaps(t: string): boolean {
  return /[A-Za-z]/.test(t) && t === t.toUpperCase() && !/[a-z]/.test(t);
}

function isTransition(t: string): boolean {
  if (t.startsWith('>') && !t.endsWith('<')) return true; // forced
  return isAllCaps(t) && /TO:$/.test(t);
}

const isParenthetical = (t: string) => t.startsWith('(') && t.endsWith(')');
const isNote = (t: string) => t.startsWith('[[') && t.endsWith(']]');
const isCentered = (t: string) => t.startsWith('>') && t.endsWith('<');
const isPageBreak = (t: string) => /^=+$/.test(t) && t.length >= 3;
const isSynopsis = (t: string) => t.startsWith('=') && !isPageBreak(t);

function hasContentAfter(blocks: FountainBlock[], i: number): boolean {
  const next = blocks[i + 1];
  if (!next || next.isHeading) return false;
  return next.text.trim() !== '';
}

/** Classify every block; index-aligned with the input. */
export function classify(blocks: FountainBlock[]): FountainType[] {
  const out: FountainType[] = [];
  let prev: FountainType = 'empty';

  for (let i = 0; i < blocks.length; i += 1) {
    const b = blocks[i];
    const t = b.text.trim();
    let type: FountainType;

    if (b.isHeading) type = 'section';
    else if (t === '') type = 'empty';
    else if (isPageBreak(t)) type = 'page_break';
    else if (t.startsWith('#')) type = 'section';
    else if (isSynopsis(t)) type = 'synopsis';
    else if (isNote(t)) type = 'note';
    else if (isCentered(t)) type = 'centered';
    else if (isTransition(t)) type = 'transition';
    else if (isSceneHeading(t)) type = 'scene_heading';
    else if (t.startsWith('!')) type = 'action'; // forced action
    else if (t.startsWith('@')) type = 'character'; // forced character
    else if (
      isParenthetical(t) &&
      (prev === 'character' ||
        prev === 'parenthetical' ||
        prev === 'dialogue' ||
        hasContentAfter(blocks, i))
    )
      type = 'parenthetical';
    else if (prev === 'character' || prev === 'parenthetical' || prev === 'dialogue')
      type = 'dialogue';
    else if (isAllCaps(t) && hasContentAfter(blocks, i)) type = 'character';
    else type = 'action';

    out.push(type);
    prev = type;
  }
  return out;
}

const LABELS: Record<string, string> = {
  scene_heading: 'Scene Heading',
  action: 'Action',
  character: 'Character',
  dialogue: 'Dialogue',
  parenthetical: 'Parenthetical',
  transition: 'Transition',
  section: 'Section',
  synopsis: 'Synopsis',
  note: 'Note',
  centered: 'Centered',
  page_break: 'Page Break',
  empty: 'Action',
};

export function screenplayLabel(type: FountainType | null | undefined): string {
  return type ? LABELS[type] ?? 'Action' : 'Action';
}

function cleanCharacter(t: string): string {
  return t
    .replace(/^@/, '')
    .replace(/\(.*\)\s*$/, '') // strip trailing (V.O.) etc.
    .trim()
    .toUpperCase();
}

/** Distinct character cues in document order (for autocomplete). */
export function extractCharacters(blocks: FountainBlock[]): string[] {
  const types = classify(blocks);
  const seen = new Set<string>();
  blocks.forEach((b, i) => {
    if (types[i] === 'character') {
      const name = cleanCharacter(b.text.trim());
      if (name) seen.add(name);
    }
  });
  return [...seen];
}

/** Distinct scene headings (for autocomplete). */
export function extractSceneHeadings(blocks: FountainBlock[]): string[] {
  const types = classify(blocks);
  const seen = new Set<string>();
  blocks.forEach((b, i) => {
    if (types[i] === 'scene_heading') {
      const s = b.text.trim().replace(/^\./, '');
      if (s) seen.add(s.toUpperCase());
    }
  });
  return [...seen];
}

/** Distinct transitions used (for autocomplete). */
export function extractTransitions(blocks: FountainBlock[]): string[] {
  const types = classify(blocks);
  const seen = new Set<string>();
  blocks.forEach((b, i) => {
    if (types[i] === 'transition') {
      const s = b.text.trim().replace(/^>/, '').trim();
      if (s) seen.add(s.toUpperCase());
    }
  });
  return [...seen];
}
