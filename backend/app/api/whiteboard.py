"""Whiteboard document endpoints (GET/POST/PUT /api/whiteboard)."""

from __future__ import annotations

from fastapi import APIRouter, status

from app.schemas.whiteboard import (
    WhiteboardCreate,
    WhiteboardDocument,
    WhiteboardUpdate,
)
from app.services.whiteboard_service import whiteboard_service

router = APIRouter(prefix="/whiteboard", tags=["whiteboard"])


@router.get("", response_model=WhiteboardDocument)
def get_whiteboard() -> WhiteboardDocument:
    return whiteboard_service.get()


@router.post("", response_model=WhiteboardDocument, status_code=status.HTTP_201_CREATED)
def create_whiteboard(payload: WhiteboardCreate) -> WhiteboardDocument:
    return whiteboard_service.create(payload)


@router.put("", response_model=WhiteboardDocument)
def update_whiteboard(payload: WhiteboardUpdate) -> WhiteboardDocument:
    return whiteboard_service.update(payload)
