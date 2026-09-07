"""
Business logic for listing usable chat models: caching Groq's model list and
filtering out models that can't answer a chat prompt.
"""

import logging
import time

import httpx

from app.config import settings
from app.data import groq_client

logger = logging.getLogger(__name__)

DEFAULT_MODEL = settings.groq_model

# Groq's /models endpoint also lists non-chat models (speech-to-text, moderation
# guard, text-to-speech) that can't answer a chat prompt. It doesn't label
# capability, so we filter those out by keyword instead.
_NON_CHAT_KEYWORDS = ("whisper", "prompt-guard", "orpheus", "tts", "safeguard")

# Server-side cache so every frontend page load doesn't hit Groq's API - the
# model list rarely changes, so an hour-old copy is perfectly fine.
_MODEL_CACHE_TTL_SECONDS = 3600
_model_cache: dict = {"models": None, "fetched_at": 0}


async def get_available_models() -> list[dict]:
    """Returns the chat-capable models this Groq API key can use, caching the result."""
    now = time.time()
    if _model_cache["models"] is not None and now - _model_cache["fetched_at"] < _MODEL_CACHE_TTL_SECONDS:
        logger.debug("Serving model list from cache")
        return _model_cache["models"]

    try:
        raw_models = await groq_client.fetch_models()
    except httpx.HTTPError as exc:
        # Groq unreachable - serve the previous cache if we have one, else just the default model.
        logger.warning("Failed to fetch model list from Groq, falling back to cache/default: %s", exc)
        return _model_cache["models"] or [{"id": DEFAULT_MODEL, "label": DEFAULT_MODEL}]

    models = sorted(
        (
            {"id": m["id"], "label": m["id"]}
            for m in raw_models
            if not any(keyword in m["id"].lower() for keyword in _NON_CHAT_KEYWORDS)
        ),
        key=lambda m: m["id"],
    )

    _model_cache["models"] = models
    _model_cache["fetched_at"] = now
    logger.info("Refreshed model list from Groq (%d chat-capable model(s))", len(models))
    return models


async def get_models_response() -> dict:
    """Returns the models list plus the default model to preselect in the UI."""
    models = await get_available_models()
    default = DEFAULT_MODEL if any(m["id"] == DEFAULT_MODEL for m in models) else models[0]["id"]
    return {"models": models, "default": default}
