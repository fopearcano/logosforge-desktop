"""Whiteboard document DTOs.

Phase-1 interim shape: a flat list of typed blocks. This is deliberately simple
so the outline can be derived and the contract exercised end-to-end. It will be
superseded by / wrapped around the editor's ProseMirror JSON document once the
frontend lands; the top-level metadata (id/title/mode/updated_at) stays stable.
"""

from __future__ import annotations

from typing import Optional

from pydantic import BaseModel, Field


class WhiteboardBlock(BaseModel):
    id: str
    type: str = "paragraph"
    text: str = ""
    level: Optional[int] = None
    # Optional screenplay element type (Scene Heading / Action / Character /
    # Dialogue / Parenthetical / Transition) for paragraphs in Screenplay mode.
    sp: Optional[str] = None


class WhiteboardDocument(BaseModel):
    id: str
    title: str
    mode: str
    blocks: list[WhiteboardBlock] = Field(default_factory=list)
    updated_at: str


class WhiteboardCreate(BaseModel):
    title: Optional[str] = None
    mode: Optional[str] = None
    blocks: Optional[list[WhiteboardBlock]] = None


class WhiteboardUpdate(BaseModel):
    title: Optional[str] = None
    mode: Optional[str] = None
    blocks: Optional[list[WhiteboardBlock]] = None
