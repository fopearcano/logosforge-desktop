/**
 * Six original LogosForge theme palettes inspired by colour families (paper,
 * ink, Klein blue, ocher gold, cinema red, blue/bronze) — not copied from any
 * brand. Mixed themes (dark chrome + light page) keep UI text and editor ink
 * separate so both stay readable.
 */

import { customToTheme, rgba, type CustomThemeFields, type WhiteboardTheme } from './themeTokens';

export const PAPER_WHITE: WhiteboardTheme = {
  id: 'paper-white',
  name: 'Paper White',
  mode: 'light',
  appBg: '#f3ead3',
  panelBg: '#faf5ef',
  editorBg: '#fffdf7',
  text: '#28231d',
  mutedText: '#7b756c',
  editorText: '#28231d',
  editorMuted: '#a39a88',
  border: '#ded6c8',
  accent: '#9c6e4c',
  accentSoft: rgba('#9c6e4c', 0.14),
  selectionBg: rgba('#9c6e4c', 0.18),
  editorSelection: rgba('#9c6e4c', 0.16),
  caret: '#9c6e4c',
  shadow: '0 1px 3px rgba(60, 40, 20, 0.08), 0 10px 30px rgba(60, 40, 20, 0.06)',
};

export const INK_BLACK: WhiteboardTheme = {
  id: 'ink-black',
  name: 'Ink Black',
  mode: 'dark',
  appBg: '#0d0d0d',
  panelBg: '#161616',
  editorBg: '#070504',
  text: '#f8eeec',
  mutedText: '#aaa19a',
  editorText: '#f1e9e4',
  editorMuted: '#8a847d',
  border: '#2a2622',
  accent: '#8db9fb',
  accentSoft: rgba('#8db9fb', 0.16),
  selectionBg: rgba('#8db9fb', 0.24),
  editorSelection: rgba('#8db9fb', 0.2),
  caret: '#eab740',
  shadow: '0 1px 2px rgba(0, 0, 0, 0.5)',
};

export const KLEIN_BLUE: WhiteboardTheme = {
  id: 'klein-blue',
  name: 'Klein Blue',
  mode: 'dark',
  appBg: '#001b61',
  panelBg: '#06246d',
  editorBg: '#001039',
  text: '#eaf0ff',
  mutedText: '#9db8fe',
  editorText: '#eaf0ff',
  editorMuted: '#7d97e0',
  border: '#173a8f',
  accent: '#5b8bff',
  accentSoft: rgba('#2663ff', 0.22),
  selectionBg: rgba('#4078ff', 0.3),
  editorSelection: rgba('#4078ff', 0.26),
  caret: '#7da4ff',
  shadow: '0 1px 3px rgba(0, 0, 0, 0.5)',
};

export const OCHER_GOLD: WhiteboardTheme = {
  id: 'ocher-gold',
  name: 'Ocher Gold',
  mode: 'dark',
  appBg: '#302117',
  panelBg: '#3a2a1d',
  editorBg: '#fdf5df',
  text: '#ece0c8',
  mutedText: '#b09b7e',
  editorText: '#1f2626',
  editorMuted: '#78654a',
  border: '#57422c',
  accent: '#d99a3d',
  accentSoft: rgba('#cf9033', 0.18),
  selectionBg: rgba('#eab740', 0.26),
  editorSelection: rgba('#cf9033', 0.2),
  caret: '#cf9033',
  shadow: '0 1px 3px rgba(0, 0, 0, 0.4)',
};

export const RED_ROOM: WhiteboardTheme = {
  id: 'red-room',
  name: 'Red Room',
  mode: 'dark',
  appBg: '#420a0a',
  panelBg: '#4f0f0f',
  editorBg: '#fff4ec',
  text: '#f2d9d2',
  mutedText: '#c79a92',
  editorText: '#2b1010',
  editorMuted: '#8b5a54',
  border: '#6b2424',
  accent: '#e07a6e',
  accentSoft: rgba('#d9685c', 0.2),
  selectionBg: rgba('#d9685c', 0.26),
  editorSelection: rgba('#cd5c5c', 0.18),
  caret: '#cd5c5c',
  shadow: '0 1px 3px rgba(0, 0, 0, 0.45)',
};

export const BLUE_BRONZE: WhiteboardTheme = {
  id: 'blue-bronze',
  name: 'Blue Bronze',
  mode: 'dark',
  appBg: '#101e36',
  panelBg: '#16263f',
  editorBg: '#f3ead3',
  text: '#d6e0f0',
  mutedText: '#8ba0bf',
  editorText: '#1b1b1b',
  editorMuted: '#60432e',
  border: '#314463',
  accent: '#4f86dd',
  accentSoft: rgba('#2e63c4', 0.2),
  selectionBg: rgba('#2e63c4', 0.26),
  editorSelection: rgba('#9c6e4c', 0.18),
  caret: '#9c6e4c',
  shadow: '0 1px 3px rgba(0, 0, 0, 0.4)',
};

export const PREDEFINED_THEMES: WhiteboardTheme[] = [
  PAPER_WHITE,
  INK_BLACK,
  KLEIN_BLUE,
  OCHER_GOLD,
  RED_ROOM,
  BLUE_BRONZE,
];

export const DEFAULT_THEME_ID = PAPER_WHITE.id;

export function getPredefinedTheme(id: string): WhiteboardTheme | undefined {
  return PREDEFINED_THEMES.find((t) => t.id === id);
}

/** Resolve a theme id (+ custom fields) into a full theme. */
export function resolveTheme(themeId: string, customFields: CustomThemeFields): WhiteboardTheme {
  if (themeId === 'custom') return customToTheme(customFields);
  return getPredefinedTheme(themeId) ?? PREDEFINED_THEMES[0];
}

/** Starting point for the Custom theme (a clean warm-paper look). */
export const DEFAULT_CUSTOM_FIELDS: CustomThemeFields = {
  appBg: '#1b2330',
  editorBg: '#fbf7ee',
  text: '#dde4ee',
  mutedText: '#8b94a6',
  accent: '#3b6fd4',
  border: '#2c3647',
};
