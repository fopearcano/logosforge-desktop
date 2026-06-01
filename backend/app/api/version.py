"""Version endpoint (GET /api/version)."""

from __future__ import annotations

from fastapi import APIRouter

from app.core.config import settings
from app.schemas.health import VersionResponse

router = APIRouter(tags=["meta"])


@router.get("/version", response_model=VersionResponse)
def version() -> VersionResponse:
    return VersionResponse(
        name=settings.app_name,
        version=settings.version,
        api_version=settings.api_version,
        status=settings.status,
    )
