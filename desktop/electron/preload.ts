import { contextBridge, ipcRenderer, type IpcRendererEvent } from 'electron';

import type { BackendStatus } from './backend-manager';
import type { OpenResult, SaveChoice, SaveResult } from './file-manager';

export interface FilesApi {
  /** Native Open dialog → { ok, canceled, filePath, fileName, content }. */
  open(): Promise<OpenResult>;
  /** Native Save dialog → write `content`; returns the chosen path. */
  saveAs(content: string, suggestedName: string): Promise<SaveResult>;
  /** Write `content` to an existing path (Save). */
  saveToPath(filePath: string, content: string): Promise<SaveResult>;
  /** Native "Save changes?" prompt → 'save' | 'dont-save' | 'cancel'. */
  confirmSaveChanges(reason?: string): Promise<SaveChoice>;
  /** Report modified state to main (drives the close/quit save prompt). */
  setDirty(dirty: boolean): void;
  /** Main asks the renderer to save during a close; reply via sendCloseResult. */
  onSaveBeforeClose(cb: () => void): () => void;
  /** Tell main whether the save-before-close succeeded (true ⇒ proceed to close). */
  sendCloseResult(ok: boolean): void;
}

export interface LogosForgeApi {
  getBackendStatus(): Promise<BackendStatus>;
  onBackendStatus(cb: (status: BackendStatus) => void): () => void;
  files: FilesApi;
  /** Native File-menu actions: 'new' | 'open' | 'save' | 'save-as'. */
  onMenuFile(cb: (action: string) => void): () => void;
  /** Native View-menu actions. */
  onMenuView(cb: (action: string) => void): () => void;
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
    open: () => ipcRenderer.invoke('file:open-dialog'),
    saveAs: (content, suggestedName) =>
      ipcRenderer.invoke('file:save-dialog', { content, currentPath: null, suggestedName }),
    saveToPath: (filePath, content) => ipcRenderer.invoke('file:save-to-path', { filePath, content }),
    confirmSaveChanges: (reason) => ipcRenderer.invoke('file:confirm-save-changes', { reason }),
    setDirty: (dirty) => ipcRenderer.send('file:set-dirty', dirty),
    onSaveBeforeClose: (cb) => subscribe<void>('app:save-before-close', () => cb()),
    sendCloseResult: (ok) => ipcRenderer.send('app:close-result', ok),
  },

  onMenuFile: (cb) => subscribe<string>('menu:file', cb),
  onMenuView: (cb) => subscribe<string>('menu:view', cb),
};

contextBridge.exposeInMainWorld('logosforge', api);
// Visible in the renderer DevTools console — confirms the bridge is live.
console.log('[preload] logosforge bridge exposed:', Object.keys(api), 'files:', Object.keys(api.files));
