"""PSYKE (story-bible) DTOs."""

from __future__ import annotations

from pydantic import BaseModel, Field


class PsykeEntry(BaseModel):
    id: str
    name: str
    entry_type: str = "other"
    aliases: list[str] = Field(default_factory=list)


class PsykeSearchResponse(BaseModel):
    query: str
    results: list[PsykeEntry] = Field(default_factory=list)
