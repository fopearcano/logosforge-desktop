"""PSYKE search service — lightweight in-memory store.

Phase 6: serves a small set of **placeholder sample entries** so the PSYKE
access UI (search -> result list -> simple detail) works end-to-end. A
persistent, user-populated store (and entry creation) arrives in a later
milestone. Substring search matches entry names and aliases.
Reference only (not imported): storyplanner/storyplanner/psyke_search.py.
"""

from __future__ import annotations

from collections.abc import Iterable

from app.schemas.psyke import PsykeEntry

# Generic narrative-archetype placeholders for the access foundation — these are
# sample data, not a real/persisted store (replaced in a later milestone).
_SAMPLE_ENTRIES: list[PsykeEntry] = [
    PsykeEntry(id="p1", name="Protagonist", entry_type="character", aliases=["Lead", "Hero"]),
    PsykeEntry(id="p2", name="Antagonist", entry_type="character", aliases=["Rival"]),
    PsykeEntry(id="p3", name="The City", entry_type="place", aliases=["Metropolis"]),
    PsykeEntry(id="p4", name="The Artifact", entry_type="object", aliases=[]),
    PsykeEntry(id="p5", name="Redemption", entry_type="theme", aliases=[]),
    PsykeEntry(id="p6", name="The Old War", entry_type="lore", aliases=["The Long Conflict"]),
]


class PsykeService:
    def __init__(self) -> None:
        self._entries: list[PsykeEntry] = list(_SAMPLE_ENTRIES)

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
