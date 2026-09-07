"""
Shared pytest fixtures. Test-only environment variables are set here, at
import time, before any test module imports `app.*` - `app.config.Settings`
reads them once at import time, so this must run first.
"""

import os

os.environ.setdefault("GROQ_API_KEY", "test-api-key")
os.environ.setdefault("GROQ_MODEL", "test-model")
os.environ.setdefault("LOG_LEVEL", "WARNING")

import pytest


@pytest.fixture(autouse=True)
def _reset_service_caches():
    """Services keep module-level caches (model list, compiled graph, LLM
    clients) that must not leak state between tests."""
    from app.services import model_service
    from app.services import agent_service

    model_service._model_cache["models"] = None
    model_service._model_cache["fetched_at"] = 0
    agent_service._compiled_graph = None
    agent_service._retriever = None
    agent_service._get_llm.cache_clear()

    yield

    model_service._model_cache["models"] = None
    model_service._model_cache["fetched_at"] = 0
    agent_service._compiled_graph = None
    agent_service._retriever = None
    agent_service._get_llm.cache_clear()


@pytest.fixture
def client():
    """A FastAPI TestClient built fresh per test, importing app.main lazily
    so the autouse cache-reset fixture above has already run."""
    from fastapi.testclient import TestClient
    from app.main import app

    # raise_server_exceptions=False mirrors a real deployment: unhandled
    # exceptions are caught by the catch-all handler and turned into a 500
    # response instead of propagating up through the test client.
    with TestClient(app, raise_server_exceptions=False) as test_client:
        yield test_client
