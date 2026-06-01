import { contextBridge, ipcRenderer, type IpcRendererEvent } from 'electron';

import type { BackendStatus } from './backend-manager';

export interface LogosForgeApi {
  getBackendStatus(): Promise<BackendStatus>;
  onBackendStatus(cb: (status: BackendStatus) => void): () => void;
}

const api: LogosForgeApi = {
  getBackendStatus: () => ipcRenderer.invoke('backend:get-status'),
  onBackendStatus: (cb) => {
    const listener = (_event: IpcRendererEvent, status: BackendStatus) => cb(status);
    ipcRenderer.on('backend:status', listener);
    return () => {
      ipcRenderer.removeListener('backend:status', listener);
    };
  },
};

contextBridge.exposeInMainWorld('logosforge', api);
