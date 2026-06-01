import { app, BrowserWindow, ipcMain } from 'electron';
import * as path from 'node:path';

import { BackendManager, type BackendStatus } from './backend-manager';

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

app.whenReady().then(() => {
  ipcMain.handle('backend:get-status', () => backend.getStatus());

  // Push backend status changes to the renderer (it also pulls once on mount).
  backend.onStatus((status: BackendStatus) => {
    mainWindow?.webContents.send('backend:status', status);
  });

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
