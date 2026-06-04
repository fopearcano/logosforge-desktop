/**
 * Typed access to the Electron file bridge. Resolved LAZILY from
 * `window.logosforge` on each call (never captured at module-load), so it is
 * robust to preload/init ordering, and degrades to a safe error result in a
 * plain browser (Vite dev) where there is no native bridge.
 *
 * Includes diagnostic logging (DevTools console) so the renderer→preload→main
 * chain can be traced when dialogs misbehave.
 */

import type { FilesBridge } from './fileTypes';

interface Bridge {
  files?: FilesBridge;
  onMenuFile?(cb: (action: string) => void): () => void;
  onMenuView?(cb: (action: string) => void): () => void;
}

function lf(): Bridge | undefined {
  if (typeof window === 'undefined') return undefined;
  return (window as unknown as { logosforge?: Bridge }).logosforge;
}
function files(): FilesBridge | undefined {
  return lf()?.files;
}

export const filesAvailable = (): boolean => !!files();

// One-time startup diagnostic: shows whether the native bridge reached the page.
console.log(
  '[files] bridge available:',
  filesAvailable(),
  filesAvailable() ? Object.keys(files() as object) : '(running without Electron bridge)',
);

const NO_BRIDGE = 'File system unavailable — the app is not running inside Electron.';

export const fileApi: FilesBridge = {
  open: () => {
    console.log('[files] open() called');
    return files()?.open() ?? Promise.resolve({ ok: false, error: NO_BRIDGE });
  },
  saveAs: (content, suggestedName) => {
    console.log('[files] saveAs() called', suggestedName);
    return files()?.saveAs(content, suggestedName) ?? Promise.resolve({ ok: false, error: NO_BRIDGE });
  },
  saveToPath: (filePath, content) => {
    console.log('[files] saveToPath() called', filePath);
    return files()?.saveToPath(filePath, content) ?? Promise.resolve({ ok: false, error: NO_BRIDGE });
  },
  confirmSaveChanges: (reason) => files()?.confirmSaveChanges(reason) ?? Promise.resolve('dont-save'),
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
