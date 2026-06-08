"""PSYKE store — lightweight search + user-created elements.

Built-in sample entries (the access-foundation placeholders) stay in memory;
user-created elements are persisted to ``<data_dir>/psyke.json`` (atomic write),
so they survive backend/Electron restarts. Substring search matches an entry's
name, type, description, notes and aliases.

This is PSYKE *Small* — no graph, no Pro workspace. Reference only (not
imported): storyplanner/storyplanner/psyke_search.py.
"""

from __future__ import annotations

import json
import os
from collections.abc import Iterable
from datetime import datetime, timezone
from pathlib import Path
from uuid import uuid4

from app.core.config import settings
from app.schemas.psyke import ALLOWED_TYPES, PsykeElementCreate, PsykeEntry

# Generic narrative-archetype placeholders for the access foundation — sample
# data, never persisted (user-created elements are saved separately).
_SAMPLE_ENTRIES: list[PsykeEntry] = [
    PsykeEntry(id="p1", name="Protagonist", entry_type="character", aliases=["Lead", "Hero"]),
    PsykeEntry(id="p2", name="Antagonist", entry_type="character", aliases=["Rival"]),
    PsykeEntry(id="p3", name="The City", entry_type="place", aliases=["Metropolis"]),
    PsykeEntry(id="p4", name="The Artifact", entry_type="object", aliases=[]),
    PsykeEntry(id="p5", name="Redemption", entry_type="theme", aliases=[]),
    PsykeEntry(id="p6", name="The Old War", entry_type="lore", aliases=["The Long Conflict"]),
]


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


class PsykeService:
    def __init__(self, store_path: Path | None = None) -> None:
        self._path = Path(store_path) if store_path else Path(settings.data_dir) / "psyke.json"
        self._samples: list[PsykeEntry] = list(_SAMPLE_ENTRIES)
        self._created: list[PsykeEntry] = self._load_created()

    # -- persistence ---------------------------------------------------------

    def _load_created(self) -> list[PsykeEntry]:
        try:
            if self._path.exists():
                data = json.loads(self._path.read_text(encoding="utf-8"))
                return [PsykeEntry.model_validate(item) for item in data]
        except Exception:
            # A corrupt file must never crash the backend — start empty.
            pass
        return []

    def _persist(self) -> None:
        self._path.parent.mkdir(parents=True, exist_ok=True)
        tmp = self._path.with_name(self._path.name + ".tmp")
        payload = [e.model_dump() for e in self._created]
        tmp.write_text(json.dumps(payload, indent=2), encoding="utf-8")
        os.replace(tmp, self._path)

    # -- API -----------------------------------------------------------------

    def _all(self) -> list[PsykeEntry]:
        # User-created elements first (most relevant), then the samples.
        return self._created + self._samples

    def search(self, query: str) -> list[PsykeEntry]:
        needle = (query or "").strip().lower()
        if not needle:
            return []
        results: list[PsykeEntry] = []
        for entry in self._all():
            haystack = " ".join(
                [entry.name, entry.entry_type, entry.description, entry.notes, *entry.aliases]
            ).lower()
            if needle in haystack:
                results.append(entry)
        return results

    def create(self, payload: PsykeElementCreate) -> PsykeEntry:
        etype = payload.type.strip().lower()
        if etype not in ALLOWED_TYPES:
            etype = "other"
        now = _now()
        entry = PsykeEntry(
            id=f"e{uuid4().hex[:12]}",
            name=payload.name.strip(),
            entry_type=etype,
            aliases=[],
            description=payload.description.strip(),
            notes=payload.notes.strip(),
            created_at=now,
            updated_at=now,
        )
        self._created.append(entry)
        self._persist()
        return entry

    def get(self, element_id: str) -> PsykeEntry | None:
        for entry in self._all():
            if entry.id == element_id:
                return entry
        return None

    def reset(self) -> None:
        """Clear user-created elements + remove the persisted file (tests)."""
        self._created = []
        try:
            if self._path.exists():
                self._path.unlink()
        except OSError:
            pass

    # Adapter seam: lets future wiring / tests replace the sample set.
    def set_entries(self, entries: Iterable[PsykeEntry]) -> None:
        self._samples = list(entries)


psyke_service = PsykeService()
