/**
 * Syntax-highlight themes (pure, testable).
 *
 * Writer-oriented, ORIGINAL palettes — inspired by the *idea* of code-editor
 * colour coding, not copied from any editor's theme files. Tokens map to a small
 * set of semantic roles (see CSS `.wb-syn-*` rules); a theme only defines the
 * role colours, so switching themes is a palette swap.
 */

import type { SyntaxThemeId } from '../editorToolTypes';

export interface SyntaxPalette {
  heading: string;
  accent: string;
  character: string;
  dialogue: string;
  muted: string;
  comment: string;
  warn: string;
  link: string;
  emphasis: string;
}

export interface SyntaxTheme {
  id: SyntaxThemeId;
  label: string;
  palette: SyntaxPalette;
}

export const SYNTAX_THEMES: Record<SyntaxThemeId, SyntaxTheme> = {
  // Barely-there tints — keeps the page feeling like a clean writing app.
  minimal: {
    id: 'minimal',
    label: 'Minimal',
    palette: {
      heading: '#1f2933',
      accent: '#557099',
      character: '#34506b',
      dialogue: '#2c2a26',
      muted: '#8a867c',
      comment: '#9b9788',
      warn: '#a86a32',
      link: '#3b6fd4',
      emphasis: '#2c2a26',
    },
  },
  // Warm sepia ink on cream — a typewritten manuscript feel.
  paper: {
    id: 'paper',
    label: 'Paper',
    palette: {
      heading: '#5a3e2b',
      accent: '#8a5a2b',
      character: '#6b4423',
      dialogue: '#3a2f25',
      muted: '#a8967c',
      comment: '#b3a382',
      warn: '#b5532a',
      link: '#1f6f6f',
      emphasis: '#2e241c',
    },
  },
  // Cool, soft, low-glare dark palette for night writing.
  'writer-dark': {
    id: 'writer-dark',
    label: 'Writer Dark',
    palette: {
      heading: '#9ec1ff',
      accent: '#7aa2f7',
      character: '#c4a7e7',
      dialogue: '#d6d9e0',
      muted: '#8089a0',
      comment: '#6b7a99',
      warn: '#f0a36b',
      link: '#79b8ff',
      emphasis: '#ece7df',
    },
  },
  // Higher-contrast, colour-coded dark — the "nerd" look, but tasteful.
  'sublime-dark': {
    id: 'sublime-dark',
    label: 'Sublime-like Dark',
    palette: {
      heading: '#e5c07b',
      accent: '#61afef',
      character: '#c678dd',
      dialogue: '#abb2bf',
      muted: '#5c6370',
      comment: '#7f848e',
      warn: '#e06c75',
      link: '#56b6c2',
      emphasis: '#98c379',
    },
  },
};

export const SYNTAX_THEME_LIST: SyntaxTheme[] = Object.values(SYNTAX_THEMES);

export function getSyntaxTheme(id: SyntaxThemeId): SyntaxTheme {
  return SYNTAX_THEMES[id] ?? SYNTAX_THEMES.minimal;
}

/** CSS custom properties for a theme, applied on the writing surface. */
export function themeCssVars(id: SyntaxThemeId): Record<string, string> {
  const p = getSyntaxTheme(id).palette;
  return {
    '--syn-heading': p.heading,
    '--syn-accent': p.accent,
    '--syn-character': p.character,
    '--syn-dialogue': p.dialogue,
    '--syn-muted': p.muted,
    '--syn-comment': p.comment,
    '--syn-warn': p.warn,
    '--syn-link': p.link,
    '--syn-emphasis': p.emphasis,
  };
}
