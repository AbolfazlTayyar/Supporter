import httpx
import pytest
import respx

from app.data import groq_client


@respx.mock
async def test_fetch_models_returns_data_list():
    respx.get("https://api.groq.com/openai/v1/models").mock(
        return_value=httpx.Response(200, json={"data": [{"id": "model-a"}, {"id": "model-b"}]})
    )

    models = await groq_client.fetch_models()

    assert models == [{"id": "model-a"}, {"id": "model-b"}]


@respx.mock
async def test_fetch_models_sends_bearer_token():
    route = respx.get("https://api.groq.com/openai/v1/models").mock(
        return_value=httpx.Response(200, json={"data": []})
    )

    await groq_client.fetch_models()

    assert route.calls.last.request.headers["Authorization"] == "Bearer test-api-key"


@respx.mock
async def test_fetch_models_raises_on_http_error_status():
    respx.get("https://api.groq.com/openai/v1/models").mock(return_value=httpx.Response(500))

    with pytest.raises(httpx.HTTPStatusError):
        await groq_client.fetch_models()


@respx.mock
async def test_fetch_models_handles_missing_data_key():
    respx.get("https://api.groq.com/openai/v1/models").mock(return_value=httpx.Response(200, json={}))

    assert await groq_client.fetch_models() == []
