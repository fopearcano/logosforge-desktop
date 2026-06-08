"""Manual story-outliner store — persisted to ``<data_dir>/outline.json``.

One document-level list of outline nodes (the editable, story-oriented
outliner). Atomic writes; survives backend/Electron restarts. The node shape is
owned by the frontend and stored opaquely here. This is distinct from the
document-*derived* outline (see ``outline_service``).
"""

from __future__ import annotations

import json
import os
from pathlib import Path
from typing import Any

from app.core.config import settings


class OutlineItemsService:
    def __init__(self, store_path: Path | None = None) -> None:
        self._path = Path(store_path) if store_path else Path(settings.data_dir) / "outline.json"
        self._items: list[dict[str, Any]] = self._load()

    def _load(self) -> list[dict[str, Any]]:
        try:
            if self._path.exists():
                data = json.loads(self._path.read_text(encoding="utf-8"))
                if isinstance(data, list):
                    return data
                if isinstance(data, dict) and isinstance(data.get("items"), list):
                    return data["items"]
        except Exception:
            # A corrupt file must never crash the backend — start empty.
            pass
        return []

    def _persist(self) -> None:
        self._path.parent.mkdir(parents=True, exist_ok=True)
        tmp = self._path.with_name(self._path.name + ".tmp")
        tmp.write_text(json.dumps({"items": self._items}, indent=2), encoding="utf-8")
        os.replace(tmp, self._path)

    def get(self) -> list[dict[str, Any]]:
        return self._items

    def replace(self, items: list[dict[str, Any]]) -> list[dict[str, Any]]:
        self._items = list(items)
        self._persist()
        return self._items

    def reset(self) -> None:
        """Clear items + remove the persisted file (tests)."""
        self._items = []
        try:
            if self._path.exists():
                self._path.unlink()
        except OSError:
            pass


outline_items_service = OutlineItemsService()
