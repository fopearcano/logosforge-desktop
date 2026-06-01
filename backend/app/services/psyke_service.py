"""PSYKE search service — lightweight stub / adapter boundary.

Phase-1: in-memory substring search over an entry list that starts empty. The
shape and behaviour match a real search so the frontend can integrate now; the
store can later be backed by SQLite or adapted to StoryPlanner's search.
Reference only (not imported): storyplanner/storyplanner/psyke_search.py.
"""

from __future__ import annotations

from collections.abc import Iterable

from app.schemas.psyke import PsykeEntry


class PsykeService:
    def __init__(self) -> None:
        self._entries: list[PsykeEntry] = []

    def search(self, query: str) -> list[PsykeEntry]:
        needle = (query or "").strip().lower()
        if not needle:
            return []
        results: list[PsykeEntry] = []
        for entry in self._entries:
            haystack = " ".join([entry.name, *entry.aliases]).lower()
            if needle in haystack:
                results.append(entry)
        return results

    # Adapter seam: lets future wiring / tests populate the store.
    def set_entries(self, entries: Iterable[PsykeEntry]) -> None:
        self._entries = list(entries)


psyke_service = PsykeService()
