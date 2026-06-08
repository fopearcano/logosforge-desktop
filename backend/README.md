# LogosForge Whiteboard — Backend

Minimal local **FastAPI** backend for the Whiteboard Free version of LogosForge
Desktop. It is local-first (loopback only) and intended to run as the API behind
the (future) Electron/web frontend.

> Phase 1 foundation. It establishes the API surface and clean service
> boundaries. Some services carry real data adapted from StoryPlanner (Writing
> Modes); others (PSYKE search, Logos inline) are deliberate stubs that can be
> wired to real logic later **without changing the API contract**. StoryPlanner
> is used as a read-only reference and is never imported.

## Requirements

- Python 3.10+ (developed/tested on **3.13** — pinned in `backend/.python-version`).
  The dependency floors are chosen so a clean install works on 3.13 (e.g.
  `pydantic>=2.9`, the first release with 3.13 wheels).

## Setup

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate          # Windows: .venv\Scripts\activate
pip install -r requirements.txt
```

## Run

```bash
# from the backend/ directory, with the venv active
uvicorn app.main:app --reload --host 127.0.0.1 --port 8777
```

- Interactive docs: <http://127.0.0.1:8777/docs>
- OpenAPI schema: <http://127.0.0.1:8777/openapi.json>

Host/port/version can be overridden via env vars: `LOGOSFORGE_HOST`,
`LOGOSFORGE_PORT`, `LOGOSFORGE_VERSION`.

## Endpoints

| Method | Path | Purpose |
|---|---|---|
| GET  | `/health` | Liveness + compat (`{status, service, version, api_version, core_version}`) |
| GET  | `/api/version` | Name / build version / API contract version / `core_version` / status |
| GET  | `/api/whiteboard` | Get the current whiteboard document |
| POST | `/api/whiteboard` | Create/replace the document (201) |
| PUT  | `/api/whiteboard` | Partial update (title / mode / blocks) |
| GET  | `/api/writing-modes` | The five Writing Modes + default |
| GET  | `/api/outline` | Outline derived from the document's structural blocks |
| GET/PUT | `/api/outline/items` | The manual story outliner (persisted node list) |
| GET  | `/api/psyke/search?q=` | PSYKE entry search (sample + user-created entries) |
| POST | `/api/psyke/elements` | Create a PSYKE element (persisted) |
| POST | `/api/logos/inline` | Inline assistant (stub: offline, deterministic) |
| WS   | `/ws/events` | Live-events foundation (greets `connected`, echoes messages) |

`/health` and `/api/version` report both the backend build (`version` /
`core_version`) and the stable DTO contract (`api_version`, also the OpenAPI
`info.version`) — mirroring StoryPlanner's `/api/health` so a shared client can
verify compatibility from one call.

## Project layout

```
backend/
├── app/
│   ├── main.py            # FastAPI app factory (create_app / app)
│   ├── core/              # settings/config
│   ├── api/               # routers (health, version, whiteboard, …)
│   ├── services/          # business logic & stub boundaries
│   ├── schemas/           # pydantic DTOs
│   └── websocket/         # connection manager + /ws/events
├── tests/
├── requirements.txt
└── README.md
```

## Tests

```bash
# from the backend/ directory, with the venv active
pytest
```

Covers `/health`, `/api/version`, `/api/whiteboard`, `/api/writing-modes`,
`/api/outline`, plus smoke tests for the PSYKE/Logos stubs and the WebSocket.

## Notes & scope

- **In scope:** the seven foundation capabilities above.
- **Persistence:** the single whiteboard document is saved to a JSON file at
  `~/.logosforge/whiteboard.json` (override the dir with `LOGOSFORGE_DATA_DIR`).
- **Stubs / boundaries:** PSYKE search runs over a few placeholder sample
  entries; Logos inline returns deterministic offline placeholders (the
  `connect` action does a real PSYKE search). No LLM is called yet.
- **Out of scope (Pro):** dashboard, project hub, timeline, graph, analytics,
  Pro dockable workspace, advanced HUD visuals.
- **No frontend yet** — backend only.
