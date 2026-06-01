"""Whiteboard document service — single document, persisted to a JSON file.

The document is stored at ``<data_dir>/whiteboard.json`` (``data_dir`` defaults
to ``~/.logosforge``, override with ``LOGOSFORGE_DATA_DIR``). Writes are atomic
(temp file + ``os.replace``). This survives backend restarts and Electron
restarts (each launch reads the same file on startup).

Still a single-document model; per-project storage is a later milestone.
"""

from __future__ import annotations

import os
from datetime import datetime, timezone
from pathlib import Path

from app.core.config import settings
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
    def __init__(self, store_path: Path | None = None) -> None:
        self._path = Path(store_path) if store_path else Path(settings.data_dir) / "whiteboard.json"
        self._doc = self._load_or_default()

    # -- persistence ---------------------------------------------------------

    def _default(self) -> WhiteboardDocument:
        return WhiteboardDocument(
            id=DOC_ID,
            title="Untitled",
            mode=writing_modes_service.default_mode(),
            blocks=[],
            updated_at=_now(),
        )

    def _load_or_default(self) -> WhiteboardDocument:
        try:
            if self._path.exists():
                return WhiteboardDocument.model_validate_json(
                    self._path.read_text(encoding="utf-8")
                )
        except Exception:
            # Corrupt/unreadable file must never crash the backend — fall back.
            pass
        return self._default()

    def _persist(self) -> None:
        # Atomic write so a crash mid-save can't corrupt the document. Errors
        # propagate so the API surfaces a failed save to the client.
        self._path.parent.mkdir(parents=True, exist_ok=True)
        tmp = self._path.with_name(self._path.name + ".tmp")
        tmp.write_text(self._doc.model_dump_json(indent=2), encoding="utf-8")
        os.replace(tmp, self._path)

    # -- API -----------------------------------------------------------------

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
        self._persist()
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
        self._persist()
        return self._doc

    def reset(self) -> None:
        """Restore the default document and remove the persisted file (tests)."""
        self._doc = self._default()
        try:
            if self._path.exists():
                self._path.unlink()
        except OSError:
            pass


whiteboard_service = WhiteboardService()
