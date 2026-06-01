# LogosForge Desktop — Whiteboard Free

A clean, writing-first desktop app. This repository is being built in small,
verifiable milestones.

## Structure

| Path | What it is |
|---|---|
| `backend/` | Minimal local **FastAPI** backend (health, version, whiteboard, writing-modes, outline, PSYKE/Logos stubs, `/ws/events`). See [`backend/README.md`](backend/README.md). |
| `desktop/` | Minimal **Electron + React + TypeScript** desktop shell that loads the UI and connects to the backend. See [`desktop/README.md`](desktop/README.md). |
| `docs/reference-ui/` | Visual mood-board references for the app's aesthetic. |

## Quick start

```bash
# 1) backend
cd backend
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt

# 2) desktop shell (separate terminal)
cd desktop
npm install
npm run dev          # launches Electron; auto-starts/connects the backend
```

## Scope

In scope: writing sheet, Writing Modes, hideable outline, lightweight PSYKE,
inline Logos assistant, minimal backend status, minimal shell.

Out of scope (Pro): dashboard, project hub, timeline, graph, analytics, Pro
dockable workspace, advanced HUD visuals.
