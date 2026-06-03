import { app, BrowserWindow, ipcMain, Menu, type MenuItemConstructorOptions } from 'electron';
import * as path from 'node:path';

import { BackendManager, type BackendStatus } from './backend-manager';
import { clearRecents, getRecents, initRecents, registerFileIpc } from './file-manager';

const DEV_SERVER_URL = process.env.VITE_DEV_SERVER_URL ?? 'http://localhost:5173';
const isProd = app.isPackaged || process.argv.includes('--prod');

let mainWindow: BrowserWindow | null = null;
const backend = new BackendManager();

function createWindow(): void {
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

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

/**
 * Native application menu. File ops use real accelerators (handled here →
 * renderer); View toggles set `registerAccelerator: false` so the SAME shortcut
 * is handled by the renderer's keydown (no double-fire) while the menu item is
 * still clickable. Cmd/Ctrl+K is intentionally absent — it stays Logos.
 */
function buildMenu(recents: string[]): Menu {
  const isMac = process.platform === 'darwin';
  const send = (channel: string, payload?: unknown) => mainWindow?.webContents.send(channel, payload);

  const recentItems: MenuItemConstructorOptions[] = recents.length
    ? recents.map((p) => ({ label: path.basename(p), click: () => send('menu:open-recent', p) }))
    : [{ label: 'No Recent Files', enabled: false }];

  const template: MenuItemConstructorOptions[] = [
    ...(isMac ? [{ role: 'appMenu' as const }] : []),
    {
      label: 'File',
      submenu: [
        { label: 'New', accelerator: 'CmdOrCtrl+N', click: () => send('menu:file', 'new') },
        { label: 'Open…', accelerator: 'CmdOrCtrl+O', click: () => send('menu:file', 'open') },
        {
          label: 'Open Recent',
          submenu: [
            ...recentItems,
            { type: 'separator' },
            { label: 'Clear Recent', click: () => void clearRecents() },
          ],
        },
        { type: 'separator' },
        { label: 'Save', accelerator: 'CmdOrCtrl+S', click: () => send('menu:file', 'save') },
        { label: 'Save As…', accelerator: 'CmdOrCtrl+Shift+S', click: () => send('menu:file', 'saveAs') },
        { type: 'separator' },
        { label: 'Close', click: () => send('menu:file', 'close') },
        { type: 'separator' },
        isMac ? { role: 'close' } : { role: 'quit' },
      ],
    },
    {
      label: 'Edit',
      submenu: [
        { role: 'undo' },
        { role: 'redo' },
        { type: 'separator' },
        { role: 'cut' },
        { role: 'copy' },
        { role: 'paste' },
        { role: 'selectAll' },
      ],
    },
    {
      label: 'View',
      submenu: [
        {
          label: 'Toggle Top Panel',
          accelerator: 'CmdOrCtrl+Shift+T',
          registerAccelerator: false,
          click: () => send('menu:view', 'toggleTopPanel'),
        },
        {
          label: 'Toggle Outline',
          accelerator: 'CmdOrCtrl+Shift+O',
          registerAccelerator: false,
          click: () => send('menu:view', 'toggleOutline'),
        },
        {
          label: 'Focus Mode',
          accelerator: 'CmdOrCtrl+Shift+D',
          registerAccelerator: false,
          click: () => send('menu:view', 'focusMode'),
        },
        { type: 'separator' },
        { label: 'Toggle Theme', click: () => send('menu:view', 'toggleTheme') },
        { type: 'separator' },
        { role: 'reload' },
        { role: 'toggleDevTools' },
        { role: 'togglefullscreen' },
      ],
    },
  ];

  return Menu.buildFromTemplate(template);
}

function refreshMenu(recents: string[]): void {
  Menu.setApplicationMenu(buildMenu(recents));
}

app.whenReady().then(() => {
  ipcMain.handle('backend:get-status', () => backend.getStatus());

  // Push backend status changes to the renderer (it also pulls once on mount).
  backend.onStatus((status: BackendStatus) => {
    mainWindow?.webContents.send('backend:status', status);
  });

  // File management (native dialogs + disk IO + recent files menu).
  registerFileIpc(() => mainWindow);
  refreshMenu(getRecents());
  initRecents((recents) => refreshMenu(recents));

  createWindow();
  void backend.start();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('before-quit', () => {
  backend.stop();
});
