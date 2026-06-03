/** File-document state shape + the window-title derivation (pure, testable). */

import type { FileStatus } from './fileTypes';

export interface FileState {
  /** Absolute path on disk, or null for an unsaved "Untitled" document. */
  filePath: string | null;
  /** Display name (basename, or "Untitled"). */
  fileName: string;
  /** Modified since the last explicit save/open/new. */
  dirty: boolean;
  status: FileStatus;
}

export const INITIAL_FILE_STATE: FileState = {
  filePath: null,
  fileName: 'Untitled',
  dirty: false,
  status: 'saved',
};

/** "LogosForge Whiteboard — name.fountain *" (the `*` marks unsaved changes). */
export function windowTitle(fileName: string, dirty: boolean): string {
  return `LogosForge Whiteboard — ${fileName}${dirty ? ' *' : ''}`;
}
