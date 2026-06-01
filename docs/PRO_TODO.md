# LogosForge — Pro Version TODO

This file tracks features intentionally **excluded** from Whiteboard Free. It is
a planning document only — **do not implement these in the Free version.**

## Pro features (out of scope for Whiteboard Free)

- **Timeline** view (scene/event chronology).
- **Graph system** — narrative knowledge graph, focus graph, multi-plot graph.
- **Dashboard** / Decision Radar.
- **Analytics** — narrative health, character balance, pacing insights.
- **Pro dockable workspace** — a full, configurable docking/panel framework.
- **Advanced HUD visuals** — the NERV-style cyber HUD chrome.
- **Project hub** — multi-project browser/management screen.
- **Full PSYKE / Codex** — relations, progressions, entity graph, the rich
  per-type codex editor, engine-specific memory (visual / series / theatre),
  and entry creation/management UI.
- **Logos Pro layers** — diagnostics, narrative health, strategy router,
  proactive suggestions, controlled apply, rewrite sandbox.
- **Narrative-engine element grammars** — full screenplay/stage/graphic-novel/
  series formatting, and professional export (Fountain / FDX / DOCX / PDF).
- **Other StoryPlanner intelligence** — continuity engine, revision
  intelligence, guided workflows, quantum outliner, story memory, voice
  consistency, counterpart.
- **Plugins** system and the **Connector** automation/action layer.
- **Cloud sync** / collaboration.

## Foundation follow-ups (Free, but deferred to later milestones)

These complete the Free foundation; they are not "Pro", just not done yet:

- **Real AI provider transport** — wire the Logos inline + PSYKE intent stubs to
  LM Studio / Ollama / OpenAI / Anthropic / OpenRouter, with streaming (the
  transport already has a streaming seam).
- **Persistence** — replace the in-memory backend store with **one SQLite file
  per project** and canonical **ProseMirror JSON** (instead of the flat-block
  interim shape); a real, user-populated PSYKE store with entry creation.
- **Rich text** — re-enable inline marks (bold/italic) and lists once content is
  ProseMirror JSON; per-mode element behavior beyond the typographic hint.
- **Production packaging** — bundle the Python backend as a sidecar binary
  (PyInstaller) and produce signed/notarized installers (mac/win/linux).
- **API hardening** — per-launch bearer token + tighter CORS for any non-loopback
  use.
