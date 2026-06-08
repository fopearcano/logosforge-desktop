"""LogosForge Whiteboard backend — FastAPI application factory.

Run locally with:
    uvicorn app.main:app --reload --port 8777
"""

from __future__ import annotations

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api import api_router
from app.api.health import router as health_router
from app.core.config import settings
from app.websocket.events import router as ws_router


def create_app() -> FastAPI:
    # OpenAPI ``info.version`` is the stable API *contract* version (kept aligned
    # with StoryPlanner's API_CONTRACT_VERSION) — this is what a generated shared
    # client targets. The backend build is reported separately as ``core_version``
    # via /health and /api/version.
    app = FastAPI(
        title=settings.app_name,
        version=settings.api_version,
        description=(
            "Local-first FastAPI backend for the LogosForge Whiteboard "
            "(Electron desktop). Endpoint contract aligned with the StoryPlanner "
            "core/API patterns."
        ),
    )

    # Local-first CORS: only loopback origins (Electron / dev browser).
    app.add_middleware(
        CORSMiddleware,
        allow_origin_regex=settings.cors_origin_regex,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    app.include_router(health_router)              # GET /health
    app.include_router(api_router, prefix="/api")  # /api/*
    app.include_router(ws_router)                  # WS /ws/events
    return app


app = create_app()
