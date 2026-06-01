"""Logos inline-assistant endpoint (POST /api/logos/inline)."""

from __future__ import annotations

from fastapi import APIRouter

from app.schemas.logos import LogosInlineRequest, LogosInlineResponse
from app.services.logos_service import logos_service

router = APIRouter(prefix="/logos", tags=["logos"])


@router.post("/inline", response_model=LogosInlineResponse)
def logos_inline(payload: LogosInlineRequest) -> LogosInlineResponse:
    return logos_service.run_inline(payload)
