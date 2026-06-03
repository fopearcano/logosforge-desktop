/**
 * Native application menu (main process). Built explicitly (not via the
 * `appMenu` shortcut role) so the macOS menu bar reliably shows the full
 * App + File menus, and set via `Menu.setApplicationMenu` after the app is ready.
 *
 *  - File ops post `menu:file` to the renderer (one shared action pathway).
 *  - Close Window uses the `close` role (Cmd/Ctrl+W) → it routes through the
 *    window close guard, which runs the unsaved-changes prompt.
 *  - View toggles use `registerAccelerator: false`, so the SAME shortcut is
 *    handled by the renderer's keydown (no double-fire) while staying clickable.
 *  - Cmd/Ctrl+K is intentionally absent — it stays Logos.
 */

import { app, BrowserWindow, Menu, type MenuItemConstructorOptions } from 'electron';
import * as path from 'node:path';

import { clearRecents } from './file-manager';

interface MenuDeps {
  getWindow: () => BrowserWindow | null;
  recents: string[];
}

export function setAppMenu({ getWindow, recents }: MenuDeps): void {
  const isMac = process.platform === 'darwin';
  const emit = (channel: string, payload?: unknown) => getWindow()?.webContents.send(channel, payload);

  const recentItems: MenuItemConstructorOptions[] = recents.length
    ? recents.map((p) => ({ label: path.basename(p), click: () => emit('menu:open-recent', p) }))
    : [{ label: 'No Recent Files', enabled: false }];

  // macOS App menu (About / Services / Hide / Quit) — explicit, not role:appMenu.
  const appMenu: MenuItemConstructorOptions = {
    label: app.name,
    submenu: [
      { role: 'about' },
      { type: 'separator' },
      { role: 'services' },
      { type: 'separator' },
      { role: 'hide' },
      { role: 'hideOthers' },
      { role: 'unhide' },
      { type: 'separator' },
      { role: 'quit' },
    ],
  };

  const fileMenu: MenuItemConstructorOptions = {
    label: 'File',
    submenu: [
      { label: 'New', accelerator: 'CmdOrCtrl+N', click: () => emit('menu:file', 'new') },
      { label: 'Open…', accelerator: 'CmdOrCtrl+O', click: () => emit('menu:file', 'open') },
      {
        label: 'Open Recent',
        submenu: [
          ...recentItems,
          { type: 'separator' },
          { label: 'Clear Recent', click: () => void clearRecents() },
        ],
      },
      { type: 'separator' },
      { label: 'Save', accelerator: 'CmdOrCtrl+S', click: () => emit('menu:file', 'save') },
      { label: 'Save As…', accelerator: 'CmdOrCtrl+Shift+S', click: () => emit('menu:file', 'saveAs') },
      { type: 'separator' },
      { role: 'close', label: 'Close Window' }, // Cmd/Ctrl+W → window close guard
      ...((isMac ? [] : [{ type: 'separator' }, { role: 'quit' }]) as MenuItemConstructorOptions[]),
    ],
  };

  const editMenu: MenuItemConstructorOptions = {
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
  };

  const viewMenu: MenuItemConstructorOptions = {
    label: 'View',
    submenu: [
      {
        label: 'Toggle Top Panel',
        accelerator: 'CmdOrCtrl+Shift+T',
        registerAccelerator: false,
        click: () => emit('menu:view', 'toggleTopPanel'),
      },
      {
        label: 'Toggle Outline',
        accelerator: 'CmdOrCtrl+Shift+O',
        registerAccelerator: false,
        click: () => emit('menu:view', 'toggleOutline'),
      },
      {
        label: 'Focus Mode',
        accelerator: 'CmdOrCtrl+Shift+D',
        registerAccelerator: false,
        click: () => emit('menu:view', 'focusMode'),
      },
      { type: 'separator' },
      { label: 'Toggle Theme', click: () => emit('menu:view', 'toggleTheme') },
      { type: 'separator' },
      { role: 'reload' },
      { role: 'toggleDevTools' },
      { role: 'togglefullscreen' },
    ],
  };

  const windowMenu: MenuItemConstructorOptions = {
    label: 'Window',
    role: 'windowMenu',
  };

  const template: MenuItemConstructorOptions[] = [
    ...(isMac ? [appMenu] : []),
    fileMenu,
    editMenu,
    viewMenu,
    ...(isMac ? [windowMenu] : []),
  ];

  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}
