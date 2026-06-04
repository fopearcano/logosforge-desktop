/**
 * Whiteboard theme tokens + application.
 *
 * The whole UI already reads CSS variables (`--bg`, `--panel`, `--paper`,
 * `--ink`, `--text`, `--accent`, …), so applying a theme = setting those
 * variables on <html>. We also publish the spec's `--lf-*` aliases. No CSS
 * rewrite needed.
 *
 * Two text colours matter: UI text (`text`, on the app/panel chrome) and editor
 * ink (`editorText`, on the writing surface) — they differ in mixed themes like
 * Blue Bronze (navy chrome + parchment page).
 */

export interface WhiteboardTheme {
  id: string;
  name: string;
  /** Chrome luminance (panels/app) — drives hover/error/ok shades. */
  mode: 'light' | 'dark';
  appBg: string;
  panelBg: string;
  editorBg: string;
  text: string; // UI text on app/panel
  mutedText: string; // UI muted text
  editorText: string; // editor ink on editorBg
  editorMuted: string; // editor muted on editorBg
  border: string;
  accent: string;
  accentSoft: string;
  selectionBg: string; // UI selection
  editorSelection: string; // editor text selection
  caret: string;
  shadow: string;
}

/** The minimal user-editable Custom theme fields (Part 3). */
export interface CustomThemeFields {
  appBg: string;
  editorBg: string;
  text: string;
  mutedText: string;
  accent: string;
  border: string;
}

function hexToRgb(hex: string): [number, number, number] {
  let h = hex.replace('#', '').trim();
  if (h.length === 3)
    h = h
      .split('')
      .map((c) => c + c)
      .join('');
  const n = parseInt(h.slice(0, 6), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

/** `rgba(...)` string from a hex colour + alpha (for selection/soft tints). */
export function rgba(hex: string, alpha: number): string {
  const [r, g, b] = hexToRgb(hex);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

/** Is a hex colour dark (low relative luminance)? */
export function isDark(hex: string): boolean {
  const [r, g, b] = hexToRgb(hex);
  return (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255 < 0.5;
}

/** Apply a theme by setting CSS variables on <html>. */
export function applyThemeVars(theme: WhiteboardTheme): void {
  const root = document.documentElement;
  const dark = theme.mode === 'dark';
  const set = (k: string, v: string) => root.style.setProperty(k, v);

  // Legacy variables the existing CSS already consumes.
  set('--bg', theme.appBg);
  set('--panel', theme.panelBg);
  set('--border', theme.border);
  set('--text', theme.text);
  set('--muted', theme.mutedText);
  set('--accent', theme.accent);
  set('--hover', dark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)');
  set('--selection', theme.selectionBg);
  set('--paper', theme.editorBg);
  set('--ink', theme.editorText);
  set('--paper-muted', theme.editorMuted);
  set('--paper-selection', theme.editorSelection);
  set('--page-shadow', theme.shadow);
  set('--caret', theme.caret);
  set('--error', dark ? '#f08a8a' : '#c0392b');
  set('--ok', dark ? '#6cc58f' : '#2e8b57');

  // Spec `--lf-*` aliases.
  set('--lf-app-bg', theme.appBg);
  set('--lf-editor-bg', theme.editorBg);
  set('--lf-panel-bg', theme.panelBg);
  set('--lf-text', theme.text);
  set('--lf-muted-text', theme.mutedText);
  set('--lf-border', theme.border);
  set('--lf-accent', theme.accent);
  set('--lf-accent-soft', theme.accentSoft);
  set('--lf-selection-bg', theme.selectionBg);
  set('--lf-caret', theme.caret);
  set('--lf-shadow', theme.shadow);

  root.setAttribute('data-theme', theme.mode);
  root.setAttribute('data-theme-id', theme.id);
}

/**
 * Expand the 6 Custom fields into a full theme. Editor ink/muted are derived
 * from the editor background's luminance so the page stays readable regardless
 * of the chosen UI text colour (Part 7).
 */
export function customToTheme(fields: CustomThemeFields): WhiteboardTheme {
  const dark = isDark(fields.appBg);
  const editorDark = isDark(fields.editorBg);
  return {
    id: 'custom',
    name: 'Custom',
    mode: dark ? 'dark' : 'light',
    appBg: fields.appBg,
    panelBg: fields.appBg,
    editorBg: fields.editorBg,
    text: fields.text,
    mutedText: fields.mutedText,
    editorText: editorDark ? '#f1ece4' : '#23211c',
    editorMuted: editorDark ? '#8a847d' : '#a8a193',
    border: fields.border,
    accent: fields.accent,
    accentSoft: rgba(fields.accent, 0.16),
    selectionBg: rgba(fields.accent, 0.22),
    editorSelection: rgba(fields.accent, 0.18),
    caret: fields.accent,
    shadow: dark
      ? '0 1px 3px rgba(0, 0, 0, 0.45)'
      : '0 1px 3px rgba(0, 0, 0, 0.08), 0 10px 30px rgba(0, 0, 0, 0.06)',
  };
}
