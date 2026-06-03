/**
 * Native application menu (main process). Built after the app is ready and set
 * via `Menu.setApplicationMenu`.
 *
 *  - File ops use real accelerators → they post `menu:file` to the renderer.
 *  - Close uses the `close` role (Cmd/Ctrl+W) so it routes through the window's
 *    close guard, which runs the unsaved-changes prompt.
 *  - View toggles use `registerAccelerator: false`, so the SAME shortcut is
 *    handled by the renderer's keydown (no double-fire) while the item stays
 *    clickable.
 *  - Cmd/Ctrl+K is intentionally absent — it stays Logos.
 */

import { BrowserWindow, Menu, type MenuItemConstructorOptions } from 'electron';
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

  const template: MenuItemConstructorOptions[] = [
    ...(isMac ? [{ role: 'appMenu' as const }] : []),
    {
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
        // Cmd/Ctrl+W closes the window → the close guard runs the save prompt.
        { role: 'close', accelerator: 'CmdOrCtrl+W' },
        ...(isMac ? [] : ([{ type: 'separator' }, { role: 'quit' }] as MenuItemConstructorOptions[])),
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
    },
  ];

  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}
