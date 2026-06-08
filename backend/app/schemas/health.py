"""Meta DTOs: health and version."""

from __future__ import annotations

from pydantic import BaseModel


class HealthResponse(BaseModel):
    """Liveness + compatibility report.

    Mirrors StoryPlanner's ``/api/health`` so a shared client (Electron desktop /
    Web-PWA) can verify it is talking to a compatible backend from a single call:
    ``api_version`` is the stable DTO/action contract; ``core_version`` is this
    backend build. ``version`` is kept (= core build) for backward compatibility.
    The added fields are additive — existing clients reading ``status``/``service``
    are unaffected.
    """

    status: str
    service: str
    version: str
    api_version: str
    core_version: str


class VersionResponse(BaseModel):
    name: str
    version: str
    api_version: str
    # Explicit alias of the backend build (naming parity with /api/health and
    # StoryPlanner). ``version`` already carries the core build for back-compat.
    core_version: str
    status: str
