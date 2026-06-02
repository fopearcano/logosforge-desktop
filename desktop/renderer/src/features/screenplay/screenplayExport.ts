/**
 * Export/preview helpers (pure, foundation). Notes ([[ … ]]) and boneyard
 * (/* … *\/) are excluded from any future preview/export — they stay in the
 * document but are stripped here.
 */

const BONEYARD = /\/\*[\s\S]*?\*\//g;
const NOTE = /\[\[[\s\S]*?\]\]/g;

/** Remove notes + boneyard for preview/export (the editor keeps the raw text). */
export function stripForExport(text: string): string {
  return text.replace(BONEYARD, '').replace(NOTE, '');
}
