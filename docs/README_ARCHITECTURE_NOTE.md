<!-- Paste this section into this repo's README.md -->

## Architecture

This repository is part of the **LogosForge** ecosystem, governed by the
architecture/control repo
[`fopearcano/logosforge-architecture`](https://github.com/fopearcano/logosforge-architecture).

- **Product/layer:** LogosForge Whiteboard Desktop (Free line)
- **Status:** **real alpha** — the current working Free desktop app, and one
  of only two LogosForge repos with real application code (the other is
  `storyplanner`).
- **Role:** the Free Whiteboard Electron alpha. It currently owns its
  Electron behavior **and the working Free Whiteboard UI** — and keeps
  owning that UI: the Phase 2 decision (2026-06-12) chose improving this app
  directly, deferring shared-UI extraction (see the architecture repo's
  `docs/ROADMAP.md`).
- **Owns:** Electron wiring, local file behavior, native menus, desktop
  packaging, and the current Free Whiteboard UI.
- **Must not own:** Pro features, Python core logic, web-specific code,
  TypeScript contracts.
- **Depends on:** today, no LogosForge packages — none are real yet.
  Future (Phase 4): `logosforge-whiteboard-shared-ui` and
  `logosforge-ui-contracts`, once mature.

Before changing anything here, read this repo's `CLAUDE.md` and the
architecture repo's `docs/REPO_MAP.md` and `docs/CHANGE_PROTOCOL.md`.
UI changes happen **here** today; "shared package first" applies only after
a future extraction.
