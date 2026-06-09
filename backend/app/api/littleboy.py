"""LittleBoy endpoints — Whiteboard Small AI (Billy chat + Logos inline).

  - POST /api/littleboy/billy/chat    → Billy (hovering chat) reply
  - POST /api/littleboy/logos/inline  → Logos (inline/contextual) result
"""

from __future__ import annotations

from fastapi import APIRouter

from app.schemas.littleboy import (
    BillyChatRequest,
    BillyChatResponse,
    LittleBoyLogosRequest,
    LittleBoyLogosResponse,
)
from app.services.littleboy_service import littleboy_service

router = APIRouter(prefix="/littleboy", tags=["littleboy"])


@router.post("/billy/chat", response_model=BillyChatResponse)
def billy_chat(payload: BillyChatRequest) -> BillyChatResponse:
    return littleboy_service.billy_chat(payload)


@router.post("/logos/inline", response_model=LittleBoyLogosResponse)
def logos_inline(payload: LittleBoyLogosRequest) -> LittleBoyLogosResponse:
    return littleboy_service.logos_inline(payload)
