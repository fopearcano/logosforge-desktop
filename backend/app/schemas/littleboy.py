"""LittleBoy (Whiteboard Small AI) DTOs — Billy chat + Logos inline.

LittleBoy is the lightweight, writing-first Whiteboard AI. It is intentionally
NOT the Pro system (no Counterpart, no Quantum, no multi-agent orchestration).
"""

from __future__ import annotations

from typing import List, Optional

from pydantic import BaseModel


class ChatMessage(BaseModel):
    role: str  # 'user' | 'assistant' | 'system'
    content: str


# --- Billy (hovering chat) --------------------------------------------------


class BillyChatRequest(BaseModel):
    message: str
    selected_text: Optional[str] = None
    nearby_context: Optional[str] = None
    writing_mode: Optional[str] = None
    document_title: Optional[str] = None
    conversation_id: Optional[str] = None
    # Prior turns (kept by the client; the backend is stateless across requests).
    history: Optional[List[ChatMessage]] = None


class BillyChatResponse(BaseModel):
    ok: bool
    conversation_id: str
    message: ChatMessage
    provider: str
    note: Optional[str] = None


# --- Logos (inline / contextual) -------------------------------------------

# Allowed Logos actions (Part 3). "connect_to_psyke" is real (PSYKE search);
# the transform actions can return a `suggested_replacement` for Apply.
LOGOS_ACTIONS = (
    "suggest",
    "rewrite",
    "expand",
    "compress",
    "explain",
    "improve_dialogue",
    "improve_action",
    "make_more_visual",
    "connect_to_psyke",
    "summarize",
)

# Actions that propose a replacement for the selected text (drive the Apply button).
LOGOS_TRANSFORM_ACTIONS = (
    "rewrite",
    "expand",
    "compress",
    "improve_dialogue",
    "improve_action",
    "make_more_visual",
)


class LittleBoyLogosRequest(BaseModel):
    action: Optional[str] = "rewrite"
    selected_text: Optional[str] = None
    nearby_context: Optional[str] = None
    writing_mode: Optional[str] = None
    # Optional free-form instruction from the Logos custom-instruction field.
    instruction: Optional[str] = None
    document_title: Optional[str] = None


class LittleBoyLogosResponse(BaseModel):
    ok: bool
    action: str
    result: str
    suggested_replacement: Optional[str] = None
    provider: str
    note: Optional[str] = None
