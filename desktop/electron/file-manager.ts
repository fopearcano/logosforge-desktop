/**
 * Main-process file management: native open/save dialogs, disk read/write, an
 * unsaved-changes prompt, and a small recent-files store. The renderer never
 * touches the filesystem — it goes through these IPC handlers (contextIsolation
 * + sandbox stay on).
 *
 * Relationship to backend autosave: the backend keeps the live session draft
 * (autosave); these handlers write/read user-chosen files on disk. Opening a
 * file loads its text into the editor, which then autosaves to the backend too.
 */

import { BrowserWindow, dialog, ipcMain, app } from 'electron';
import { promises as fs } from 'node:fs';
import * as path from 'node:path';

const MAX_RECENTS = 8;
const recentsFile = () => path.join(app.getPath('userData'), 'recent-files.json');

// Save dialog: one filter per writable format (the first is the default).
const SAVE_FILTERS = [
  { name: 'Fountain Screenplay', extensions: ['fountain'] },
  { name: 'Markdown', extensions: ['md'] },
  { name: 'Plain Text', extensions: ['txt'] },
  { name: 'LogosForge', extensions: ['logosforge'] },
];
const OPEN_FILTERS = [
  { name: 'Whiteboard Documents', extensions: ['fountain', 'txt', 'md', 'logosforge'] },
  { name: 'All Files', extensions: ['*'] },
];

let recents: string[] = [];
let notifyRecents: (r: string[]) => void = () => {};

export interface OpenedDoc {
  path: string;
  content: string;
}

export function getRecents(): string[] {
  return recents;
}

/** Load persisted recents and subscribe to changes (used to rebuild the menu). */
export function initRecents(onChange: (r: string[]) => void): void {
  notifyRecents = onChange;
  fs.readFile(recentsFile(), 'utf8')
    .then((raw) => {
      const parsed = JSON.parse(raw) as unknown;
      recents = Array.isArray(parsed) ? parsed.filter((p): p is string => typeof p === 'string') : [];
      notifyRecents(recents);
    })
    .catch(() => {
      recents = [];
    });
}

async function persistRecents(): Promise<void> {
  try {
    await fs.writeFile(recentsFile(), JSON.stringify(recents), 'utf8');
  } catch {
    /* best effort */
  }
}

async function addRecent(p: string): Promise<void> {
  recents = [p, ...recents.filter((x) => x !== p)].slice(0, MAX_RECENTS);
  notifyRecents(recents);
  await persistRecents();
}

export async function clearRecents(): Promise<void> {
  recents = [];
  notifyRecents(recents);
  await persistRecents();
}

async function readDoc(p: string): Promise<OpenedDoc | null> {
  try {
    const content = await fs.readFile(p, 'utf8');
    await addRecent(p);
    return { path: p, content };
  } catch {
    return null;
  }
}

/** Register the file IPC handlers. `getWindow` returns the active window. */
export function registerFileIpc(getWindow: () => BrowserWindow | null): void {
  ipcMain.handle('file:open', async (): Promise<OpenedDoc | null> => {
    const win = getWindow();
    if (!win) return null;
    const res = await dialog.showOpenDialog(win, {
      title: 'Open Document',
      properties: ['openFile'],
      filters: OPEN_FILTERS,
    });
    if (res.canceled || res.filePaths.length === 0) return null;
    return readDoc(res.filePaths[0]);
  });

  ipcMain.handle('file:open-path', async (_e, p: string): Promise<OpenedDoc | null> => readDoc(p));

  ipcMain.handle('file:save', async (_e, p: string, content: string) => {
    try {
      await fs.writeFile(p, content, 'utf8');
      await addRecent(p);
      return { ok: true as const };
    } catch (err) {
      return { ok: false as const, error: String(err) };
    }
  });

  ipcMain.handle('file:save-as', async (_e, suggestedName: string, content: string) => {
    const win = getWindow();
    if (!win) return null;
    const res = await dialog.showSaveDialog(win, {
      title: 'Save Document As',
      defaultPath: suggestedName,
      filters: SAVE_FILTERS,
    });
    if (res.canceled || !res.filePath) return null;
    try {
      await fs.writeFile(res.filePath, content, 'utf8');
      await addRecent(res.filePath);
      return { path: res.filePath };
    } catch (err) {
      return { path: '', error: String(err) };
    }
  });

  ipcMain.handle('file:confirm-unsaved', async (): Promise<'save' | 'dont-save' | 'cancel'> => {
    const win = getWindow();
    if (!win) return 'dont-save';
    const res = await dialog.showMessageBox(win, {
      type: 'warning',
      buttons: ['Save', "Don't Save", 'Cancel'],
      defaultId: 0,
      cancelId: 2,
      noLink: true,
      message: 'Save changes before continuing?',
      detail: 'Your document has unsaved changes that will be lost.',
    });
    return res.response === 0 ? 'save' : res.response === 1 ? 'dont-save' : 'cancel';
  });

  ipcMain.handle('file:get-recent', () => recents);
  ipcMain.handle('file:clear-recent', async () => {
    await clearRecents();
    return recents;
  });
}
