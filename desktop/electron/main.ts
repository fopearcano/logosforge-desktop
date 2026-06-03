import { app, BrowserWindow, ipcMain } from 'electron';
import * as path from 'node:path';

import { BackendManager, type BackendStatus } from './backend-manager';
import { confirmSavePrompt, getRecents, initRecents, registerFileIpc } from './file-manager';
import { setAppMenu } from './menu';

const DEV_SERVER_URL = process.env.VITE_DEV_SERVER_URL ?? 'http://localhost:5173';
const isProd = app.isPackaged || process.argv.includes('--prod');

let mainWindow: BrowserWindow | null = null;
const backend = new BackendManager();

// --- Unsaved-changes close/quit protection ---------------------------------
let isDirty = false; // reported by the renderer via file:set-dirty
let allowClose = false; // true once the user has confirmed closing
let isQuitting = false; // a real quit (Cmd/Ctrl+Q) is underway, not just a window close
let closePromptOpen = false; // guard against duplicate prompts
let pendingSave: ((ok: boolean) => void) | null = null;

/** Ask the renderer to save (it may show Save As); resolves with success. */
function requestRendererSave(): Promise<boolean> {
  const win = mainWindow;
  if (!win) return Promise.resolve(true);
  return new Promise((resolve) => {
    pendingSave = resolve;
    win.webContents.send('app:save-before-close');
  });
}

/** Run the save prompt; close (or resume quit) only if the user proceeds. */
async function handleCloseRequest(): Promise<void> {
  const win = mainWindow;
  if (!win || closePromptOpen) return;
  closePromptOpen = true;
  const choice = await confirmSavePrompt(win, 'Save changes before closing?');
  let proceed = choice === 'dont-save';
  if (choice === 'save') proceed = await requestRendererSave();
  closePromptOpen = false;

  if (!proceed) {
    isQuitting = false; // Cancel / failed save → stay open, abort any quit
    return;
  }
  allowClose = true;
  if (isQuitting) app.quit();
  else mainWindow?.close();
}

function createWindow(): void {
  // A fresh window starts clean + closable (the renderer re-reports dirty state).
  allowClose = false;
  isDirty = false;

  mainWindow = new BrowserWindow({
    width: 1100,
    height: 720,
    minWidth: 720,
    minHeight: 480,
    title: 'LogosForge Whiteboard',
    backgroundColor: '#0e0f13',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });

  if (isProd) {
    void mainWindow.loadFile(path.join(__dirname, '..', 'renderer', 'dist', 'index.html'));
  } else {
    void mainWindow.loadURL(DEV_SERVER_URL);
  }

  // Intercept window close (X button, Cmd/Ctrl+W, File → Close) when modified.
  mainWindow.on('close', (e) => {
    if (allowClose || !isDirty) return;
    e.preventDefault();
    isQuitting = false;
    void handleCloseRequest();
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(() => {
  ipcMain.handle('backend:get-status', () => backend.getStatus());
  backend.onStatus((status: BackendStatus) => {
    mainWindow?.webContents.send('backend:status', status);
  });

  // Renderer → main: dirty state, and the save-before-close result.
  ipcMain.on('file:set-dirty', (_e, dirty: boolean) => {
    isDirty = !!dirty;
  });
  ipcMain.on('app:close-result', (_e, ok: boolean) => {
    const resolve = pendingSave;
    pendingSave = null;
    resolve?.(!!ok);
  });

  // File management (native dialogs + disk IO) and the native menu.
  registerFileIpc(() => mainWindow);
  setAppMenu({ getWindow: () => mainWindow, recents: getRecents() });
  initRecents((recents) => setAppMenu({ getWindow: () => mainWindow, recents }));

  createWindow();
  void backend.start();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

// Quit (Cmd/Ctrl+Q, app.quit) — prompt before tearing the window down.
app.on('before-quit', (e) => {
  if (allowClose || !isDirty || !mainWindow) return;
  e.preventDefault();
  isQuitting = true;
  void handleCloseRequest();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('will-quit', () => {
  backend.stop();
});
