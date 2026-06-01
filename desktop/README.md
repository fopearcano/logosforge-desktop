# LogosForge Whiteboard — Desktop Shell

Minimal **Electron + React + TypeScript** desktop shell for Whiteboard Free. It
opens a window, loads the React UI, starts (or connects to) the local FastAPI
backend, checks `/health`, and shows the backend status + API version above a
blank placeholder whiteboard area.

> Phase 2 foundation — shell only. No real editor and no Pro features yet.

## Layout

```
desktop/
├── electron/
│   ├── main.ts            # window + app lifecycle, wires backend status to the UI
│   ├── preload.ts         # contextBridge — exposes a tiny, typed IPC surface
│   └── backend-manager.ts # start/connect backend, poll /health, report status
├── renderer/
│   ├── src/
│   │   ├── main.tsx
│   │   ├── App.tsx
│   │   ├── api/backend.ts # typed bridge to the main process (+ browser fallback)
│   │   ├── components/    # StatusBar, Whiteboard placeholder
│   │   └── styles/
│   ├── index.html
│   └── vite.config.ts
└── package.json
```

## Prerequisites

- Node.js 18+ and npm
- The backend from `../backend` (Python 3.10+). In development the desktop app
  auto-starts it using `../backend/.venv` if present.

## 1. Install frontend dependencies

```bash
cd desktop
npm install
```

## 2. Run the backend

The desktop app will **auto-start** the backend in development (it looks for
`../backend/.venv`), so the one-time setup is just creating that venv:

```bash
cd ../backend
python3 -m venv .venv
source .venv/bin/activate            # Windows: .venv\Scripts\activate
pip install -r requirements.txt
```

You can also run it yourself; the app will detect and connect to it:

```bash
# from backend/, with the venv active
uvicorn app.main:app --host 127.0.0.1 --port 8777
```

Override host/port with `LOGOSFORGE_HOST` / `LOGOSFORGE_PORT` (defaults
`127.0.0.1:8777`).

## 3. Run the Electron app

```bash
cd desktop
npm run dev
```

This starts the Vite dev server (renderer) and launches Electron once the dev
server is ready. The backend manager connects to a running backend or starts one
from `../backend`, polls `/health`, and reports status to the window.

### Production preview (optional)

```bash
npm run preview     # builds the renderer + electron, then runs with --prod
```

### Type-check

```bash
npm run typecheck
```

## What you should see

- Window titled **LogosForge Whiteboard**.
- A bottom status bar: a colored dot + `Backend: Connecting… / Connected /
  Unavailable`, and `API v1.0.0 · core 0.1.0` once connected.
- A central **writing sheet** (the TipTap editor) with a save indicator
  (`Saving… / Saved / Save failed`) at the top-right.

## Editor (Phase 3)

The writing surface is a [TipTap](https://tiptap.dev) (ProseMirror) editor — the
editor technology chosen in the architecture report — under
`renderer/src/features/whiteboard/`:

| File | Role |
|---|---|
| `WhiteboardPage.tsx` | Composes load/save state + editor + save indicator; loading/error states. |
| `WhiteboardEditor.tsx` | The TipTap editor + block ↔ ProseMirror mapping. |
| `useWhiteboardDocument.ts` | Loads `GET /api/whiteboard`, autosaves via `PUT /api/whiteboard` (700 ms debounce), tracks save status. |
| `whiteboardApi.ts` | Frontend HTTP client for the whiteboard endpoints. |
| `types.ts` | Shared DTO types. |

It is intentionally minimal — a blank sheet with **paragraphs, headings
(`#` / `##` / `###`), and undo/redo**. Inline marks (bold/italic) and lists are
off for now because the backend persists plain text per block; richer content
(canonical ProseMirror JSON) is a later milestone, so **what you see is exactly
what is saved**. The editor loads once the backend reports connected and
autosaves on edit.

## Notes & scope

- The backend manager stops the backend on app close **only if the app started
  it** (an externally-run backend is left alone).
- Production packaging (electron-builder) and bundling a frozen backend are a
  later milestone; `--prod` here just loads the built renderer from disk.
- Out of scope (Pro): dashboard, project hub, timeline, graph, analytics, Pro
  dockable workspace, advanced HUD visuals.
