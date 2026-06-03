/**
 * Typed access to the Electron file bridge. Resolved LAZILY from
 * `window.logosforge` on each call (never captured at module-load), so it is
 * robust to preload/init ordering, and degrades to a safe no-op in a plain
 * browser (Vite dev) where there is no native bridge.
 */

import type { FilesBridge } from './fileTypes';

interface Bridge {
  files?: FilesBridge;
  onMenuFile?(cb: (action: string) => void): () => void;
  onMenuView?(cb: (action: string) => void): () => void;
  onMenuOpenRecent?(cb: (p: string) => void): () => void;
}

function lf(): Bridge | undefined {
  return (window as unknown as { logosforge?: Bridge }).logosforge;
}
function files(): FilesBridge | undefined {
  return lf()?.files;
}

export const filesAvailable = (): boolean => !!files();

/** Stable façade — each method resolves the live bridge when invoked. */
export const fileApi: FilesBridge = {
  open: () => files()?.open() ?? Promise.resolve(null),
  openPath: (p) => files()?.openPath(p) ?? Promise.resolve(null),
  save: (p, content) =>
    files()?.save(p, content) ??
    Promise.resolve({ ok: false, error: 'File system unavailable (not running in Electron).' }),
  saveAs: (suggestedName, content) => files()?.saveAs(suggestedName, content) ?? Promise.resolve(null),
  confirmUnsaved: (message) => files()?.confirmUnsaved(message) ?? Promise.resolve('dont-save'),
  getRecent: () => files()?.getRecent() ?? Promise.resolve([]),
  setDirty: (dirty) => files()?.setDirty(dirty),
  onSaveBeforeClose: (cb) => files()?.onSaveBeforeClose(cb) ?? (() => {}),
  sendCloseResult: (ok) => files()?.sendCloseResult(ok),
};

export function onMenuFile(cb: (action: string) => void): () => void {
  return lf()?.onMenuFile?.(cb) ?? (() => {});
}
export function onMenuView(cb: (action: string) => void): () => void {
  return lf()?.onMenuView?.(cb) ?? (() => {});
}
export function onMenuOpenRecent(cb: (p: string) => void): () => void {
  return lf()?.onMenuOpenRecent?.(cb) ?? (() => {});
}
