"""Outline service — derives a lightweight navigator from the document.

Document-derived (no separate persistence) per the Whiteboard design: outline
items come from the document's structural/heading blocks, so they are always in
sync with the prose.
"""

from __future__ import annotations

from app.schemas.outline import OutlineItem
from app.schemas.whiteboard import WhiteboardDocument

# Structural block types that surface in the outline (mode-agnostic union).
_HEADING_TYPES = {
    "heading",
    "title",
    "scene_heading",
    "act_heading",
    "chapter_heading",
    "sequence_heading",
    "page",
    "panel",
    "episode_heading",
    "season_heading",
}

# Fallback nesting level when a block does not carry an explicit `level`.
_DEFAULT_LEVELS = {
    "title": 1,
    "act_heading": 1,
    "chapter_heading": 1,
    "season_heading": 1,
    "episode_heading": 2,
    "sequence_heading": 2,
    "page": 2,
    "scene_heading": 3,
    "panel": 3,
    "heading": 1,
}


class OutlineService:
    def derive(self, doc: WhiteboardDocument) -> list[OutlineItem]:
        items: list[OutlineItem] = []
        for block in doc.blocks:
            is_heading = block.type in _HEADING_TYPES or block.level is not None
            if not is_heading:
                continue
            level = (
                block.level
                if block.level is not None
                else _DEFAULT_LEVELS.get(block.type, 1)
            )
            title = (block.text or "").strip() or "(untitled)"
            items.append(
                OutlineItem(
                    id=f"outline_{block.id}",
                    title=title,
                    level=level,
                    block_id=block.id,
                )
            )
        return items


outline_service = OutlineService()
