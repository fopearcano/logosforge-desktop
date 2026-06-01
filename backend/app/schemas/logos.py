"""Logos inline-assistant DTOs."""

from __future__ import annotations

from typing import Optional

from pydantic import BaseModel


class LogosInlineRequest(BaseModel):
    action: Optional[str] = "rewrite"
    prompt: Optional[str] = None
    selection: Optional[str] = None
    context: Optional[str] = None
    mode: Optional[str] = None


class LogosInlineResponse(BaseModel):
    ok: bool
    action: str
    output: str
    provider: str
    note: Optional[str] = None
