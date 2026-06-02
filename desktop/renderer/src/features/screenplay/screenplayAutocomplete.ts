/** Autocomplete suggestion logic (pure, testable) — static slugs + doc-derived. */

import type { FountainBlock } from './fountainTypes';
import {
  extractCharacters,
  extractSceneHeadings,
  extractTransitions,
} from './screenplayClassifier';

export const STATIC_SUGGESTIONS = [
  'INT. ',
  'EXT. ',
  'INT./EXT. ',
  'EST. ',
  'CUT TO:',
  'FADE TO:',
  'FADE OUT:',
  'FADE IN:',
  'DISSOLVE TO:',
  'SMASH CUT:',
];

export function computeSuggestions(blocks: FountainBlock[]): string[] {
  const all = [
    ...STATIC_SUGGESTIONS,
    ...extractCharacters(blocks),
    ...extractSceneHeadings(blocks),
    ...extractTransitions(blocks),
  ];
  return [...new Set(all.filter(Boolean))];
}
