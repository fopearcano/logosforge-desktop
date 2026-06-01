"""Writing Modes endpoint (GET /api/writing-modes)."""

from __future__ import annotations

from fastapi import APIRouter

from app.schemas.writing_modes import WritingModesResponse
from app.services.writing_modes_service import writing_modes_service

router = APIRouter(tags=["writing-modes"])


@router.get("/writing-modes", response_model=WritingModesResponse)
def get_writing_modes() -> WritingModesResponse:
    return WritingModesResponse(
        modes=writing_modes_service.list_modes(),
        default_mode=writing_modes_service.default_mode(),
    )
