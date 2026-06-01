"""Writing Mode DTOs."""

from __future__ import annotations

from pydantic import BaseModel, Field


class WritingMode(BaseModel):
    id: str
    label: str
    structural_units: list[str] = Field(default_factory=list)
    default_writing_format: str
    medium_constraints: str


class WritingModesResponse(BaseModel):
    modes: list[WritingMode]
    default_mode: str
