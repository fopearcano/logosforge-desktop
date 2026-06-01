"""Whiteboard document service.

Phase-1 foundation: an in-memory single-document store. The Whiteboard Free app
edits one document per project; that persistence (one SQLite file per project)
arrives in a later milestone. This boundary keeps the API contract stable so the
store can be swapped without touching the routes.
"""

from __future__ import annotations

from datetime import datetime, timezone

from app.schemas.whiteboard import (
    WhiteboardCreate,
    WhiteboardDocument,
    WhiteboardUpdate,
)
from app.services.writing_modes_service import writing_modes_service

DOC_ID = "wb_default"


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


class WhiteboardService:
    def __init__(self) -> None:
        self._doc = self._default()

    def _default(self) -> WhiteboardDocument:
        return WhiteboardDocument(
            id=DOC_ID,
            title="Untitled",
            mode=writing_modes_service.default_mode(),
            blocks=[],
            updated_at=_now(),
        )

    def get(self) -> WhiteboardDocument:
        return self._doc

    def create(self, payload: WhiteboardCreate) -> WhiteboardDocument:
        self._doc = WhiteboardDocument(
            id=DOC_ID,
            title=payload.title or "Untitled",
            mode=writing_modes_service.normalize(payload.mode),
            blocks=payload.blocks or [],
            updated_at=_now(),
        )
        return self._doc

    def update(self, payload: WhiteboardUpdate) -> WhiteboardDocument:
        cur = self._doc
        self._doc = WhiteboardDocument(
            id=cur.id,
            title=cur.title if payload.title is None else payload.title,
            mode=(
                cur.mode
                if payload.mode is None
                else writing_modes_service.normalize(payload.mode)
            ),
            blocks=cur.blocks if payload.blocks is None else payload.blocks,
            updated_at=_now(),
        )
        return self._doc

    def reset(self) -> None:
        """Restore the default empty document (used by tests)."""
        self._doc = self._default()


whiteboard_service = WhiteboardService()
