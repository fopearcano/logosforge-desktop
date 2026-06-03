/** Shared types for desktop file management (renderer side). */

export type FileStatus = 'saved' | 'unsaved' | 'saving' | 'error';
export type UnsavedChoice = 'save' | 'dont-save' | 'cancel';

export interface OpenedDoc {
  path: string;
  content: string;
}
export interface SaveResult {
  ok: boolean;
  error?: string;
}
export interface SaveAsResult {
  path: string;
  error?: string;
}

/** The file IPC surface exposed by the Electron preload bridge. */
export interface FilesBridge {
  open(): Promise<OpenedDoc | null>;
  openPath(p: string): Promise<OpenedDoc | null>;
  save(p: string, content: string): Promise<SaveResult>;
  saveAs(suggestedName: string, content: string): Promise<SaveAsResult | null>;
  confirmUnsaved(): Promise<UnsavedChoice>;
  getRecent(): Promise<string[]>;
}
