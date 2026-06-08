"""Health endpoint (mounted at the root, outside the /api prefix)."""

from __future__ import annotations

from fastapi import APIRouter

from app.core.config import settings
from app.schemas.health import HealthResponse

router = APIRouter(tags=["meta"])


@router.get("/health", response_model=HealthResponse)
def health() -> HealthResponse:
    return HealthResponse(
        status="ok",
        service=settings.app_name,
        version=settings.version,          # core build (back-compat field)
        api_version=settings.api_version,  # stable DTO/action contract
        core_version=settings.version,     # explicit alias of the core build
    )
