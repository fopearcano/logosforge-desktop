# Whiteboard Free — Local Testing Guide

How to run and test the current **LogosForge Whiteboard Free** phase locally —
the FastAPI backend, the backend test suite, and the Electron desktop app — plus
a manual checklist and troubleshooting.

> This phase is a working foundation. AI (Logos) and PSYKE are **offline
> placeholders**, and backend persistence is **in-memory** (resets on restart).
> See [Known limitations](#known-limitations) and [`PRO_TODO.md`](PRO_TODO.md).

---

## Prerequisites

- **Python 3.10+** (backend)
- **Node.js 18+** and **npm** (desktop app; Node 18+ is required for the smoke script's `fetch`)
- A desktop environment to display the Electron window (the GUI cannot run headless)

## Repository layout

```
backend/    FastAPI backend (app/, tests/)
desktop/    Electron + React + TypeScript app (electron/, renderer/)
scripts/    run-backend / test-backend helpers (.sh and .ps1)
docs/       this guide, PRO_TODO.md
```

---

## Backend setup

**macOS / Linux**
```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

**Windows (PowerShell)**
```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

## Frontend / Electron setup

The Electron app and the React renderer install together:

```bash
cd desktop
npm install
```

This also downloads the Electron binary (first install only).

---

## Run the backend only

Use the helper script (creates the venv + installs deps on first run):

```bash
scripts/run-backend.sh           # macOS / Linux
.\scripts\run-backend.ps1        # Windows (PowerShell)
```

…or run uvicorn directly with the venv active:

```bash
cd backend
uvicorn app.main:app --host 127.0.0.1 --port 8777 --reload
```

Then visit:
- Health: <http://127.0.0.1:8777/health>
- Interactive API docs: <http://127.0.0.1:8777/docs>

Override the port with `LOGOSFORGE_PORT` (the desktop app and smoke script honor
the same default, `8777`).

## Run the desktop app

```bash
cd desktop
npm run dev
```

This starts the Vite dev server and launches Electron once it is ready. In
development the app **auto-starts the backend** from `backend/.venv` (set it up
once via Backend setup above) — or it connects to a backend you started
yourself.

For a production-style preview (loads the built renderer, still unpackaged):

```bash
npm run preview
```

---

## Run the tests

### Backend (pytest)

```bash
scripts/test-backend.sh          # macOS / Linux
.\scripts\test-backend.ps1       # Windows (PowerShell)
```

…or directly:

```bash
cd backend && python -m pytest          # all tests
cd backend && python -m pytest -k smoke # just the API smoke
```

The suite covers `/health`, `/api/version`, `/api/whiteboard` (GET + PUT),
`/api/writing-modes`, `/api/outline`, `/api/psyke/search`, `/api/logos/inline`,
and the `/ws/events` WebSocket. `tests/test_smoke.py` is a single end-to-end
"is the whole API alive?" check.

### Frontend (type safety)

There is no UI test framework yet (no Playwright/Vitest), so `npm test` runs the
type checker — the available static check:

```bash
cd desktop
npm test          # == npm run typecheck (electron + renderer)
npm run build     # verify the renderer bundles and electron compiles
```

### Live API smoke (from the app's perspective)

With a backend **running**, verify every endpoint over real HTTP:

```bash
cd desktop
npm run smoke     # node scripts/smoke.mjs -> http://127.0.0.1:8777
```

It prints `[ok]/[FAIL]` per endpoint and exits non-zero on failure. If the
backend isn't running it tells you how to start it.

---

## Manual test checklist

### Backend API (backend running)

- [ ] `GET /health` returns `{ "status": "ok", ... }`
- [ ] `GET /api/version` returns name / version / `api_version`
- [ ] `GET /api/whiteboard` returns a document (`blocks`, `mode`, …)
- [ ] `PUT /api/whiteboard` with `{ "blocks": [...] }` saves and returns it
- [ ] `GET /api/writing-modes` returns 5 modes + `default_mode`
- [ ] `GET /api/outline` returns `items` (derived from headings)
- [ ] `GET /api/psyke/search?q=test` returns a `results` array
- [ ] `POST /api/logos/inline` returns `{ ok, output, provider, ... }`

(`npm run smoke` checks all of the above automatically.)

### Desktop app (`npm run dev`)

- [ ] Electron window opens, titled **LogosForge Whiteboard**
- [ ] React UI loads (no blank window / console errors)
- [ ] Status bar shows **Backend: Connected** and **API v1.0.0**
- [ ] Whiteboard editor loads and accepts typing
- [ ] Typing shows **Saving… → Saved** (autosave); reopening keeps the text
- [ ] **Outline** toggles via the `☰` button or **Ctrl/Cmd+Shift+O**; when hidden
      it fully disappears (no rail) and the editor expands
- [ ] Typing `# A heading` adds it to the Outline; clicking it scrolls there
- [ ] **Writing Mode** selector loads the 5 modes; switching to Screenplay makes
      the surface monospaced
- [ ] **PSYKE** opens via the `PSYKE` button or **Ctrl/Cmd+Shift+P**; searching
      `hero` or `city` returns results; clicking one shows a detail view; **Esc** closes
- [ ] **Logos** opens with **Ctrl/Cmd+K** as a floating box at the cursor; with
      text selected, **Connect** lists related PSYKE entries; **Replace/Insert**
      applies into the document; **Esc** closes
- [ ] No Pro surfaces appear (no dashboard/timeline/graph/analytics)

---

## Focused regression tests

### Layout test
1. Launch the app (`npm run dev`).
2. ✅ The **writing surface fills most of the main panel** — no tiny centered
   card/square floating in empty background.
3. ✅ Text flows naturally on the sheet: a readable centered column on a
   full-panel paper surface; clicking anywhere on the sheet starts writing.
4. ✅ **Screenplay** stays readable on the large surface (screenplay-safe column;
   clear scene-heading / character / dialogue / parenthetical formatting).
5. ✅ **Novel / Notes** use a broad, comfortable prose column on the full sheet.
6. ✅ Outline hide/show still works and the sheet re-centers when it is hidden.

### Persistence test
1. `npm run dev`; wait for **Backend: Connected**.
2. Type some text; wait for **Saved** in the status line.
3. Fully quit Electron, then reopen (`npm run dev`, or `npx electron .`).
4. ✅ The text is still there.
5. *(Backend restart)* Stop and restart the backend, reload the app — the text
   persists. Saved content lives at `~/.logosforge/whiteboard.json` (override the
   directory with `LOGOSFORGE_DATA_DIR`).

### UI theme test
1. Use the **☾ / ☀** button in the title bar to switch **Light** / **Dark**.
2. ✅ Light: soft light-gray app, white paper page, dark charcoal text, subtle shadow.
3. ✅ Dark: dark shell, dark *integrated* page, readable light text (no HUD styling).
4. ✅ Editor text stays readable and the Outline stays usable in both themes.
5. The choice persists across restarts.

### Screenplay inference test
Set **Mode → Screenplay**, then type:

```
INT. HOME - DAY

JOHN
Hello there.
(quietly)
This is a test.

CUT TO:
```

Expected (classification is automatic — no manual block cycling):
* `INT. HOME - DAY` → **Scene Heading** (uppercase, bold).
* `JOHN` → **Character**; `Hello there.` → **Dialogue** (indented unlike Action).
* `(quietly)` → **Parenthetical**; `This is a test.` → **Dialogue**.
* `CUT TO:` → **Transition** (right-aligned).
* The status line shows the inferred element at the cursor.

### Fountain structure test
Still in Screenplay mode, type:

```
# Act One

= Opening image
[[Need stronger hook]]
```

Expected: the **Outline** shows **Act One** (section), **Opening image**
(synopsis) and **Need stronger hook** (note). Clicking an item scrolls to it.

### Other modes test
1. Switch **Mode → Novel**: the page uses a serif prose face; typing `INT. HOME`
   is **not** screenplay-formatted; the Outline shows only `#` headings.
2. (Notes / Scene are prose foundations in the mode registry; if exposed they
   behave like freeform prose, not screenplay.)

### Keyboard test
* **Ctrl/Cmd+K** opens Logos (it is *not* repurposed for cycling/uppercase).
* **Tab** on an empty Screenplay line opens the autocomplete popup; **Shift+Tab**
  on a heading reduces its section depth; Tab never moves focus out of the editor.
* **Cmd/Ctrl+B/I/U** wrap the selection in Fountain emphasis markers.

---

## Known limitations

- **AI is a placeholder.** `POST /api/logos/inline` returns offline, deterministic
  per-action text (`provider: "stub"`); the `connect` action does perform a real
  PSYKE search. No model is called yet.
- **PSYKE is sample data.** Search runs over a few placeholder entries; there is
  no entry creation or persistence yet.
- **Persistence is a single JSON file** at `~/.logosforge/whiteboard.json`
  (override the dir with `LOGOSFORGE_DATA_DIR`); it survives backend/Electron
  restarts. Multi-document / per-project storage is a follow-up.
- **Editor is plain-text per block** — paragraphs + headings only; no inline
  marks/lists yet (so what you see is exactly what is saved).
- **Packaging is shell-only.** `npm run pack` packages the Electron shell; the
  Python backend is not yet bundled (dev launches it from `backend/`).

---

## Troubleshooting

**Backend port already in use** (`[Errno 98] address already in use`)
- Another process holds `8777`. Use a different port:
  `LOGOSFORGE_PORT=8780 scripts/run-backend.sh` (and the same for `npm run smoke`).
- Or free it — macOS/Linux: `lsof -i :8777` then `kill <pid>`; Windows:
  `netstat -ano | findstr :8777` then `taskkill /PID <pid> /F`.

**Python virtual environment not active** (`ModuleNotFoundError: fastapi`/`uvicorn`)
- Activate it: `source backend/.venv/bin/activate` (Windows:
  `backend\.venv\Scripts\Activate.ps1`), then `pip install -r backend/requirements.txt`.
- Or just use `scripts/run-backend.sh` / `.ps1`, which manage the venv for you.

**Missing npm dependencies** (`Cannot find module …`, `vite: not found`)
- Run `npm install` inside `desktop/`. Delete `desktop/node_modules` and reinstall
  if it's corrupted.

**Electron cannot reach the backend** (status bar stuck on *Connecting…* / *Unavailable*)
- Confirm the backend is up: open <http://127.0.0.1:8777/health>.
- Ensure the ports match — the app defaults to `8777`; if you changed
  `LOGOSFORGE_PORT`, launch Electron with the same value.
- In dev the app auto-starts the backend from `backend/.venv`; if that venv is
  missing, do the Backend setup once. Check the Electron terminal for `[backend]`
  logs.

**CORS / API connection problems** (requests blocked in the renderer)
- The backend only allows loopback origins (`localhost` / `127.0.0.1`). Use the
  app via `npm run dev` (origin `http://localhost:5173`), not by opening built
  files over `file://` in a browser.
- Don't point the app at a non-loopback host without adding that origin.

**Autosave not working** (status never reaches *Saved*, or *Save failed*)
- *Save failed* means the PUT didn't reach the backend — check it's running and
  the port matches (see above). Edits stay in the editor and retry on the next change.
- Autosave is debounced (~700 ms after you stop typing) — wait a moment.

**Hotkeys not working** (Ctrl/Cmd+K / Shift+O / Shift+P do nothing)
- The shortcut must fire with focus inside the app window. **Ctrl/Cmd+K** only
  opens Logos when the **editor** is focused — click into the text first.
- Some global OS/browser shortcuts can shadow these; test inside the Electron
  window (not a separate browser tab).
- On Windows/Linux use **Ctrl**; on macOS use **Cmd**.
