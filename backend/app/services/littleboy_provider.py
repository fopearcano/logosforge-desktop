"""LittleBoy AI provider boundary.

A small, dependency-free seam so Billy/Logos can later talk to a real provider
without changing the API or the UI. Resolved from environment variables; when
nothing is configured, callers fall back to deterministic placeholders.

Patterns adapted (NOT imported) from the read-only StoryPlanner reference
(storyplanner/providers.py + assistant.py): an OpenAI-compatible
``/chat/completions`` transport over the stdlib, with per-provider default base
URLs for the local-first options.

Supported now (OpenAI-compatible JSON): LM Studio, Ollama, OpenAI, OpenRouter.
Anthropic is reserved (different wire format) — a future addition.

Configure with:
    LITTLEBOY_PROVIDER   one of: "LM Studio" | "Ollama" | "OpenAI" | "OpenRouter"
    LITTLEBOY_BASE_URL   override the base URL (…/v1)
    LITTLEBOY_MODEL      model id (required to make a real call)
    LITTLEBOY_API_KEY    bearer token for cloud providers
"""

from __future__ import annotations

import json
import os
import urllib.error
import urllib.request
from dataclasses import dataclass
from typing import List, Optional

# Default base URLs per provider (the local-first ones need no key).
PROVIDER_DEFAULTS: dict[str, str] = {
    "lm studio": "http://localhost:1234/v1",
    "ollama": "http://localhost:11434/v1",
    "openai": "https://api.openai.com/v1",
    "openrouter": "https://openrouter.ai/api/v1",
}

_TIMEOUT_SECONDS = 60


@dataclass(frozen=True)
class ProviderConfig:
    name: str
    base_url: str
    model: str
    api_key: str = ""


def resolve_provider() -> Optional[ProviderConfig]:
    """Build a provider config from the environment, or None if unconfigured.

    A configuration is "complete enough" only when both a base URL and a model
    are available — otherwise we use placeholders (never a half-configured call).
    """
    name = (os.getenv("LITTLEBOY_PROVIDER") or "").strip()
    base_url = (os.getenv("LITTLEBOY_BASE_URL") or "").strip()
    model = (os.getenv("LITTLEBOY_MODEL") or "").strip()
    api_key = (os.getenv("LITTLEBOY_API_KEY") or "").strip()

    if not base_url and name:
        base_url = PROVIDER_DEFAULTS.get(name.lower(), "")
    if not base_url or not model:
        return None
    return ProviderConfig(name=name or "custom", base_url=base_url, model=model, api_key=api_key)


def is_configured() -> bool:
    return resolve_provider() is not None


def complete(
    config: ProviderConfig,
    messages: List[dict],
    *,
    temperature: float = 0.7,
    timeout: int = _TIMEOUT_SECONDS,
) -> str:
    """OpenAI-compatible chat completion. Raises on any transport/parse error."""
    url = f"{config.base_url.rstrip('/')}/chat/completions"
    payload = json.dumps(
        {"model": config.model, "messages": messages, "temperature": temperature}
    ).encode("utf-8")
    headers = {"Content-Type": "application/json"}
    if config.api_key:
        headers["Authorization"] = f"Bearer {config.api_key}"

    req = urllib.request.Request(url, data=payload, headers=headers, method="POST")
    with urllib.request.urlopen(req, timeout=timeout) as resp:  # noqa: S310 (configured URL)
        data = json.loads(resp.read().decode("utf-8"))
    return str(data["choices"][0]["message"]["content"]).strip()
