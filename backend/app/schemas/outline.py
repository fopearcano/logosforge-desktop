"""Outline DTOs (document-derived navigator)."""

from __future__ import annotations

from typing import Optional

from pydantic import BaseModel, Field


class OutlineItem(BaseModel):
    id: str
    title: str
    level: int = 1
    block_id: Optional[str] = None


class OutlineResponse(BaseModel):
    items: list[OutlineItem] = Field(default_factory=list)
