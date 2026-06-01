"""Logos inline-assistant service — offline, deterministic placeholder.

Phase 7: per-action placeholder responses with no network/LLM call, so the
inline box can be built and tested offline. The "connect" action is real: it
searches the (seeded) PSYKE store for entities mentioned in the selection.

This is the boundary that will later call a provider transport (LM Studio /
Ollama / OpenAI / Anthropic / OpenRouter) and may stream. Reference only (not
imported): storyplanner/storyplanner/providers.py + assistant.py.
"""

from __future__ import annotations

from app.schemas.logos import LogosInlineRequest, LogosInlineResponse
from app.schemas.psyke import PsykeEntry
from app.services.psyke_service import psyke_service

_NOTE = (
    "Placeholder response — wire a provider (LM Studio / Ollama / OpenAI / "
    "Anthropic / OpenRouter) to enable real inline assistance."
)

_PLACEHOLDERS: dict[str, str] = {
    "suggest": "Writing suggestions will appear here once a provider is connected.",
    "rewrite": "A rewritten draft of your selection will appear here once a provider is connected.",
    "expand": "An expanded version of your selection will appear here once a provider is connected.",
    "explain": "An explanation of the selected passage will appear here once a provider is connected.",
    "summarize": "A concise summary will appear here once a provider is connected.",
    "mode": "A {mode}-mode pass of your selection will appear here once a provider is connected.",
}


def _connect_psyke(source: str) -> str:
    words = {w.strip(".,;:!?\"'()[]").lower() for w in source.split()}
    words = {w for w in words if len(w) >= 4}
    seen: dict[str, PsykeEntry] = {}
    for word in words:
        for entry in psyke_service.search(word):
            seen[entry.id] = entry
    if not seen:
        return "No PSYKE entries matched the selection."
    lines = [f"- {e.name} ({e.entry_type})" for e in seen.values()]
    return "Related PSYKE entries:\n" + "\n".join(lines)


class LogosService:
    def run_inline(self, req: LogosInlineRequest) -> LogosInlineResponse:
        action = (req.action or "suggest").strip().lower() or "suggest"
        mode = (req.mode or "novel").strip() or "novel"
        source = (req.selection or req.prompt or req.context or "").strip()

        if action == "connect":
            output = _connect_psyke(source)
        else:
            template = _PLACEHOLDERS.get(action, _PLACEHOLDERS["suggest"])
            output = template.format(mode=mode)

        return LogosInlineResponse(
            ok=True, action=action, output=output, provider="stub", note=_NOTE
        )


logos_service = LogosService()
