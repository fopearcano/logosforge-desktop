"""Outline endpoint (GET /api/outline) — derived from the current document."""

from __future__ import annotations

from fastapi import APIRouter

from app.schemas.outline import OutlineResponse
from app.services.outline_service import outline_service
from app.services.whiteboard_service import whiteboard_service

router = APIRouter(tags=["outline"])


@router.get("/outline", response_model=OutlineResponse)
def get_outline() -> OutlineResponse:
    return OutlineResponse(items=outline_service.derive(whiteboard_service.get()))
