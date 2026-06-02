/**
 * Export foundation (pure). Notes ([[ … ]]) and boneyard (/* … *​/) are excluded
 * from preview/export — they stay in the document but are stripped here.
 *
 * This is a *foundation*, not a production exporter: it serializes to raw
 * Fountain / plain text. PDF, Final Draft (.fdx), and Print are declared as
 * future targets (see `EXPORT_TARGETS`) so the UI + callers have a stable
 * boundary to build on later.
 */

import type { WhiteboardBlock } from '../whiteboard/types';
import type { FountainBlock } from './fountainTypes';

const BONEYARD = /\/\*[\s\S]*?\*\//g;
const NOTE = /\[\[[\s\S]*?\]\]/g;

/** Remove notes + boneyard for preview/export (the editor keeps the raw text). */
export function stripForExport(text: string): string {
  return text.replace(BONEYARD, '').replace(NOTE, '');
}

/** WhiteboardBlock[] → FountainBlock[] (heading nodes are Fountain Sections). */
export function toFountainBlocks(blocks: WhiteboardBlock[]): FountainBlock[] {
  return blocks.map((b) => ({
    text: b.text,
    isHeading: b.type === 'heading',
    level: b.level ?? 1,
  }));
}

/**
 * Serialize the document to raw Fountain text (lossless — markers, notes and
 * boneyard are preserved). Heading nodes are written as Fountain Sections (`#`).
 */
export function blocksToFountainText(blocks: WhiteboardBlock[]): string {
  return blocks
    .map((b) =>
      b.type === 'heading' ? `${'#'.repeat(Math.max(1, b.level ?? 1))} ${b.text}`.trimEnd() : b.text,
    )
    .join('\n');
}

export interface ExportTarget {
  id: string;
  label: string;
  /** Implemented now vs. a declared future boundary. */
  available: boolean;
  note?: string;
}

/** What export can do now, plus the boundaries reserved for later. */
export const EXPORT_TARGETS: ExportTarget[] = [
  { id: 'fountain', label: 'Export Fountain (.fountain)', available: true },
  { id: 'copy-fountain', label: 'Copy Fountain text', available: true },
  { id: 'copy-preview', label: 'Copy formatted preview', available: true },
  { id: 'pdf', label: 'Export PDF…', available: false, note: 'Planned' },
  { id: 'fdx', label: 'Export Final Draft (.fdx)…', available: false, note: 'Planned' },
  { id: 'print', label: 'Print…', available: false, note: 'Planned' },
];
