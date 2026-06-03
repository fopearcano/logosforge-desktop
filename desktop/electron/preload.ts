import { contextBridge, ipcRenderer, type IpcRendererEvent } from 'electron';

import type { BackendStatus } from './backend-manager';

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
export type UnsavedChoice = 'save' | 'dont-save' | 'cancel';

export interface FilesApi {
  open(): Promise<OpenedDoc | null>;
  openPath(p: string): Promise<OpenedDoc | null>;
  save(p: string, content: string): Promise<SaveResult>;
  saveAs(suggestedName: string, content: string): Promise<SaveAsResult | null>;
  confirmUnsaved(): Promise<UnsavedChoice>;
  getRecent(): Promise<string[]>;
}

export interface LogosForgeApi {
  getBackendStatus(): Promise<BackendStatus>;
  onBackendStatus(cb: (status: BackendStatus) => void): () => void;
  files: FilesApi;
  /** Native File-menu actions: 'new' | 'open' | 'save' | 'saveAs' | 'close'. */
  onMenuFile(cb: (action: string) => void): () => void;
  /** Native View-menu actions: 'toggleTopPanel' | 'toggleOutline' | 'focusMode' | 'toggleTheme'. */
  onMenuView(cb: (action: string) => void): () => void;
  /** A recent-file path chosen from the Open Recent submenu. */
  onMenuOpenRecent(cb: (p: string) => void): () => void;
}

function subscribe<T>(channel: string, cb: (payload: T) => void): () => void {
  const listener = (_event: IpcRendererEvent, payload: T) => cb(payload);
  ipcRenderer.on(channel, listener);
  return () => ipcRenderer.removeListener(channel, listener);
}

const api: LogosForgeApi = {
  getBackendStatus: () => ipcRenderer.invoke('backend:get-status'),
  onBackendStatus: (cb) => subscribe<BackendStatus>('backend:status', cb),

  files: {
    open: () => ipcRenderer.invoke('file:open'),
    openPath: (p) => ipcRenderer.invoke('file:open-path', p),
    save: (p, content) => ipcRenderer.invoke('file:save', p, content),
    saveAs: (suggestedName, content) => ipcRenderer.invoke('file:save-as', suggestedName, content),
    confirmUnsaved: () => ipcRenderer.invoke('file:confirm-unsaved'),
    getRecent: () => ipcRenderer.invoke('file:get-recent'),
  },

  onMenuFile: (cb) => subscribe<string>('menu:file', cb),
  onMenuView: (cb) => subscribe<string>('menu:view', cb),
  onMenuOpenRecent: (cb) => subscribe<string>('menu:open-recent', cb),
};

contextBridge.exposeInMainWorld('logosforge', api);
