"""Application settings.

Tiny, dependency-light config (no pydantic-settings). Values can be overridden
with environment variables so the Electron shell can launch the backend on a
chosen host/port later.
"""

from __future__ import annotations

import os
from dataclasses import dataclass


@dataclass(frozen=True)
class Settings:
    app_name: str = "LogosForge Whiteboard Backend"
    version: str = "0.1.0"
    # API contract version — kept aligned with the StoryPlanner API contract so
    # a future shared frontend can target either backend unchanged.
    api_version: str = "1.0.0"
    status: str = "foundation"
    host: str = "127.0.0.1"
    port: int = 8777
    # Local-first: only accept browser/Electron origins on loopback.
    cors_origin_regex: str = r"^https?://(localhost|127\.0\.0\.1)(:\d+)?$"


def _load() -> Settings:
    return Settings(
        version=os.getenv("LOGOSFORGE_VERSION", "0.1.0"),
        host=os.getenv("LOGOSFORGE_HOST", "127.0.0.1"),
        port=int(os.getenv("LOGOSFORGE_PORT", "8777")),
    )


settings = _load()
