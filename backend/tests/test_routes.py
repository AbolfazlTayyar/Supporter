"""
Integration tests for the API routes, exercised through FastAPI's TestClient.
External dependencies (Groq, the vectorstore, LangGraph's LLM calls) are
mocked at the service layer so these tests run offline and deterministically.
"""

from app.api import routes
from app.exceptions import UpstreamServiceError


def test_health_returns_ok(client):
    response = client.get("/api/v1/health")

    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


def test_list_models_returns_service_response(client, monkeypatch):
    async def fake_get_models_response():
        return {"models": [{"id": "m1", "label": "m1"}], "default": "m1"}

    monkeypatch.setattr(routes.model_service, "get_models_response", fake_get_models_response)

    response = client.get("/api/v1/models")

    assert response.status_code == 200
    assert response.json() == {"models": [{"id": "m1", "label": "m1"}], "default": "m1"}


def test_chat_happy_path_returns_reply(client, monkeypatch):
    monkeypatch.setattr(routes, "run_agent", lambda message, model: "Hello there!")

    response = client.post("/api/v1/chat", json={"message": "hi"})

    assert response.status_code == 200
    assert response.json() == {"reply": "Hello there!"}


def test_chat_with_known_model_is_accepted(client, monkeypatch):
    async def fake_get_available_models():
        return [{"id": "allowed-model", "label": "allowed-model"}]

    monkeypatch.setattr(routes.model_service, "get_available_models", fake_get_available_models)
    monkeypatch.setattr(routes, "run_agent", lambda message, model: f"reply using {model}")

    response = client.post("/api/v1/chat", json={"message": "hi", "model": "allowed-model"})

    assert response.status_code == 200
    assert response.json() == {"reply": "reply using allowed-model"}


def test_chat_with_unknown_model_is_rejected(client, monkeypatch):
    async def fake_get_available_models():
        return [{"id": "allowed-model", "label": "allowed-model"}]

    monkeypatch.setattr(routes.model_service, "get_available_models", fake_get_available_models)

    response = client.post("/api/v1/chat", json={"message": "hi", "model": "not-a-real-model"})

    assert response.status_code == 400
    assert "Unknown model" in response.json()["error"]["message"]


def test_chat_rejects_blank_message(client):
    response = client.post("/api/v1/chat", json={"message": "   "})

    assert response.status_code == 422
    assert response.json() == {"error": {"message": "Invalid request data."}}


def test_chat_rejects_message_over_max_length(client):
    response = client.post("/api/v1/chat", json={"message": "x" * 2001})

    assert response.status_code == 422
    assert response.json() == {"error": {"message": "Invalid request data."}}


def test_chat_rejects_missing_message_field(client):
    response = client.post("/api/v1/chat", json={})

    assert response.status_code == 422
    assert response.json() == {"error": {"message": "Invalid request data."}}


def test_chat_translates_app_error_to_client_safe_response(client, monkeypatch):
    def raise_upstream_error(message, model):
        raise UpstreamServiceError()

    monkeypatch.setattr(routes, "run_agent", raise_upstream_error)

    response = client.post("/api/v1/chat", json={"message": "hi"})

    assert response.status_code == 502
    assert response.json() == {
        "error": {"message": "The AI service is temporarily unavailable. Please try again shortly."}
    }


def test_chat_hides_unexpected_exception_details(client, monkeypatch):
    def raise_unexpected_error(message, model):
        raise RuntimeError("some internal secret detail")

    monkeypatch.setattr(routes, "run_agent", raise_unexpected_error)

    response = client.post("/api/v1/chat", json={"message": "hi"})

    assert response.status_code == 500
    body = response.json()
    assert body == {"error": {"message": "Internal server error."}}
    assert "some internal secret detail" not in response.text
