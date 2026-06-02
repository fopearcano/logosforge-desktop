/**
 * Writing-mode behavior registry.
 *
 * Each mode defines how the editor behaves/looks. Screenplay uses Fountain
 * inference + a monospaced surface; the other modes are prose-first with a
 * Markdown-heading outline. The `measure` is the readable text-column width
 * inside the full-panel writing surface (mode-aware layout — not one-size CSS).
 *
 * Note: the backend's Writing Modes are the five narrative engines
 * (novel/screenplay/graphic_novel/stage_script/series). "Notes"/"Scene" are
 * StoryPlanner *section* concepts, not writing modes here; prose entries are
 * pre-registered so they work if such modes are ever added.
 */

export interface ModeBehavior {
  id: string;
  displayName: string;
  /** Editor typography family. */
  font: 'mono' | 'serif';
  /** Apply Fountain inference + screenplay keyboard behavior. */
  fountain: boolean;
  /** Outline extraction strategy. */
  outline: 'fountain' | 'headings';
  placeholder: string;
  /** Readable text-column width within the (full-panel) writing surface. */
  measure: string;
  /** Hint for the Logos assistant context (used later). */
  assistantContext: string;
}

function prose(id: string, displayName: string, placeholder: string, measure = '48rem'): ModeBehavior {
  return {
    id,
    displayName,
    font: 'serif',
    fountain: false,
    outline: 'headings',
    placeholder,
    measure,
    assistantContext: 'prose',
  };
}

const REGISTRY: Record<string, ModeBehavior> = {
  screenplay: {
    id: 'screenplay',
    displayName: 'Screenplay',
    font: 'mono',
    fountain: true,
    outline: 'fountain',
    placeholder: 'INT. / EXT. — start your scene…',
    measure: '63ch', // screenplay-safe text column (Courier)
    assistantContext: 'screenplay',
  },
  novel: prose('novel', 'Novel', 'Start writing your novel…'),
  graphic_novel: prose('graphic_novel', 'Graphic Novel', 'Describe the page…'),
  // Stage scripts are script-like but full stage formatting is a TODO; treat as
  // prose-with-headings for now (monospaced surface, no Fountain inference).
  stage_script: {
    id: 'stage_script',
    displayName: 'Stage Script',
    font: 'mono',
    fountain: false,
    outline: 'headings',
    placeholder: 'Start your scene…',
    measure: '60ch',
    assistantContext: 'stage',
  },
  series: prose('series', 'Series', 'Start your episode…'),
  // Forward-compat prose foundations (not currently exposed as writing modes).
  notes: prose('notes', 'Notes', 'Jot down a note…', '56rem'),
  scene: prose('scene', 'Scene', 'Draft this scene…', '50rem'),
};

const DEFAULT = prose('novel', 'Novel', 'Start writing…');

export function modeBehavior(mode: string | null | undefined): ModeBehavior {
  return (mode && REGISTRY[mode]) || DEFAULT;
}
