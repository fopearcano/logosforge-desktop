"""Logos inline-assistant service — offline, deterministic stub.

Phase-1: returns a deterministic placeholder with no network/LLM call, so the
inline box can be built and tested offline. This is the boundary that will later
call a provider transport (LM Studio / Ollama / OpenAI / Anthropic / OpenRouter).
Reference only (not imported): storyplanner/storyplanner/providers.py + assistant.py.
"""

from __future__ import annotations

from app.schemas.logos import LogosInlineRequest, LogosInlineResponse

_NOTE = (
    "Placeholder response. Wire a provider (LM Studio / Ollama / OpenAI / "
    "Anthropic / OpenRouter) to enable real inline assistance."
)


class LogosService:
    def run_inline(self, req: LogosInlineRequest) -> LogosInlineResponse:
        action = (req.action or "rewrite").strip().lower() or "rewrite"
        source = (req.selection or req.prompt or "").strip()
        output = f"[Logos stub:{action}] {source}".strip()
        return LogosInlineResponse(
            ok=True,
            action=action,
            output=output,
            provider="stub",
            note=_NOTE,
        )


logos_service = LogosService()
