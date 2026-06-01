"""Meta DTOs: health and version."""

from __future__ import annotations

from pydantic import BaseModel


class HealthResponse(BaseModel):
    status: str
    service: str


class VersionResponse(BaseModel):
    name: str
    version: str
    api_version: str
    status: str
