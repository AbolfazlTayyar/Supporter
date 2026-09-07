import httpx
import pytest

from app.services import model_service


RAW_MODELS = [
    {"id": "llama-3.1-8b"},
    {"id": "openai/gpt-oss-20b"},
    {"id": "whisper-large-v3"},
    {"id": "playai-tts"},
    {"id": "meta-llama/llama-prompt-guard-2"},
]


async def test_get_available_models_filters_out_non_chat_models(monkeypatch):
    async def fake_fetch_models():
        return RAW_MODELS

    monkeypatch.setattr(model_service.groq_client, "fetch_models", fake_fetch_models)

    models = await model_service.get_available_models()

    assert models == [
        {"id": "llama-3.1-8b", "label": "llama-3.1-8b"},
        {"id": "openai/gpt-oss-20b", "label": "openai/gpt-oss-20b"},
    ]


async def test_get_available_models_sorts_by_id(monkeypatch):
    async def fake_fetch_models():
        return [{"id": "z-model"}, {"id": "a-model"}]

    monkeypatch.setattr(model_service.groq_client, "fetch_models", fake_fetch_models)

    models = await model_service.get_available_models()

    assert [m["id"] for m in models] == ["a-model", "z-model"]


async def test_get_available_models_uses_cache_on_second_call(monkeypatch):
    call_count = 0

    async def fake_fetch_models():
        nonlocal call_count
        call_count += 1
        return RAW_MODELS

    monkeypatch.setattr(model_service.groq_client, "fetch_models", fake_fetch_models)

    await model_service.get_available_models()
    await model_service.get_available_models()

    assert call_count == 1


async def test_get_available_models_refetches_after_cache_expires(monkeypatch):
    call_count = 0

    async def fake_fetch_models():
        nonlocal call_count
        call_count += 1
        return RAW_MODELS

    monkeypatch.setattr(model_service.groq_client, "fetch_models", fake_fetch_models)

    await model_service.get_available_models()
    # Simulate the cache having gone stale.
    model_service._model_cache["fetched_at"] -= model_service._MODEL_CACHE_TTL_SECONDS + 1
    await model_service.get_available_models()

    assert call_count == 2


async def test_get_available_models_falls_back_to_default_when_groq_unreachable(monkeypatch):
    async def fake_fetch_models():
        raise httpx.ConnectError("connection refused")

    monkeypatch.setattr(model_service.groq_client, "fetch_models", fake_fetch_models)

    models = await model_service.get_available_models()

    assert models == [{"id": model_service.DEFAULT_MODEL, "label": model_service.DEFAULT_MODEL}]


async def test_get_available_models_falls_back_to_previous_cache_when_groq_unreachable(monkeypatch):
    call_count = 0

    async def fake_fetch_models():
        nonlocal call_count
        call_count += 1
        if call_count == 1:
            return RAW_MODELS
        raise httpx.ConnectError("connection refused")

    monkeypatch.setattr(model_service.groq_client, "fetch_models", fake_fetch_models)

    first = await model_service.get_available_models()
    model_service._model_cache["fetched_at"] -= model_service._MODEL_CACHE_TTL_SECONDS + 1
    second = await model_service.get_available_models()

    assert second == first


async def test_get_models_response_includes_default_when_available(monkeypatch):
    async def fake_fetch_models():
        return RAW_MODELS

    monkeypatch.setattr(model_service.groq_client, "fetch_models", fake_fetch_models)
    monkeypatch.setattr(model_service, "DEFAULT_MODEL", "openai/gpt-oss-20b")

    response = await model_service.get_models_response()

    assert response["default"] == "openai/gpt-oss-20b"
    assert {"id": "openai/gpt-oss-20b", "label": "openai/gpt-oss-20b"} in response["models"]


async def test_get_models_response_falls_back_to_first_model_when_default_unavailable(monkeypatch):
    async def fake_fetch_models():
        return [{"id": "llama-3.1-8b"}]

    monkeypatch.setattr(model_service.groq_client, "fetch_models", fake_fetch_models)
    monkeypatch.setattr(model_service, "DEFAULT_MODEL", "nonexistent-model")

    response = await model_service.get_models_response()

    assert response["default"] == "llama-3.1-8b"
