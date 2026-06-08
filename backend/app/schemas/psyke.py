"""PSYKE (story-bible) DTOs."""

from __future__ import annotations

from pydantic import BaseModel, Field

# The element types the Whiteboard can create.
ALLOWED_TYPES = {"character", "place", "object", "lore", "theme", "other"}


class PsykeEntry(BaseModel):
    id: str
    name: str
    entry_type: str = "other"
    aliases: list[str] = Field(default_factory=list)
    description: str = ""
    notes: str = ""
    created_at: str | None = None
    updated_at: str | None = None


class PsykeSearchResponse(BaseModel):
    query: str
    results: list[PsykeEntry] = Field(default_factory=list)


class PsykeElementCreate(BaseModel):
    """Payload for POST /api/psyke/elements (the creation form)."""

    type: str = "other"
    name: str = Field(min_length=1)
    description: str = ""
    notes: str = ""


class PsykeElementResponse(BaseModel):
    ok: bool
    element: PsykeEntry
