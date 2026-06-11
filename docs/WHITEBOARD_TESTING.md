# Whiteboard Free — Local Testing Guide

How to run and test the current **LogosForge Whiteboard Free** phase locally —
the FastAPI backend, the backend test suite, and the Electron desktop app — plus
a manual checklist and troubleshooting.

> This phase is a working foundation. The Whiteboard Small AI system is
> **LittleBoy** — two lightweight agents: **Billy** (a hovering chat box,
> Cmd/Ctrl+Shift+B) and **Logos** (an inline/contextual box, Cmd/Ctrl+Shift+L).
> Both return **offline placeholders** until an AI provider is configured (the
> API + UI are stable for that). PSYKE Small now supports search + creating/persisting elements
> (story-bible entries) locally. The left **Outline** panel is a manual,
> editable, persisted **story outliner** (Dynalist-style — nesting, zoom/hoist
> with breadcrumbs, tags, status, color labels, checkboxes, LogosForge Notes and
> search/filter) alongside the existing read-only **From Document** navigator.
> File management now includes an
> **Import / Export** system (Text / Markdown / Fountain / Final Draft import;
> Text / Markdown / Fountain / LogosForge / JSON / HTML export). Everything stays
> intentionally lightweight (no graph, no dockable Pro workspace). See
> [Known limitations](#known-limitations) and [`PRO_TODO.md`](PRO_TODO.md).

---

## Prerequisites

- **Python 3.10+** (backend) — developed/tested on **3.13** (pinned in
  `backend/.python-version`). The backend runs unchanged on 3.10–3.13.
- **Node.js 18+** and **npm** (desktop app; Node 18+ is required for the smoke script's `fetch`)
- A desktop environment to display the Electron window (the GUI cannot run headless)

> **StoryPlanner sync / Python migration notes.** StoryPlanner (the read-only
> reference for the Python core/API patterns) is **Python 3.10+** and exposes a
> FastAPI DTO layer whose `/api/health` reports `api_version` + `core_version`
> for desktop/web client compatibility. After the Python update, this backend was
> verified on **3.13** (full suite green) and synced to the same compatibility
> shape: `/health` now also returns `version` / `api_version` / `core_version`,
> and the OpenAPI `info.version` is the API contract version. Dependency floors
> were nudged where a compiled wheel requires it (`pydantic>=2.9` for 3.13).
> No endpoints, schemas (beyond additive version fields), writing modes, or app
> behaviour changed.
>
> **Latest core sync (StoryPlanner `439a68a`, 0.9.0-alpha RC).** Re-audited the
> upstream after its Alpha-RC push. Upstream changes since the previous sync:
> a new **voice/Whisper dictation** feature line ("Dexter's Room": local
> `faster-whisper`/`sounddevice` deps, LAN Whisper companion), **multi-language**
> AI prompt injection (`languages.py`; layered above the provider transport),
> and an **internal** Graphic Novel restructure (Act → Page → Scene → Panel in
> the editor/storage layer). None of these touch the contract surfaces this
> backend mirrors: the upstream HTTP API layer, public writing-mode data
> (Graphic Novel units remain *Chapters/Pages/Panels*), PSYKE logic, provider
> transport, core version and Python requirement are all **unchanged** — so no
> Whiteboard code changes were needed. The voice dependencies are deliberately
> **not** adopted (the Whiteboard has no dictation feature; adding one would be
> a new product feature, and `/api/littleboy/dictation/*` intentionally does
> not exist — requests to it 404 cleanly). Verified after the re-audit: backend
> suite green on Python 3.11 + 3.13 (fresh dependency install), every endpoint
> live-checked (health/version, whiteboard GET+PUT, writing-modes, outline +
> items, PSYKE search + create, LittleBoy billy/logos, legacy logos, ws/events),
> frontend typecheck + all suites + build green.
>
> **Current sync baseline: StoryPlanner `621212c`.** The only upstream change
> after `439a68a` is a docs-only commit (the Alpha manual release-confirmation
> checklist for that same `439a68a` code tree; version still `0.9.0-alpha`, no
> tag, no code/dependency/API/mode/PSYKE/AI changes). Re-verified at this
> baseline: backend suite green on Python 3.11 + a fresh 3.13 install, the full
> live endpoint sweep above, and frontend typecheck + suites + build.

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

> **Renderer hot-reloads; the Electron main process does NOT (by default).**
> Vite hot-reloads the React renderer, but changes to `electron/*` (preload,
> main, menu, file IPC) only take effect when the **Electron process restarts**.
> The dev script now uses **nodemon** to rebuild + relaunch Electron automatically
> on `electron/*` changes — but you must `npm install` once to get nodemon, and
> after pulling main-process changes you may need to fully restart `npm run dev`.
> Symptom of a stale main process: in DevTools, `window.logosforge` shows only
> `getBackendStatus`/`onBackendStatus` (no `fileOpen`), and File → Open/Save do
> nothing. Fix: quit the app, stop `npm run dev`, run `npm install`, then
> `npm run dev` again.

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

The suite covers `/health` (incl. the `version`/`api_version`/`core_version`
compat fields), `/api/version`, `/api/whiteboard` (GET + PUT),
`/api/writing-modes`, `/api/outline` (document-derived), `/api/outline/items`
(the manual story outliner — GET + PUT, with a persistence-across-restart test),
`/api/psyke/search`, `/api/psyke/elements` (create + persistence),
`/api/logos/inline` (legacy), `/api/littleboy/billy/chat` and
`/api/littleboy/logos/inline` (the LittleBoy agents), and the `/ws/events`
WebSocket. `tests/test_smoke.py` is a single end-to-end "is the whole API alive?"
check.

### Frontend (type safety + pure engine tests)

There is no UI test framework yet (no Playwright/Vitest), but the screenplay
engine and the Nerd Mode editor tools are pure and unit-tested:

```bash
cd desktop
npm test                 # typecheck + screenplay + editor-tools + files + themes + outline + import-export + littleboy
npm run test:screenplay  # just the Fountain parser/classifier tests
npm run test:editor-tools # line numbers, folding, syntax classify
npm run test:files       # file <-> text serialization round-trips
npm run test:themes      # theme palettes + readability invariant + custom derive
npm run test:outline     # manual story-outliner model (tree ops, mode defaults)
npm run test:import-export # import parsers + export builders + LogosForge round-trip
npm run test:littleboy   # LittleBoy context bounding + Logos actions + apply-mode
npm run build            # verify the renderer bundles and electron compiles
```

`test:screenplay` and `test:editor-tools` bundle their test entry
(`renderer/src/features/{screenplay/screenplayTests,editorTools/editorToolsTests}.ts`)
with esbuild and run it in Node (exits non-zero on any failure).

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

- [ ] `GET /health` returns `{ "status": "ok", ... }` including `version`,
      `api_version` and `core_version` (compat fields synced with StoryPlanner)
- [ ] `GET /api/version` returns name / version / `api_version` / `core_version`
- [ ] `GET /api/whiteboard` returns a document (`blocks`, `mode`, …)
- [ ] `PUT /api/whiteboard` with `{ "blocks": [...] }` saves and returns it
- [ ] `GET /api/writing-modes` returns 5 modes + `default_mode`
- [ ] `GET /api/outline` returns `items` (derived from headings)
- [ ] `GET /api/outline/items` returns `{ "items": [] }` initially; `PUT
      /api/outline/items` with `{ "items": [...] }` saves and returns it (the
      manual story outliner; persists to `<data_dir>/outline.json`)
- [ ] `GET /api/psyke/search?q=test` returns a `results` array
- [ ] `POST /api/logos/inline` returns `{ ok, output, provider, ... }` (legacy)
- [ ] `POST /api/littleboy/billy/chat` returns `{ ok, conversation_id, message }`
      (placeholder when no provider is configured)
- [ ] `POST /api/littleboy/logos/inline` returns `{ ok, result, suggested_replacement }`
      (a transform action + selection yields a `suggested_replacement`)

(`npm run smoke` checks all of the above automatically.)

### Desktop app (`npm run dev`)

- [ ] Electron window opens, titled **LogosForge Whiteboard**
- [ ] React UI loads (no blank window / console errors)
- [ ] Status bar shows **Backend: Connected** and **API v1.0.0**
- [ ] Whiteboard editor loads and accepts typing
- [ ] Typing shows **Saving… → Saved** (autosave); reopening keeps the text
- [ ] **Outline** toggles via the `☰` button or **Ctrl/Cmd+Shift+O**; when hidden
      it fully disappears (no rail) and the editor expands
- [ ] The Outline header has an **Outline / From Document** toggle. **Outline**
      (default) is the manual, editable story outliner; **+ Add** creates a root
      item you can rename, nest and reorder — it persists across restarts
- [ ] **From Document** shows the read-only navigator; typing `# A heading` adds
      it there and clicking it scrolls the editor to that line
- [ ] **Writing Mode** selector loads the 5 modes; switching to Screenplay makes
      the surface monospaced
- [ ] **PSYKE** opens via the `PSYKE` button or **Ctrl/Cmd+Shift+P**; searching
      `hero` or `city` returns results; clicking one shows a detail view; **Esc** closes
- [ ] **Billy** (LittleBoy chat) opens with **Ctrl/Cmd+Shift+B** as a draggable
      floating box; messages get a response/placeholder; it is closable and its
      conversation survives close/reopen within the session
- [ ] **Logos** opens with **Ctrl/Cmd+Shift+L** (legacy alias **Ctrl/Cmd+K**) as a floating box at the cursor; with
      text selected, **Connect** lists related PSYKE entries; **Replace/Insert**
      applies into the document; **Esc** closes
- [ ] **File → Import** loads Text/Markdown/Fountain (Replace or Append) and
      marks the document Modified; **File → Export** writes Text/Markdown/
      Fountain/LogosForge/JSON/HTML without clearing dirty state
- [ ] No Pro surfaces appear (no dashboard/timeline/graph/analytics)

---

## Focused regression tests

### Layout test
1. Launch the app (`npm run dev`) with an empty document.
2. ✅ **No placeholder text** ("Describe the page…" etc.) — an empty doc shows
   only the caret when focused.
3. ✅ The **writing surface fills the main panel** — no tiny centered card.
4. ✅ Typing starts at the **top-left writing margin** (comfortable page padding),
   not vertically or horizontally centered. Click anywhere on the sheet to write.
5. ✅ **Screenplay**: `INT. HOME - DAY` appears at the screenplay left margin
   (not centered); Action wraps at the left margin; Character / Dialogue /
   Parenthetical use screenplay indentation; only explicitly-centered text centers.
6. ✅ **Novel / Notes**: prose begins at the normal left margin, broad column, no
   screenplay indentation.
7. ✅ Outline hide/show still works; the sheet reflows when it is hidden.

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

### Outline — From Document (derived navigator) test
In the Outline header, click **From Document**. Still in Screenplay mode, type:

```
# Act One

## Sequence One

= Opening image
[[Need stronger hook]]

INT. HOUSE - DAY

She opens the door.
```

Expected:
* The **From Document** view shows **Act One** (section, level 1), **Sequence
  One** (section, level 2, indented further), **Opening image** (synopsis),
  **Need stronger hook** (note) and **INT. HOUSE - DAY** (scene). Clicking an
  item scrolls the editor to that line.
* Because more than one *kind* is present, small **filter chips**
  (Sections / Scenes / Synopses / Notes) appear. Toggle one **off** to hide that
  kind from the list; toggle it back **on** to restore it. With a single kind
  present (e.g. only `#` headings) no chips show.
* This view is **read-only** — it reflects the document; it does not edit it.

### Outline outliner test (manual story outliner)
Switch the Outline header back to **Outline** (the default manual view). This is
a Dynalist-style, editable, persisted story outliner. The keyboard model below
is only active **while a row's title is focused**, so it never interferes with
the editor.

1. Click **+ Add**. A root row appears with its title focused for inline editing.
2. Type `Act One` — the title updates as you type (no separate "edit" step).
3. Press **Enter** → a new **sibling** row appears below, focused. Type `Act Two`.
4. Select `Act One` (click it) and press **Ctrl/Cmd+Enter** → a **child** row is
   added under it and focused. Type `Sequence One`.
5. With `Sequence One` focused, press **Enter**, type `Sequence Two`.
6. Press **Tab** on `Sequence Two` → it **indents** (nests under `Sequence One`).
7. Press **Shift+Tab** → it **outdents** back to a child of `Act One`.
8. Press **Ctrl/Cmd+↓** → the item **moves down** among its siblings;
   **Ctrl/Cmd+↑** moves it back up.
9. Press **↑ / ↓** (no modifier) → the **selection** moves between visible rows
   (the focused title follows).
10. On a row with children, press **←** at the start of the title → it
    **collapses** (disclosure ▸); press **→** at the end → it **expands** (▾).
    With it expanded, **→** again moves to the **first child**; **←** on a
    childless/already-collapsed row selects its **parent**.
11. Click the disclosure triangle (▸ / ▾) → it toggles collapse with the mouse.
12. Press **Shift+Enter** (or open the row's **⋯ → Details…**) → a details panel
    opens with a **Type** dropdown and a **Notes** textarea.
13. Change **Type** to a different value (e.g. `Scene`) → the subtle type label on
    the row updates. Type into **Notes**, then click **Done**.
14. Clear a row's title entirely and press **Backspace** on the empty title → the
    row is **deleted** (selection moves to a neighbour).
15. Use **⋯ → Delete** on a row **with children** → a confirm dialog appears;
    confirm → the row and its whole subtree are removed.
16. Click **Collapse all** → every parent collapses; **Expand all** → all expand.
17. ✅ A subtle **Saved** indicator appears after edits (top-right of the
    Outline toolbar).
18. **Persistence:** make a few edits, wait for **Saved**, then fully quit and
    relaunch (or restart the backend and reload). ✅ The outline is **restored**
    exactly — it lives at `<data_dir>/outline.json` (default `~/.logosforge`).
19. ✅ While editing outline titles, the editor's own shortcuts are unaffected,
    and outline keys (Enter/Tab/arrows) do **not** leak into the editor.
20. ✅ The outline stays on the **left side**; it is not a Pro dockable panel and
    there is no graph/timeline/dashboard.
21. Switch to **From Document** and back to **Outline** → your manual items are
    still there (the two views are independent).
22. ✅ The chosen view (Outline / From Document) is remembered across restarts.

### Improved Outline test (Dynalist-style)
The manual **Outline** is now a lightweight Dynalist-style story outliner with
zoom, tags, status, color labels, checkboxes and search — all on the same
left-side, hideable panel (no Pro workspace).

1. Open the Whiteboard.
2. Show the Outline panel (`☰` or **Ctrl/Cmd+Shift+O**); ensure the **Outline**
   (manual) view is selected.
3. Click **+ Add** and type `Act One`.
4. Press **Enter** and add `Act Two`.
5. Select `Act One`.
6. Press **Ctrl/Cmd+Enter** and add `Sequence One`.
7. With `Sequence One` selected, **Ctrl/Cmd+Enter** → add `Scene One`.
8. Under `Scene One`, **Ctrl/Cmd+Enter** → add `Beat One`.
9. Press **Tab** / **Shift+Tab** to indent / outdent a selected item.
10. Press **Ctrl/Cmd+↑ / ↓** to move an item among its siblings.
11. Collapse `Act One` (click ▾, or **←** at title start). **Alt/Option+click**
    the triangle collapses the whole branch.
12. Expand `Act One` (click ▸, or **→** at title end).
13. **Zoom into `Act One`** — double-click its **type label**, use **⋯ → Zoom
    into item**, or **Ctrl/Cmd+]**.
14. ✅ A breadcrumb appears: `Outline › Act One`; only Act One's subtree shows.
15. Zoom out via the **Outline** breadcrumb (or **Ctrl/Cmd+[**).
16. Add a **Note** under `Scene One` (select Scene One, add a child, then in
    **⋯ → Edit note…** set its **Type** to `Note`).
17. In the details panel, edit the **Note** body.
18. Add a tag: type `revision` in the **Tags** field (Enter) — or type `#revision`
    in the title. A subtle `#revision` chip appears under the row.
19. Set the Note's **Status** to `To do` (a tiny `To do` badge shows).
20. Set its **Color** to **Purple** (a purple dot shows on the row).
21. Type `revision` in the Outline **search** box.
22. ✅ The Note appears (matches are shown with their ancestors); clear the
    search to restore the full tree. The **⛃ Filter** menu also filters by
    type / status / color.
23. Restart the app (or restart the backend + reload).
24. ✅ The whole outline persisted — hierarchy, order, collapse, **type, note
    body, status, tags, color, checkbox** — from `<data_dir>/outline.json`.

Also: tick a row's **checkbox** → the title shows as done (strikethrough);
**⋯ → Duplicate** copies an item and its children; **⋯ → Delete** on a parent
asks for confirmation.

### LogosForge Note test
A `Note` item is a **LogosForge Note** (short title + longer body), usable for
story / scene / character / research / revision / structural notes & reminders.

1. Add an item and set its **Type** to **Note** (**⋯ → Edit note…**).
2. Title: `Fix protagonist motivation`.
3. Note body: `Clarify why the character refuses the call.`
4. Save (autosaves) and restart the app.
5. ✅ The note **title and body persist**.
6. Search `protagonist`.
7. ✅ The note appears (search covers title, body and tags). Notes can be nested
   under any Act / Chapter / Scene / Beat, or live at the top level.

### Hide/Show preservation test
1. With items in the outline (and optionally zoomed in), hide the Outline
   (**Ctrl/Cmd+Shift+O** or `☰`).
2. ✅ The whole panel disappears (no leftover rail) and the editor widens.
3. Show the Outline again (**Ctrl/Cmd+Shift+O** or `☰`).
4. ✅ All items, collapse state and the **zoom/breadcrumb** state return safely
   (hide/show is unchanged from before — it never edits the outline). **Esc**
   also restores it after Focus Mode / panel hiding.

### Outline mode-defaults test
The **type** of a freshly added item follows the current **Writing Mode**
(Part 8). Add a **root** and its first **child** in each mode:
* **Screenplay** → root **Act**; child of Act **Sequence**; child of Sequence
  **Scene**; child of Scene **Beat**.
* **Novel / Series** → root **Chapter** (Series root **Part**); child **Scene**;
  child of Scene **Beat**.
* ✅ You can always override any item's type via **Details…** — the defaults are
  just sensible starting points; nesting itself is free.

### Section indent / outdent test
Put the caret on the `# Act One` line, then:
* Press **Tab** → it deepens to `## Act One` (level 2); **Tab** again → `###`
  (level 3, the cap).
* Press **Shift+Tab** → it shallows back toward `#`; **Shift+Tab** at level 1
  turns the section back into a normal line.

### Autocomplete test
In Screenplay mode, on a **new empty line** press **Tab**:
* A small **autocomplete popup** opens at the caret with a filter box and a list
  of suggestions — the static slugs (`INT. `, `EXT. `, `INT./EXT. `, `EST. `,
  `CUT TO:`, `FADE OUT:`, `FADE IN:`, …) plus any **character names**, **scene
  headings** and **transitions** already used in the document.
* Type `E` → the list filters to entries that start with / contain `E`
  (e.g. `EXT. `, `EST. `, and a character like `ELENA` if one exists).
* **↑/↓** move the highlight; **Enter**, **Tab**, or a **click** insert the
  choice onto the line; **Esc** (or clicking away) closes without changing it.
* Right after a **Character** cue or dialogue, the suggestions are reordered so
  **character names come first** (the likely next cue).

### Title page test
At the very **top** of a Screenplay document, type:

```
Title: My Great Movie
Credit: Written by
Author: A. Writer
Draft date: 2026-06-02

INT. HOUSE - DAY
```

Expected:
* The `Title:` / `Credit:` / `Author:` / `Draft date:` lines render **subtly**
  (muted) as title-page metadata, while staying **plain, editable text**.
* The blank line ends the title page; `INT. HOUSE - DAY` below it formats as a
  normal Scene Heading.
* The metadata **persists** across save/reload (it is ordinary document text).
* Indented continuation lines under a key (e.g. a second `Contact:` line) are
  treated as part of that field.

### Notes & omitted text test
In Screenplay mode:
* Type `[[remember to plant the key here]]` on its own line → it renders
  **subtly** (a colored/dimmed note) and is excluded from preview/export.
* Select some text and press **Cmd/Ctrl+Alt+N** → it is wrapped as a note
  `[[ … ]]`.
* Type a `/* … */` block across one or more lines, e.g.:

  ```
  /*
  This scene is cut for now.
  */
  ```

  → the boneyard text stays in the document but is shown **subdued** (dimmed,
  italic) and is excluded from preview/export. It is **not deleted**.
* Select text and press **Cmd/Ctrl+Alt+O** → it is wrapped into the boneyard
  `/* … */` ("omit selected text").

> **Shortcut note:** the suggested `Cmd/Ctrl+Y` for Note conflicts with the
> editor's **redo** binding, so Note/Omit use **Cmd/Ctrl+Alt+N** /
> **Cmd/Ctrl+Alt+O** instead.

### Page break test
Type a line containing only `===` → it renders as a **subtle horizontal
page-break divider** (a faint dashed rule with the `===` shown small and muted).
The text stays editable; this is an indicator only (no real pagination yet).

### Preview test
1. In Screenplay mode, write a short scene that includes a **note** on its own
   line (`[[fix this beat]]`), an **inline note** inside an action line, an
   **omitted** `/* … */` block, and a title page (`Title:` / `Author:` at the
   very top).
2. Click **Preview** in the screenplay toolbar, or press **Ctrl/Cmd+Shift+E**.
3. ✅ The editor is replaced by a clean, formatted reading view (scene headings,
   character/dialogue indentation, transitions on the right).
4. ✅ The **note**, the **inline note**, and the **omitted** text are **hidden**.
5. ✅ The **title page** renders centered at the top (Title large, then Author…).
6. ✅ Sections/Synopses are hidden **unless** Document Settings →
   "Include outline elements in Preview" is enabled.
7. Press **Esc** (or click **Editing**) to return. The raw Fountain text —
   including the notes and omitted blocks — is untouched.

> The spec suggested **Shift+Cmd/Ctrl+P** for Preview, but that already toggles
> **PSYKE**; Preview uses **Ctrl/Cmd+Shift+E** instead (Esc exits).

### Settings test
1. Open **⚙ Settings** in the screenplay toolbar.
2. Change **Scene Heading** to **Underline** (or **Bold + Underline**) →
   ✅ scene headings update immediately, in the writing view *and* in Preview.
3. Change **Blank lines before Scene** to **Two** → ✅ more space appears above
   each scene heading.
4. Toggle **Show invisible Fountain markers** off → ✅ the dimmed `*` / `_`
   emphasis markers disappear (the bold/italic styling stays).
5. Change **Typeface** → ✅ the editor font changes (Courier Prime / Courier /
   monospace).
6. Settings persist across restarts (stored locally).

### Scale test
1. Use the toolbar **−** / **percentage** / **+** controls, or the keyboard:
   **Ctrl/Cmd+=** (Bigger), **Ctrl/Cmd+-** (Smaller), **Ctrl/Cmd+0** (Actual size).
2. ✅ The editor (and Preview) text/page scales up and down; the percentage
   indicator reflects the current scale, and it persists across restarts.
3. ✅ This is the **in-app** editor scale, not browser zoom.

> On macOS the system menu may also bind ⌘+ / ⌘− / ⌘0 to window zoom; the in-app
> toolbar buttons are always authoritative.

### Export test
1. Open **Export ▾** in the screenplay toolbar.
2. **Export Fountain (.fountain)** → ✅ downloads a plain-text `.fountain` file.
3. **Copy Fountain text** → ✅ copies the **raw** Fountain to the clipboard; paste
   it and confirm notes (`[[ … ]]`), omitted `/* … */`, and emphasis markers are
   **preserved verbatim** (export is lossless).
4. **Copy formatted preview** → ✅ copies the readable preview text with notes /
   omitted text removed and emphasis markers stripped.
5. **Export PDF / Final Draft / Print** appear but are **disabled** — declared
   future targets (clean service boundaries for later work).

### Page count test
With a screenplay open, the toolbar shows **Approx. pages: X**. ✅ The number
grows as you add scenes/action/dialogue. This is a **rough approximation**
(~55 lines/page), **not** production pagination — industry-accurate page
breaks (element spacing, MORE/CONT'D, dialogue splits) are a later task.

### Other modes test
1. Switch **Mode → Novel**: the page uses a serif prose face; typing `INT. HOME`
   is **not** screenplay-formatted; the Outline shows only `#` headings.
2. (Notes / Scene are prose foundations in the mode registry; if exposed they
   behave like freeform prose, not screenplay.)

### Keyboard test
* **Ctrl/Cmd+Shift+B** opens/closes **Billy** (LittleBoy chat).
* **Ctrl/Cmd+Shift+L** opens/closes **Logos** (inline); **Ctrl/Cmd+K** is a kept
  legacy alias for Logos (it is *not* repurposed for cycling/uppercase). These
  are handled in the capture phase so they beat the editor keymap; **Esc** closes
  the active AI box first.
* **Tab** on an empty Screenplay line opens the autocomplete popup; **Tab** on a
  Section line deepens it; **Shift+Tab** on a Section reduces its depth (and at
  level 1 turns it back into a normal line). Tab never moves focus out of the editor.
* **Cmd/Ctrl+B/I/U** wrap the selection in Fountain emphasis markers
  (`**bold**` / `*italic*` / `_underline_`).
* **Cmd/Ctrl+Alt+N** wraps the selection as a note (`[[ … ]]`);
  **Cmd/Ctrl+Alt+O** omits it into the boneyard (`/* … */`). (`Cmd/Ctrl+Y` is
  intentionally not used — it is redo.)
* **Cmd/Ctrl+\** centers the current line (wraps/unwraps `> … <`).
* **Ctrl/Cmd+Shift+E** toggles **Preview**; **Esc** exits Preview.
* **Ctrl/Cmd+=** / **Ctrl/Cmd+-** / **Ctrl/Cmd+0** scale the editor
  (Bigger / Smaller / Actual size).
* **Capitalization** (lowercase → UPPERCASE → Sentence case) is in the
  **Format ▾** toolbar menu — no shortcut, so **Cmd/Ctrl+K** stays Logos.
* **Nerd Mode** toggles (all modes): **Cmd/Ctrl+L** line numbers,
  **Cmd/Ctrl+Shift+F** folding, **Cmd/Ctrl+Shift+H** syntax highlighting. Note
  **Cmd/Ctrl+L** (line numbers) is distinct from **Cmd/Ctrl+Shift+L** (Logos).
  No conflict with Billy/Logos `Shift+B`/`Shift+L`, the outline/PSYKE `Shift+O/P`,
  or Preview `Shift+E`.
* **Distraction-free**: **Cmd/Ctrl+Shift+T** hides/shows the top panel;
  **Cmd/Ctrl+Shift+D** toggles Focus Mode (`Shift+F` was already folding, so
  Focus Mode uses **Shift+D**); **Esc** exits Focus Mode.
* **File** (native menu accelerators): **Cmd/Ctrl+N** New, **Cmd/Ctrl+O** Open,
  **Cmd/Ctrl+S** Save, **Cmd/Ctrl+Shift+S** Save As. `Cmd/Ctrl+K` is never bound
  in the menu — it stays Logos.
* **Outline outliner** (only while a manual-outline row's title is focused, so it
  never collides with the editor): **Enter** new sibling, **Shift+Enter** edit
  details/notes, **Tab/Shift+Tab** indent/outdent, **Ctrl/Cmd+Enter** add child,
  **↑/↓** move selection, **Ctrl/Cmd+↑/↓** move the item, **←** collapse-or-parent
  (at caret start), **→** expand-or-first-child (at caret end), **Backspace** on an
  empty title deletes (confirm if it has children), **Esc** deselects.

### Nerd Mode test
Nerd Mode aids are **off by default** — the page stays clean until you opt in via
the **Editor** button (right of the status line) or the shortcuts above.

1. Click **Editor → Show line numbers** (or press **Cmd/Ctrl+L**).
2. ✅ A subtle left gutter of line numbers appears, aligned to each block and
   scrolling with the document. (Works in Screenplay, Novel, Notes, Scene.)
3. Toggle line numbers off.
4. ✅ The gutter disappears — clean writing mode returns.
5. Type `# Act One` (Screenplay or Novel).
6. Add several lines below it.
7. Enable **Folding** (**Cmd/Ctrl+Shift+F**), hover the heading and click the
   **▾** gutter toggle to fold *Act One*.
8. ✅ The block collapses to `# Act One ⋯` and its body lines are hidden.
9. Click **▸** to expand *Act One*.
10. ✅ The text is intact (folding never edits the document).
11. Add `[[a multi-line note]]` across two lines (Screenplay) — it becomes a
    foldable Note region; fold/expand it.
12. ✅ The note can be folded; with **Syntax highlighting** on it is also colour-coded.
13. Enable **Syntax highlighting** (**Cmd/Ctrl+Shift+H**).
14. Open **Editor → Syntax theme** and switch between Minimal / Paper /
    Writer Dark / Sublime-like Dark.
15. ✅ Element colours change (scene headings, character, dialogue, notes, TODO…).
16. Restart the app.
17. ✅ The document content persists (and your tool toggles/theme are remembered).
18. ✅ Any folded/hidden text is still present — folding is purely visual, so
    nothing was deleted.

> **Note:** fold state is remembered best-effort by block position; after heavy
> edits a block may re-expand, but the text is never lost. The "Reset editor view"
> button in the popover clears all aids + folds.

### Focus Mode test (distraction-free)
1. Launch the app (`npm run dev`).
2. Press **Cmd/Ctrl+Shift+T** (or click **▲** in the top-right, or View → Toggle
   Top Panel).
3. ✅ The top toolbar disappears completely (no rail, no placeholder strip).
4. ✅ The editor expands upward into the freed space; the status bar stays.
5. Press **Cmd/Ctrl+Shift+T** again.
6. ✅ The top panel returns.
7. Enter **Focus Mode** — **Cmd/Ctrl+Shift+D** (or the **◌** button, or
   View → Focus Mode).
8. ✅ The top panel, Outline, status bar, PSYKE button and the writing-mode/
   status line all disappear — the window becomes a bare writing sheet (white in
   Light theme, dark in Dark theme). A subtle "press Esc to exit" hint fades in
   and out.
9. Press **Escape**.
10. ✅ All UI returns.
11. ✅ While in Focus Mode, **Cmd/Ctrl+Shift+B** (Billy) and **Cmd/Ctrl+Shift+L**
    (Logos) still open; **Esc** closes the active AI box first, then restores panels.

### ESC restore test
1. Hide the top panel (**Cmd/Ctrl+Shift+T**).
2. Hide the outline (**Cmd/Ctrl+Shift+O**).
3. Enter Focus Mode (**Cmd/Ctrl+Shift+D**).
4. Press **ESC**.
5. ✅ The top panel returns.
6. ✅ The outline returns.
7. ✅ The status bar returns.
8. ✅ The PSYKE button returns.
9. ✅ The editor is still usable and your text is intact (ESC never deletes text
   or breaks editor focus). `Cmd/Ctrl+K` is unaffected.

> ESC is the "give everything back" key: it exits Focus Mode **and** restores any
> individually-hidden panel. If a popover / PSYKE window / Logos box is open, the
> first ESC closes that transient; the next ESC restores the panels.

### Theme test
1. Open the **Theme** selector (top-right of the title bar).
2. Select **Paper White** → ✅ a calm parchment/white page with dark text.
3. Select **Ink Black** → ✅ a low-glare black/charcoal page with off-white text.
4. Select **Klein Blue** → ✅ deep blue applied everywhere (panels, editor, status
   bar, buttons, selection, caret).
5. Select **Ocher Gold** → ✅ dark archive chrome + warm parchment writing page.
6. Select **Red Room** → ✅ a theatrical dark-red chrome with a readable cream
   page — red used as accent, **not** an eye-burning text background.
7. Select **Blue Bronze** → ✅ navy chrome + parchment page (cinematic).
8. ✅ In every theme the editor text is high-contrast, muted labels are legible,
   the caret and text selection are visible, and buttons are readable.
9. Restart the app → ✅ the selected theme persisted.
10. Enter Focus Mode in each theme → ✅ the bare page uses that theme's writing
    surface; **ESC** restores the panels.

### Custom theme test
1. Open the Theme selector → choose **Custom** (custom colour rows appear).
2. Change **Accent** → ✅ accents/caret/selection update live.
3. Change **Editor background** → ✅ the writing surface updates (and editor ink
   auto-adjusts for contrast).
4. ✅ The UI updates immediately as you pick colours.
5. Restart the app → ✅ the custom colours (and that Custom is selected) persist.

### PSYKE Small test
1. Launch the Whiteboard.
2. Click the **PSYKE** button (top-right) — or **Ctrl/Cmd+Shift+P**.
3. ✅ The right-side PSYKE panel opens (compact, hideable, theme-aware).
4. Search for random text → ✅ a clear empty state ("No entries match…") or
   results appear; the built-in samples (e.g. "Protagonist", "The City") match.
5. Click **+ Add**.
6. Select **Character** in the Type dropdown.
7. Enter — Name: `Zampanò`, Description: `Maltese dog protagonist`,
   Notes: `Test character`.
8. Click **Save** → ✅ an "Added 'Zampanò'." confirmation appears and the panel
   returns to search.
9. Search `Zampanò` → ✅ it appears (also try `maltese` or `test character` —
   search matches name, type, description, notes, aliases).
10. **+ Add** a **Place** named `Constantinople` → search `Constantinople` →
    ✅ the Place appears. Repeat for Object / Lore / Theme / Other.
11. Hide the PSYKE panel (× or Esc), reopen it → ✅ created elements are still
    searchable.
12. Restart the app / backend → search again → ✅ created elements **persisted**
    (saved to `~/.logosforge/psyke.json`).
13. Click a result → ✅ a simple detail view shows name, type, description, notes.
14. Optional — select text in the editor, open PSYKE, click **+ Add** →
    ✅ the form is prefilled from the selection (short → name, long → description).

> PSYKE Small stays compact and right-side; no graph, no Pro workspace. Backend:
> `GET /api/psyke/search`, `POST /api/psyke/elements`, `GET /api/psyke/elements/{id}`.

> **Two clearly-separated states.** The subtle **Draft saved / Draft saving /
> Draft error** label on the right is the *backend autosave/session* — it is NOT
> a file save. The **file-state** label next to it is the truth about disk:
> `Untitled`, `Untitled — Modified`, `name.fountain — Saved to file`, or
> `name.fountain — Modified`. The window title shows `… *` while modified.

## LittleBoy AI (Billy + Logos)

LittleBoy is the Whiteboard **Small** AI system — two lightweight, writing-first
agents. It is intentionally **not** the Pro system: no Counterpart, no Quantum,
no multi-agent orchestration, no dockable panels. Both agents collect a *bounded*
context (selection + current block + nearby text + writing mode + screenplay
element + document title) and call the backend; with no provider configured they
return clear placeholders (the API/UI are stable for wiring a provider later via
`LITTLEBOY_PROVIDER` / `LITTLEBOY_BASE_URL` / `LITTLEBOY_MODEL`).

### LittleBoy test (Billy)
1. Launch the Whiteboard.
2. Type a paragraph.
3. Select a sentence.
4. Press **Cmd/Ctrl+Shift+B**.
5. ✅ Billy's floating chat opens (titled **Billy**, subtitle **LittleBoy Chat**),
   hovering over the editor (not a side panel). It is draggable by its header.
6. Type: `Help me improve this.` and press **Enter**.
7. ✅ A response appears (or the placeholder *"Billy placeholder response. AI
   provider not configured yet…"*). **Shift+Enter** inserts a newline instead of
   sending.
8. Click **×** (or press **Esc**) to close Billy.
9. Press **Cmd/Ctrl+Shift+B** again.
10. ✅ Billy reopens with the **same conversation** (session memory). **Clear**
    empties it.

### Logos test
1. Select text in the editor.
2. Press **Cmd/Ctrl+Shift+L** (or the legacy **Cmd/Ctrl+K**).
3. ✅ Logos appears near the selection/cursor (compact, titled **Logos** with the
   mode/element context, showing a preview of the selection).
4. Click **Rewrite**.
5. ✅ A result appears (placeholder until a provider is wired).
6. Click **Apply (replace selection)** if shown.
7. ✅ Only the selected text is replaced (transform actions return a
   `suggested_replacement`; Apply is the explicit confirmation — nothing
   auto-replaces).
8. Press **Cmd/Ctrl+Z** → ✅ the editor undoes the replacement.
9. Open Logos again with **no selection**.
10. ✅ It uses the current paragraph/block as context; informational actions
    (Explain / Summarize / Connect to PSYKE) offer **Insert below** / **Copy**
    (no Apply, so arbitrary text is never overwritten). **Connect to PSYKE**
    lists related story-bible entries.
11. Press **Esc** (or **×**) to close Logos.

### Focus Mode AI test
1. Enter Focus Mode (**Cmd/Ctrl+Shift+D**).
2. Press **Cmd/Ctrl+Shift+B** → ✅ Billy opens (shortcuts work in Focus Mode).
3. Close Billy.
4. Press **Cmd/Ctrl+Shift+L** → ✅ Logos opens.
5. Press **Esc** → ✅ the active AI box closes **first** (panels are restored only
   by a subsequent Esc — the AI box always takes ESC priority).

> Both agents are theme-aware (they use the active Whiteboard theme tokens) and
> hideable. Backend: `POST /api/littleboy/billy/chat`,
> `POST /api/littleboy/logos/inline`. Logos actions: rewrite, expand, compress,
> make_more_visual, improve_dialogue, improve_action, explain, summarize,
> connect_to_psyke.

### Native menu test
1. Launch Electron (`npm run dev`).
2. Look at the macOS menu bar (top of the screen).
3. Open **File**.
4. ✅ File contains **New**, **Open…**, **Save**, **Save As…**, an **Import**
   submenu, an **Export** submenu, and **Close Window**.
5. ✅ Shortcuts are visible: ⌘N / ⌘O / ⌘S / ⇧⌘S / ⌘W.
6. ✅ **Import** lists Text / Markdown / Fountain / LogosForge / Final Draft.
   **Export** lists Text / Markdown / Fountain / LogosForge / JSON / HTML, and a
   disabled **Export as PDF… (planned)**.
7. ✅ The app menu (bold app name) has About / Services / Hide / Quit; **⌘Q** quits.

### In-app File control test
1. Click the top-left **File** button in the writing area.
2. ✅ It lists New, Open…, Save, Save As…, then an **Import** group and an
   **Export** group with the same format items as the native File menu.
3. ✅ Each action works and does exactly the same thing as the native menu (one
   shared file-action pathway — no duplicated logic).

### Dirty state test
1. Start blank → ✅ title is `LogosForge Whiteboard — Untitled`; status shows
   `Untitled`.
2. Type text → ✅ title becomes `… — Untitled *`; status shows
   `Untitled — Modified` (NOT plain “Saved”). The autosave indicator may say
   “Draft saved” separately — that does **not** clear the modified state.

### Save As test
1. Press **Cmd/Ctrl+Shift+S**; save as `test.fountain`.
2. ✅ Title becomes `LogosForge Whiteboard — test.fountain` (no `*`).
3. ✅ Status shows `test.fountain — Saved to file`.

### Save test
1. Type more text → ✅ title `test.fountain *`; status `test.fountain — Modified`.
2. Press **Cmd/Ctrl+S** → ✅ the `*` disappears; status `test.fountain — Saved to file`.
3. Reopen the file and verify the new content is on disk.

### Open test
1. Press **Cmd/Ctrl+O**, choose `test.fountain`
   (`.fountain` / `.txt` / `.md` / `.logosforge` / `.logforge` are supported).
2. ✅ The content loads; state is clean (no `*`).

### Import / Export overview

Import/Export **extends** the file system — it never changes New/Open/Save/Save
As. Conceptually:

- **Open / Save / Save As** own the *active document* (set the file path, clear
  the dirty flag). Unchanged.
- **Import** loads external content *into* the current document (Replace or
  Append). It marks the document **Modified** and does **not** set the active
  file path.
- **Export** writes the current document to another format. It is a *copy*: it
  never clears the dirty flag and never changes the active file path.

Where work happens (no backend changes were needed): native dialogs +
filesystem IO live in the **Electron main process** (secure IPC — the renderer
never touches `fs`); format conversions are pure renderer utilities
(`features/files/importExportFormats.ts`, unit-tested via
`npm run test:import-export`).

**Formats.** Import: `.txt`, `.md`, `.fountain`, `.logosforge`/`.logforge`/`.json`,
and `.fdx` (a regex-based Final Draft foundation: scene heading / action /
character / parenthetical / dialogue / transition → Fountain). Export: `.txt`,
`.md`, `.fountain`, `.logosforge`, `.json`, `.html`. PDF is a declared,
**disabled** “planned” item (no low-quality fake PDF).

**LogosForge internal format (`.logosforge`, JSON).** A self-contained envelope
— it deliberately contains **no machine paths**:

```json
{
  "format": "logosforge-whiteboard",
  "version": "1.0",
  "document": { "title": "…", "mode": "screenplay|novel|…",
                "content": "…", "settings": { … } },
  "outline": [ … ],
  "psyke": { "elements": [] },
  "metadata": { "createdAt": "…", "updatedAt": "…", "exportedAt": "…" }
}
```

`document.content` is the same text serialization Save uses (so it round-trips
with `.fountain`/`.md`/`.txt`); `outline` is the persisted manual outliner;
`psyke.elements` is reserved (the story bible is its own persisted store and is
not bulk-embedded in a document export — importing elements, if present, is
best-effort).

### Import test
1. Start Whiteboard (`npm run dev`).
2. Create a sample text file, e.g.
   `printf 'Hello from a text file.\nSecond line.\n' > /tmp/sample.txt`.
3. **File → Import → Import Text…** (native File menu or the in-app **File**
   dropdown — both work).
4. Pick the file → the prompt **“How should this import be applied?”** appears →
   choose **Replace current document**.
5. ✅ The text appears in the editor and a toast says *Imported sample.txt
   (replaced).*
6. ✅ The document becomes **Modified** (`Untitled — Modified`, title shows `*`).
   Import does **not** set an active file path — it’s still `Untitled`.
7. Import another `.txt` and choose **Append** → ✅ its content is added to the
   end (a blank line separates it from the existing text).
8. Create a Fountain file:
   `printf 'INT. HOUSE - DAY\n\nShe opens the door.\n\nJANE\nHello.\n' > /tmp/s.fountain`.
9. **File → Import → Import Fountain…** → Replace.
10. ✅ Writing Mode switches to **Screenplay** and screenplay formatting/parsing
    activates (scene heading, character/dialogue).
11. With unsaved changes, importing with **Replace** first asks *“Importing will
    replace the current document. Save changes first?”* (Save / Don’t Save /
    Cancel) — **Cancel** aborts the import and leaves the document untouched.

### File Export test
1. Type some text.
2. **File → Export → Export as Text…** → save `export-test.txt`.
3. ✅ A toast says *Exported export-test.txt.*; open the file externally →
   content matches.
4. **Export as Fountain…** → save `export-test.fountain` → ✅ it contains the
   screenplay / plain-text content.
5. **Export as LogosForge…** → save `export-test.logosforge` → ✅ a JSON file is
   written with `"format": "logosforge-whiteboard"`, `document.content`,
   `outline`, `metadata`, and **no machine file paths** inside it.
6. **File → Import → Import LogosForge…** → pick `export-test.logosforge` →
   **Replace** → ✅ the content restores (and the manual **Outline** restores if
   you had outline items — the panel refreshes automatically).
7. ✅ **Export as JSON…** and **Export as HTML…** also write the respective files
   (`.json` = `{title, mode, blocks}`; `.html` = a readable standalone page).

### Export dirty-state test
1. Type text → the document is **Modified**.
2. **Export as Text…** (or any Export).
3. ✅ The document **remains Modified** after exporting — an export is a *copy*;
   it never clears dirty state and never changes the active file path.
4. Now **Save** (Cmd/Ctrl+S) normally.
5. ✅ The dirty `*` clears **only** after Save / Save As — never after Export.

### Unsupported / failed import test
1. **File → Import → Import Text…**, switch the picker to **All Files**, and
   choose a binary file (e.g. a `.png`).
2. ✅ A friendly error toast appears (*“This file does not look like a readable
   text document.”*) and the app does **not** crash.
3. **Import LogosForge…** on a non-JSON or wrong-`format` file → ✅ a clear error
   toast (*“This file is not valid JSON.”* / *“Unrecognized format …”*).
4. **Import Final Draft…** on a non-FDX file → ✅ *“This does not look like a
   Final Draft (.fdx) file.”* Cancelling any picker is a silent no-op.

### Close protection test
1. Start blank; type text.
2. Close the window (X / **Cmd/Ctrl+W** / File → Close Window).
3. ✅ A native prompt appears: “Save changes before closing?” (Save / Don't Save / Cancel).
4. Click **Cancel** → ✅ the app stays open.
5. Close again → **Don't Save** → ✅ the app closes.
6. ✅ The same prompt covers **Cmd/Ctrl+Q** / Quit and the red close button.

### Save before close test
1. Start blank; type text; close the window; click **Save**.
2. If there's no file yet, Save As opens — save `test.fountain`.
3. ✅ The app closes only after the save succeeds (cancelling Save As keeps it open).
4. Reopen the app → ✅ blank page (`Untitled`).
5. **File → Open** `test.fountain` → ✅ the text is there.

### Blank startup test
1. Type text; Save or don't; quit the app.
2. Reopen the app.
3. ✅ The app starts **blank** (the previous session is **not** auto-loaded;
   autosave is kept only as a future recovery foundation).
4. ✅ The window title is `LogosForge Whiteboard — Untitled`.

### Screenplay parser test (automated)

The Fountain engine lives in `renderer/src/features/screenplay/` (parser,
classifier, formatting, keyboard, autocomplete, sections, boneyard, title page,
preview, export, page count) and is unit-tested independently of the UI:

```bash
cd desktop && npm run test:screenplay
```

It covers scene headings (`INT.`/`EXT.`/`INT./EXT.`/`I/E.`/`EST.` + forced `.`),
action, character→dialogue, parentheticals, transitions (`TO:` + forced `>`),
centered (`> … <`), sections (`#`), synopses (`=`), notes (`[[ ]]`), page breaks
(`===`), and inline emphasis (`***bold italic***` / `**bold**` / `*italic*` /
`_underline_`). It also covers the newer feature layer: **autocomplete**
extraction + filtering (prefix-before-substring, context ordering), **section**
indent/outdent math (Tab/Shift+Tab depth), **boneyard / omitted text** detection
(single-line + multi-block), **title page** field parsing (incl. multi-line
values), **export stripping** of notes + boneyard, and **outline** extraction
with section hierarchy (and prose modes deriving headings only). The
preview/settings/export layer adds: **Preview** building (notes/omitted/title
page handling + include-outline), **Document Settings** data-attributes,
**view-scale** state, **Capitalization** + **Center** commands, lossless
**Fountain export**, and the rough **page-count** approximation. Emphasis renders
with the raw markers kept but dimmed.

The **Nerd Mode editor tools** have their own pure suite
(`npm run test:editor-tools`): line-number generation, foldable-region detection
(heading nesting + screenplay Note/boneyard regions) and hidden-block computation,
syntax classification (screenplay + novel/notes categories, inline tokens) and
syntax-theme switching.

The **manual story outliner** model (`renderer/src/features/outline/outlineModel.ts`)
is also pure and unit-tested (`npm run test:outline`, 82 checks): mode-aware
default types (root + child chains per writing mode), tree queries (children /
descendants / visible-row depth + collapse skipping / prev-next-first navigation),
every mutation (add root/child/sibling, rename, set type/notes/status/color/tags,
checkbox, collapse + collapse-all + recursive branch collapse, delete-subtree,
indent/outdent, move up/down, duplicate-subtree) with sibling-order re-indexing,
plus the Dynalist layer: tag parsing (`#tag` in titles), search/filter matching,
ancestor breadcrumbs, and zoom/filter-aware `buildRows` (matches + ancestors).

---

## Known limitations

- **AI is a placeholder.** `POST /api/logos/inline` returns offline, deterministic
  per-action text (`provider: "stub"`); the `connect` action does perform a real
  PSYKE search. No model is called yet.
- **PSYKE Small is lightweight.** Search runs over a few built-in sample entries
  **plus** any elements you create (Character / Place / Object / Lore / Theme /
  Other), which persist to `~/.logosforge/psyke.json` and are searchable by name,
  type, description, notes and aliases. No graph, relationships, or Pro workspace
  yet — editing/deleting elements is a follow-up.
- **Persistence is a single JSON file** at `~/.logosforge/whiteboard.json`
  (override the dir with `LOGOSFORGE_DATA_DIR`); it survives backend/Electron
  restarts. Multi-document / per-project storage is a follow-up.
- **Editor is plain-text per block** — paragraphs + headings only; no inline
  marks/lists yet (so what you see is exactly what is saved).
- **Preview / Export / page count are foundations.** Preview is a readable
  on-screen view (no paginated PDF); export covers Fountain / plain text +
  clipboard (PDF, Final Draft `.fdx`, and Print are declared future targets);
  the page count is a rough ~55-lines/page approximation, **not** industry
  pagination. Document Settings + view scale persist in **localStorage** (not in
  the backend document).
- **Nerd Mode is optional + local.** Line numbers, current-line highlight,
  folding, syntax highlighting and the typography overrides all default **off**
  and persist in **localStorage** (key `logosforge-editor-tools`; folds in
  `logosforge-folds`). Folding is visual-only — it never edits the document, so
  hidden text is always saved. Line numbers are per-block (not per-wrapped-line),
  and inline PSYKE references are a reserved token (no established syntax yet).
- **Blank startup + two persistence layers (by design).** The app **always
  starts blank** (`Untitled`, clean) — the previous session is **not**
  auto-loaded. *Backend autosave* still writes the live session to
  `~/.logosforge/whiteboard.json` on edits (a recovery foundation for later);
  *File → Save* writes a user-chosen plain-text/Fountain file to disk via native
  dialogs. A document stays **dirty until saved to a user file** (autosave does
  not clear the `*`). The renderer mirrors its dirty flag to the main process,
  which runs the **save prompt on window close / Cmd-W / quit** (`preventDefault`
  until the user chooses). File ops require the desktop app (the renderer never
  touches the filesystem — everything goes through secure IPC). Recent files are
  stored by the main process (`recent-files.json` in userData) and shown under
  **File → Open Recent**.
- **Distraction-free is local + session-aware.** Top-panel-hidden and outline
  visibility persist in localStorage; **Focus Mode always starts off** on a fresh
  launch (so you never boot into a chrome-less window by surprise) and exits on
  **Esc**.
- **The manual Outline outliner is a lightweight, Dynalist-style story outliner.**
  It persists as one document-level JSON list at `<data_dir>/outline.json`
  (separate from the document-derived navigator), survives restarts, and is
  intentionally left-side + lightweight (no Pro dockable panel). It supports
  nesting, zoom/hoist with breadcrumbs, item types, status, color labels, tags,
  checkboxes, LogosForge Notes (title + body), and search/filter. The full tree
  **is included** in `.logosforge` export/import; plain-text `.fountain`/`.txt`/
  `.md` saves deliberately carry **text only** (the outline is never injected as
  hidden metadata). The chosen view + zoom state persist in localStorage. Current
  TODOs: **drag-and-drop** reordering (move up/down + indent/outdent ship today),
  **multi-select**, a dedicated **"export outline as Markdown"** command, and
  deeper **two-way sync to text ranges** (`linkedLineId` / "Link to editor" are
  reserved but not yet wired).
- **Packaging is shell-only.** `npm run pack` packages the Electron shell; the
  Python backend is not yet bundled (dev launches it from `backend/`).

---

## Troubleshooting

**Open / Save dialogs do not appear (no Finder window)**

**First, rule out a stale Electron main process** (the #1 cause). In DevTools run
`window.logosforge` — if it shows only `getBackendStatus` / `onBackendStatus`
(no `fileOpen`), you are running the old main/preload: Vite hot-reloaded the
renderer but Electron never relaunched with the new `electron/*`. **Fix:** quit
the app, stop `npm run dev`, run `npm install` (for nodemon), then `npm run dev`.
A healthy bridge logs `[preload] logosforge exposed (flat) keys: [ … fileOpen … ]`
and `window.logosforge.fileOpen` is a `function`.

The chain is: native/in-app **File action** → `window.logosforge.files.*` (preload)
→ `ipcRenderer.invoke` → `ipcMain.handle` (main) → `dialog.showOpenDialog /
showSaveDialog`. Every hop logs, so you can see exactly where it breaks:

- Open the running app's **DevTools** (View → Toggle Developer Tools) and the
  **terminal** running `npm run dev`.
- On launch, DevTools should show
  `[preload] logosforge exposed (flat) keys: …` and
  `[files] bridge: [ … fileOpen … ] | fileOpen: function`.
  - If `fileOpen: undefined`, the page is not getting the preload — make sure you
    are using the **Electron window**, not a Chrome tab at
    `http://localhost:5173`. File dialogs only exist inside Electron.
- Click **File → Open**. Expected, in order:
  - DevTools: `[files] menu action: open` (native menu) or `[files] open() called`
    (in-app), then
  - terminal: `[menu] open clicked` (native menu only) → `[ipc] file:open-dialog`
    → `[files] open dialog requested` → the Finder dialog → `[files] open dialog result …`.
- If you see `[files] open() called` but **no** `[ipc] file:open-dialog`, the
  preload bridge isn't reaching main — verify `ipcMain` handlers are registered
  (`registerFileIpc`) and that the channel names match (`file:open-dialog`,
  `file:save-dialog`, `file:save-to-path`, `file:confirm-save-changes`).
- If you see `[files] open dialog requested` but **no** dialog, the issue is the
  native dialog itself (window focus / sheet) — confirm the main window is
  focused and not minimized.
- Quick sanity check: in the DevTools console run `window.logosforge` — it should
  be an object whose keys include `fileOpen`, `fileSaveAs`, `fileSaveToPath`,
  `fileConfirmSaveChanges`. (The bridge is intentionally **flat** — a nested
  `files` object was being dropped by contextBridge in the sandboxed renderer.)

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
