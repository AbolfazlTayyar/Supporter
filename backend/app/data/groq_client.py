"""
Thin data-access wrapper around Groq's HTTP API - no caching or filtering
logic here, that belongs in the service layer.
"""

import logging

import httpx

from app.config import settings

logger = logging.getLogger(__name__)


async def fetch_models() -> list[dict]:
    """Fetches the raw list of models available to this Groq API key."""
    # Never log the Authorization header - it carries the Groq API key.
    logger.debug("Fetching model list from Groq API")
    async with httpx.AsyncClient(timeout=10) as client:
        resp = await client.get(
            "https://api.groq.com/openai/v1/models",
            headers={"Authorization": f"Bearer {settings.groq_api_key}"},
        )
        resp.raise_for_status()
        return resp.json().get("data", [])
