"""Writing Modes service.

The five Writing Modes, faithfully adapted (pure data) from StoryPlanner. This
is a clean reimplementation of StoryPlanner's public mode data — StoryPlanner is
NOT imported. Reference (read-only):
  - storyplanner/storyplanner/writing_modes.py  (labels, structural units, medium constraints)
  - storyplanner/storyplanner/project_compat.py (default writing format per engine)
"""

from __future__ import annotations

from app.schemas.writing_modes import WritingMode

_MODES: list[WritingMode] = [
    WritingMode(
        id="novel",
        label="Novel",
        structural_units=["Acts", "Chapters", "Scenes"],
        default_writing_format="novel",
        medium_constraints=(
            "prose voice, interiority, chapter rhythm, character arc, "
            "thematic recurrence"
        ),
    ),
    WritingMode(
        id="screenplay",
        label="Screenplay",
        structural_units=["Acts", "Sequences", "Scenes"],
        default_writing_format="screenplay",
        medium_constraints=(
            "visual action, scene economy, dialogue subtext, setup/payoff, "
            "cinematic pacing"
        ),
    ),
    WritingMode(
        id="graphic_novel",
        label="Graphic Novel",
        structural_units=["Chapters", "Pages", "Panels"],
        default_writing_format="graphic_novel",
        medium_constraints=(
            "page turns, panel rhythm, visual motif, image/text balance, "
            "dialogue compression"
        ),
    ),
    WritingMode(
        id="stage_script",
        label="Stage Script",
        structural_units=["Acts", "Scenes", "Beats", "Stage Directions"],
        default_writing_format="stage_script",
        medium_constraints=(
            "playable conflict, blocking, entrances/exits, performable dialogue, "
            "scene economy"
        ),
    ),
    WritingMode(
        id="series",
        label="Series",
        structural_units=["Seasons", "Episodes", "A/B/C Plots", "Scenes"],
        # StoryPlanner suggests the screenplay format for the series engine.
        default_writing_format="screenplay",
        medium_constraints=(
            "episode engine, A/B/C plots, season arc, recurring payoff, "
            "long-term continuity"
        ),
    ),
]

_BY_ID = {m.id: m for m in _MODES}
DEFAULT_MODE = "novel"


class WritingModesService:
    def list_modes(self) -> list[WritingMode]:
        return list(_MODES)

    def default_mode(self) -> str:
        return DEFAULT_MODE

    def is_valid(self, mode: str | None) -> bool:
        return mode in _BY_ID

    def normalize(self, mode: str | None) -> str:
        """Return a valid mode id, falling back to the default."""
        return mode if mode in _BY_ID else DEFAULT_MODE

    def get(self, mode: str | None) -> WritingMode:
        return _BY_ID[self.normalize(mode)]


writing_modes_service = WritingModesService()
