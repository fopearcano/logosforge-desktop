"""Outline DTOs (document-derived navigator + manual outliner store)."""

from __future__ import annotations

from typing import Any, Optional

from pydantic import BaseModel, Field


class OutlineItem(BaseModel):
    """A document-derived outline entry (read-only navigator)."""

    id: str
    title: str
    level: int = 1
    block_id: Optional[str] = None


class OutlineResponse(BaseModel):
    items: list[OutlineItem] = Field(default_factory=list)


class OutlineItemsDocument(BaseModel):
    """The manual story outliner — persisted as one document-level item list.

    Items are stored opaquely (the frontend owns the node shape: id, parentId,
    type, title, notes, order, collapsed, …) so the backend stays a simple,
    robust persistence layer for the outline JSON.
    """

    items: list[dict[str, Any]] = Field(default_factory=list)
