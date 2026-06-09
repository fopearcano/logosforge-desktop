"""LittleBoy service — Billy (chat) + Logos (inline) for Whiteboard Small AI.

Each agent calls the provider boundary when one is configured, and otherwise
returns a deterministic, clearly-labelled placeholder. The API shape is stable
either way, so wiring a real provider later requires no API/UI change.

This is the Small system only: no Counterpart, no Quantum, no multi-agent
orchestration.
"""

from __future__ import annotations

import uuid
from typing import Optional

from app.schemas.littleboy import (
    LOGOS_ACTIONS,
    LOGOS_TRANSFORM_ACTIONS,
    BillyChatRequest,
    BillyChatResponse,
    ChatMessage,
    LittleBoyLogosRequest,
    LittleBoyLogosResponse,
)
from app.schemas.psyke import PsykeEntry
from app.services import littleboy_provider as provider
from app.services.psyke_service import psyke_service

_NOT_CONFIGURED_NOTE = (
    "Placeholder — set LITTLEBOY_PROVIDER / LITTLEBOY_BASE_URL / LITTLEBOY_MODEL "
    "(LM Studio, Ollama, OpenAI, OpenRouter) to enable real AI."
)

# Per-action provider instructions (used only when a provider is configured).
_LOGOS_INSTRUCTIONS: dict[str, str] = {
    "suggest": "Suggest what could come next. Be brief and concrete.",
    "rewrite": "Rewrite the text, preserving meaning and voice. Return only the rewrite.",
    "expand": "Expand the text with more detail. Return only the expanded text.",
    "compress": "Tighten the text to be shorter and punchier. Return only the result.",
    "explain": "Explain what the passage is doing (craft, intent). Be brief.",
    "improve_dialogue": "Improve the dialogue: subtext, distinct voices, economy. Return only the result.",
    "improve_action": "Improve the action lines: vivid, present-tense, visual. Return only the result.",
    "make_more_visual": "Make the writing more visual and concrete. Return only the result.",
    "summarize": "Summarize the passage in 1–3 sentences.",
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


class LittleBoyService:
    # --- Billy -------------------------------------------------------------
    def billy_chat(self, req: BillyChatRequest) -> BillyChatResponse:
        conversation_id = (req.conversation_id or "").strip() or uuid.uuid4().hex
        mode = (req.writing_mode or "novel").strip() or "novel"

        config = provider.resolve_provider()
        if config is not None:
            try:
                content = provider.complete(config, self._billy_messages(req, mode))
                return BillyChatResponse(
                    ok=True,
                    conversation_id=conversation_id,
                    message=ChatMessage(role="assistant", content=content),
                    provider=config.name,
                )
            except Exception as exc:  # pragma: no cover - network/runtime only
                note = f"Provider error ({type(exc).__name__}); showing a placeholder."
                return BillyChatResponse(
                    ok=True,
                    conversation_id=conversation_id,
                    message=ChatMessage(role="assistant", content=self._billy_placeholder(req, mode)),
                    provider="stub",
                    note=note,
                )

        return BillyChatResponse(
            ok=True,
            conversation_id=conversation_id,
            message=ChatMessage(role="assistant", content=self._billy_placeholder(req, mode)),
            provider="stub",
            note=_NOT_CONFIGURED_NOTE,
        )

    def _billy_placeholder(self, req: BillyChatRequest, mode: str) -> str:
        extra = ""
        if req.selected_text and req.selected_text.strip():
            extra = f" I can see your {len(req.selected_text.strip())}-character selection"
            extra += f" in {mode} mode."
        else:
            extra = f" I'd help with your {mode} writing here."
        return "Billy placeholder response. AI provider not configured yet." + extra

    def _billy_messages(self, req: BillyChatRequest, mode: str) -> list[dict]:
        system = (
            f"You are Billy, a concise, friendly writing assistant for {mode} writing "
            "inside the LogosForge Whiteboard. Help with the user's draft; keep replies short."
        )
        messages: list[dict] = [{"role": "system", "content": system}]
        for m in req.history or []:
            if m.role in ("user", "assistant") and m.content:
                messages.append({"role": m.role, "content": m.content})

        context_bits = []
        if req.document_title:
            context_bits.append(f"Document: {req.document_title}")
        if req.selected_text and req.selected_text.strip():
            context_bits.append(f"Selected text:\n{req.selected_text.strip()}")
        if req.nearby_context and req.nearby_context.strip():
            context_bits.append(f"Nearby context:\n{req.nearby_context.strip()}")
        context = ("\n\n".join(context_bits) + "\n\n") if context_bits else ""
        messages.append({"role": "user", "content": context + req.message})
        return messages

    # --- Logos -------------------------------------------------------------
    def logos_inline(self, req: LittleBoyLogosRequest) -> LittleBoyLogosResponse:
        action = (req.action or "rewrite").strip().lower()
        if action not in LOGOS_ACTIONS:
            action = "suggest"
        mode = (req.writing_mode or "novel").strip() or "novel"
        selected = (req.selected_text or "").strip()
        source = selected or (req.nearby_context or "").strip()

        if action == "connect_to_psyke":
            return LittleBoyLogosResponse(
                ok=True, action=action, result=_connect_psyke(source),
                suggested_replacement=None, provider="psyke",
            )

        config = provider.resolve_provider()
        if config is not None:
            try:
                result = provider.complete(config, self._logos_messages(req, action, mode, selected))
                replacement = result if (action in LOGOS_TRANSFORM_ACTIONS and selected) else None
                return LittleBoyLogosResponse(
                    ok=True, action=action, result=result,
                    suggested_replacement=replacement, provider=config.name,
                )
            except Exception as exc:  # pragma: no cover - network/runtime only
                return self._logos_placeholder(
                    action, selected, note=f"Provider error ({type(exc).__name__}); placeholder shown."
                )

        return self._logos_placeholder(action, selected, note=_NOT_CONFIGURED_NOTE)

    def _logos_placeholder(
        self, action: str, selected: str, note: str
    ) -> LittleBoyLogosResponse:
        result = (
            f"Logos placeholder response for action: {action}. "
            "Connect an AI provider for a real result."
        )
        # Transform actions offer an (obviously labelled) replacement so Apply is
        # usable/undoable even before a provider is wired — never silently fakes.
        replacement: Optional[str] = None
        if action in LOGOS_TRANSFORM_ACTIONS and selected:
            replacement = f"[{action} · placeholder] {selected}"
        return LittleBoyLogosResponse(
            ok=True, action=action, result=result,
            suggested_replacement=replacement, provider="stub", note=note,
        )

    def _logos_messages(
        self, req: LittleBoyLogosRequest, action: str, mode: str, selected: str
    ) -> list[dict]:
        instruction = _LOGOS_INSTRUCTIONS.get(action, _LOGOS_INSTRUCTIONS["suggest"])
        system = (
            f"You are Logos, a concise inline writing assistant for {mode} writing. "
            "Return only the requested result with no preamble or commentary."
        )
        parts = [instruction]
        if req.instruction and req.instruction.strip():
            parts.append(f"Extra instruction: {req.instruction.strip()}")
        if selected:
            parts.append(f"Text:\n{selected}")
        elif req.nearby_context and req.nearby_context.strip():
            parts.append(f"Context:\n{req.nearby_context.strip()}")
        return [
            {"role": "system", "content": system},
            {"role": "user", "content": "\n\n".join(parts)},
        ]


littleboy_service = LittleBoyService()
