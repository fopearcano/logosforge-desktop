/**
 * Typed access to the Electron import/export bridge (flat top-level functions,
 * same pattern as fileApi). Degrades to a safe error result in a plain browser.
 */

import type { DialogFilter } from './importExportFormats';
import type { OpenResult, SaveResult } from './fileTypes';

export type ImportMode = 'replace' | 'append' | 'cancel';

interface IeBridge {
  importOpen?(filters: DialogFilter[]): Promise<OpenResult>;
  importConfirmMode?(): Promise<ImportMode>;
  exportSave?(content: string, suggestedName: string, filters: DialogFilter[]): Promise<SaveResult>;
}

function lf(): IeBridge | undefined {
  if (typeof window === 'undefined') return undefined;
  return (window as unknown as { logosforge?: IeBridge }).logosforge;
}

const NO_BRIDGE = 'File system unavailable — the app is not running inside Electron.';

export const importExportAvailable = (): boolean => typeof lf()?.importOpen === 'function';

export function importOpen(filters: DialogFilter[]): Promise<OpenResult> {
  return lf()?.importOpen?.(filters) ?? Promise.resolve({ ok: false, error: NO_BRIDGE });
}

export function importConfirmMode(): Promise<ImportMode> {
  return lf()?.importConfirmMode?.() ?? Promise.resolve('cancel');
}

export function exportSave(
  content: string,
  suggestedName: string,
  filters: DialogFilter[],
): Promise<SaveResult> {
  return lf()?.exportSave?.(content, suggestedName, filters) ?? Promise.resolve({ ok: false, error: NO_BRIDGE });
}
