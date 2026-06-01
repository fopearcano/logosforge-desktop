"""Pydantic request/response DTOs for the Whiteboard backend."""

from app.schemas.health import HealthResponse, VersionResponse
from app.schemas.whiteboard import (
    WhiteboardBlock,
    WhiteboardCreate,
    WhiteboardDocument,
    WhiteboardUpdate,
)
from app.schemas.writing_modes import WritingMode, WritingModesResponse
from app.schemas.outline import OutlineItem, OutlineResponse
from app.schemas.psyke import PsykeEntry, PsykeSearchResponse
from app.schemas.logos import LogosInlineRequest, LogosInlineResponse

__all__ = [
    "HealthResponse",
    "VersionResponse",
    "WhiteboardBlock",
    "WhiteboardDocument",
    "WhiteboardCreate",
    "WhiteboardUpdate",
    "WritingMode",
    "WritingModesResponse",
    "OutlineItem",
    "OutlineResponse",
    "PsykeEntry",
    "PsykeSearchResponse",
    "LogosInlineRequest",
    "LogosInlineResponse",
]
