"""Outline endpoints.

  - GET /api/outline          → document-derived navigator (read-only).
  - GET /api/outline/items    → the manual story outliner (persisted).
  - PUT /api/outline/items    → replace the manual outliner (persisted).
"""

from __future__ import annotations

from fastapi import APIRouter

from app.schemas.outline import OutlineItemsDocument, OutlineResponse
from app.services.outline_items_service import outline_items_service
from app.services.outline_service import outline_service
from app.services.whiteboard_service import whiteboard_service

router = APIRouter(tags=["outline"])


@router.get("/outline", response_model=OutlineResponse)
def get_outline() -> OutlineResponse:
    return OutlineResponse(items=outline_service.derive(whiteboard_service.get()))


@router.get("/outline/items", response_model=OutlineItemsDocument)
def get_outline_items() -> OutlineItemsDocument:
    return OutlineItemsDocument(items=outline_items_service.get())


@router.put("/outline/items", response_model=OutlineItemsDocument)
def put_outline_items(payload: OutlineItemsDocument) -> OutlineItemsDocument:
    return OutlineItemsDocument(items=outline_items_service.replace(payload.items))
