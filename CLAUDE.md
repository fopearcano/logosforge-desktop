# CLAUDE.md — LogosForge Whiteboard Desktop (`fopearcano/logosforge-desktop`)

> Canonical template:
> `fopearcano/logosforge-architecture` → `repo-templates/logosforge-desktop/CLAUDE.md`.
> If this file ever disagrees with the architecture repo, the architecture
> repo wins.

## Repo identity

This repo is the **Free Whiteboard Electron alpha** — the current working
Free desktop app (LogosForge Whiteboard Desktop).

**Status: real alpha.** This is one of only two LogosForge repos containing
real application code (the other is the Python core, `storyplanner`). Until
a shared Whiteboard UI package is actually built and mature — a future plan,
not a current fact — this app owns **both** its Electron behavior **and**
the current working Free Whiteboard UI.

## What this repo owns

- The current Electron desktop app (main/renderer/preload wiring)
- **The current working Free Whiteboard UI** (until
  `logosforge-whiteboard-shared-ui` is real and mature — future)
- Local file behavior (open/save, recent files, file watching)
- Native menus
- Desktop packaging and distribution

## What this repo must NOT own

- Pro/Studio features or UI — the Pro line is entirely future and has its
  own repos
- Python core logic — behavior, data models, PSYKE, assistant, and
  import/export belong in `storyplanner`
- Shared TypeScript contracts — `logosforge-ui-contracts` is a future
  scaffold; do not start building contracts here or there
- Web-specific code — `logosforge-web` is a future scaffold

## Dependencies

- **Today:** Electron and desktop tooling, plus whatever the current alpha
  already uses. **No LogosForge package dependencies exist** —
  `logosforge-whiteboard-shared-ui` and `logosforge-ui-contracts` are empty
  scaffolds with nothing to consume.
- **Future (roadmap Phase 4):** `logosforge-whiteboard-shared-ui` and
  `logosforge-ui-contracts`, once they are real and mature.
- **Forbidden:** anything from the Pro line; depending on a future scaffold
  before it is real.

## Update rules

- Edit this repo for Free desktop behavior **and — today — for the Free
  Whiteboard UI itself.** The UI lives here: the Phase 2 decision
  (2026-06-12) chose **improving this app directly**, and shared-UI
  extraction is deferred until the roadmap's re-evaluation triggers fire
  (Phases 3–4 are dormant — see the architecture repo's `docs/ROADMAP.md`).
- Do **not** refactor this app toward a shared UI package, extract
  components "in preparation," or wire in scaffold packages unless
  explicitly instructed that the roadmap phase has begun
  (architecture repo → `docs/ROADMAP.md`).
- Core/backend behavior changes go to `storyplanner`, not here.
- Improve the alpha incrementally; it is a working app, not a prototype to
  rewrite.

## Forbidden actions

- Adding Pro features, Pro styling, or dependencies on Pro-line repos
- Implementing Python-core behavior (project/document/PSYKE logic) in the
  app instead of `storyplanner`
- Premature integration: depending on, importing from, or copying code
  to/from `logosforge-whiteboard-shared-ui` or `logosforge-ui-contracts`
  while they are scaffolds
- Big-bang rewrites of the working alpha

## Architecture source of truth

Ecosystem rules live in **`fopearcano/logosforge-architecture`**. Before any
cross-repo work, read there: `docs/REPO_MAP.md`, `docs/OWNERSHIP_RULES.md`,
`docs/CHANGE_PROTOCOL.md`, `docs/DEPENDENCY_POLICY.md`, `docs/ROADMAP.md`.
Answer the change protocol questions before editing.
