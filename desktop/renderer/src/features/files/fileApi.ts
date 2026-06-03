/**
 * Typed access to the Electron file bridge, with a graceful fallback when the
 * app runs in a plain browser (Vite dev) where there is no native bridge.
 *
 * The bridge type is augmented onto the existing `LogosForgeBridge` (the file +
 * menu methods are optional, so the backend fallback still satisfies the type).
 */

import { bridge } from '../../api/backend';
import type { FilesBridge } from './fileTypes';

declare module '../../api/backend' {
  interface LogosForgeBridge {
    files?: FilesBridge;
    onMenuFile?(cb: (action: string) => void): () => void;
    onMenuView?(cb: (action: string) => void): () => void;
    onMenuOpenRecent?(cb: (p: string) => void): () => void;
  }
}

export const filesAvailable = (): boolean => !!bridge.files;

const fallback: FilesBridge = {
  async open() {
    return null;
  },
  async openPath() {
    return null;
  },
  async save() {
    return { ok: false, error: 'File system unavailable (not running in Electron).' };
  },
  async saveAs() {
    return null;
  },
  async confirmUnsaved() {
    return 'dont-save';
  },
  async getRecent() {
    return [];
  },
  setDirty() {
    /* no-op outside Electron */
  },
  onSaveBeforeClose() {
    return () => {};
  },
  sendCloseResult() {
    /* no-op outside Electron */
  },
};

export const fileApi: FilesBridge = bridge.files ?? fallback;

export function onMenuFile(cb: (action: string) => void): () => void {
  return bridge.onMenuFile?.(cb) ?? (() => {});
}
export function onMenuView(cb: (action: string) => void): () => void {
  return bridge.onMenuView?.(cb) ?? (() => {});
}
export function onMenuOpenRecent(cb: (p: string) => void): () => void {
  return bridge.onMenuOpenRecent?.(cb) ?? (() => {});
}
