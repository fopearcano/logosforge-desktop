# LogosForge Desktop — Whiteboard Free

A clean, writing-first desktop app: a blank writing sheet with the StoryPlanner
Writing Modes, a hideable Outline, lightweight PSYKE (story-bible) access, and an
inline Logos assistant — built as a local **FastAPI** backend behind an
**Electron + React + TypeScript** shell.

> Status: the **Whiteboard Free foundation is complete** (Phases 1–8). It is a
> working skeleton with offline placeholder AI/PSYKE; see
> [Known limitations](#known-limitations) and [`docs/PRO_TODO.md`](docs/PRO_TODO.md).

## Features

- **Writing sheet** — a minimal TipTap (ProseMirror) editor: paragraphs,
  headings (`#`/`##`/`###`), undo/redo, debounced autosave, save status.
- **Writing Modes** — the five StoryPlanner modes (Novel, Screenplay, Graphic
  Novel, Stage Script, Series), selectable; the editor reacts (e.g. Screenplay/
  Stage use a monospaced surface).
- **Outline** — a hideable left panel: a manual, persisted story outliner plus a
  read-only navigator derived from document headings (click-to-scroll).
- **Import / Export** — File → Import (Text, Markdown, Fountain, Final Draft) and
  File → Export (Text, Markdown, Fountain, LogosForge, JSON, HTML). Import is
  Replace/Append and marks the doc modified; Export is a copy (never clears the
  dirty flag). `.logosforge` is the self-contained JSON document format.
- **PSYKE** — a simple floating story-bible search panel (search → list →
  detail), pre-filled from the editor selection.
- **Logos** — an inline, Codex-style assistant in a floating box at the cursor
  (Ctrl/Cmd+K) with quick actions; applies results into the document.
- **Backend status** — live connection + API version in the status bar.

Not included (by design): dashboard, project hub, timeline, graph, analytics,
Pro dockable workspace, advanced HUD visuals.

## Structure

| Path | What it is |
|---|---|
| `backend/` | Local **FastAPI** backend (see [`backend/README.md`](backend/README.md)). |
| `desktop/` | **Electron + React + TypeScript** shell (see [`desktop/README.md`](desktop/README.md)). |
| `docs/PRO_TODO.md` | Pro features + deferred follow-ups (not implemented). |
| `docs/reference-ui/` | Visual mood-board references. |

## How to run

Backend requires **Python 3.10+** (developed/tested on **3.13**; see
`backend/.python-version`).

```bash
# 1) backend (one-time venv + deps)
cd backend
python3 -m venv .venv && source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r requirements.txt

# 2) desktop shell (separate terminal)
cd desktop
npm install
npm run dev          # launches Electron; auto-starts/connects the backend
```

In development the desktop app auto-starts the backend from `backend/.venv`; you
can also run it yourself (`uvicorn app.main:app --port 8777`) and the app will
connect to it.

## How to build

```bash
cd desktop
npm run typecheck    # electron + renderer
npm run build        # vite bundle (renderer/dist) + tsc (dist-electron)
npm run pack         # minimal packaging smoke: electron-builder --dir -> release/
```

`npm run pack` produces an **unpacked** Electron app (no installer, no bundled
backend) — a packaging smoke only. Production installers + a bundled backend
sidecar are a later milestone.

## Keyboard shortcuts

| Shortcut | Action |
|---|---|
| **Ctrl/Cmd + K** | Open the Logos inline assistant at the cursor |
| **Ctrl/Cmd + Shift + O** | Toggle the Outline panel |
| **Ctrl/Cmd + Shift + P** | Toggle the PSYKE panel |
| **Esc** | Close the PSYKE panel / Logos box |
| **Ctrl/Cmd + Z**, **Ctrl/Cmd + Shift + Z** | Undo / redo (editor) |
| `#`, `##`, `###` + space | Heading levels 1–3 (editor) |

## Tests

```bash
cd backend && ./.venv/bin/python -m pytest      # backend API tests
cd desktop && npm run typecheck                 # frontend type safety
```

## Known limitations

- **AI is a placeholder.** Logos returns offline, deterministic per-action text
  (no real model yet); PSYKE serves a few sample entries. Both have clean seams
  for wiring a provider/persistent store later.
- **Persistence is a single JSON file** at `~/.logosforge/whiteboard.json`
  (override with `LOGOSFORGE_DATA_DIR`); it survives backend/Electron restarts.
  Multi-document / per-project storage is a follow-up.
- **Editor is plain-text per block** — no inline marks/lists yet (kept honest so
  what you see is exactly what is saved).
- **Packaging is shell-only** — the Python backend is not yet bundled into the
  packaged app; in development the app launches it from `backend/`.
- The GUI is verified by typecheck/build + backend integration tests; visual
  rendering is validated on a real desktop.

## Next milestones

See [`docs/PRO_TODO.md`](docs/PRO_TODO.md). Nearest foundation follow-ups:

1. Wire a real AI provider (local-first) into Logos/PSYKE, with streaming.
2. Per-project SQLite persistence + canonical ProseMirror JSON + a real PSYKE store.
3. Production packaging: bundle the backend sidecar + signed installers.
