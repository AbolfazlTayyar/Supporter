from types import SimpleNamespace

import pytest

from app.exceptions import UpstreamServiceError
from app.services import agent_service


# --- decide_node ---------------------------------------------------------

@pytest.mark.parametrize("message", ["What's the status of my order?", "Where is my ORDER"])
def test_decide_node_routes_order_related_messages_to_tool(message):
    state = {"message": message, "route": "rag", "context": "", "reply": "", "model": "m"}
    result = agent_service.decide_node(state)
    assert result["route"] == "tool"


def test_decide_node_routes_other_messages_to_rag():
    state = {"message": "What are your business hours?", "route": "rag", "context": "", "reply": "", "model": "m"}
    result = agent_service.decide_node(state)
    assert result["route"] == "rag"


# --- tool_node -------------------------------------------------------------

def test_tool_node_returns_status_for_known_order():
    state = {"message": "status of order 1001 please", "route": "tool", "context": "", "reply": "", "model": "m"}
    result = agent_service.tool_node(state)
    assert "Shipped" in result["context"]
    assert "1001" in result["context"]


def test_tool_node_reports_missing_order():
    state = {"message": "status of order 9999", "route": "tool", "context": "", "reply": "", "model": "m"}
    result = agent_service.tool_node(state)
    assert "No order found" in result["context"]


def test_tool_node_asks_for_order_id_when_none_present():
    state = {"message": "what's my order status", "route": "tool", "context": "", "reply": "", "model": "m"}
    result = agent_service.tool_node(state)
    assert "No order ID was found" in result["context"]


# --- rag_node ----------------------------------------------------------

def test_rag_node_joins_retrieved_document_chunks(monkeypatch):
    fake_docs = [SimpleNamespace(page_content="chunk one"), SimpleNamespace(page_content="chunk two")]
    fake_retriever = SimpleNamespace(invoke=lambda query: fake_docs)
    monkeypatch.setattr(agent_service, "_get_retriever", lambda: fake_retriever)

    state = {"message": "what are your hours?", "route": "rag", "context": "", "reply": "", "model": "m"}
    result = agent_service.rag_node(state)

    assert result["context"] == "chunk one\n\nchunk two"


def test_rag_node_raises_upstream_error_when_retrieval_fails(monkeypatch):
    def broken_retriever():
        raise RuntimeError("chroma is down")

    monkeypatch.setattr(agent_service, "_get_retriever", broken_retriever)

    state = {"message": "what are your hours?", "route": "rag", "context": "", "reply": "", "model": "m"}
    with pytest.raises(UpstreamServiceError):
        agent_service.rag_node(state)


# --- answer_node -------------------------------------------------------

def test_answer_node_sets_reply_from_llm_response(monkeypatch):
    fake_llm = SimpleNamespace(invoke=lambda prompt: SimpleNamespace(content="Here is your answer."))
    monkeypatch.setattr(agent_service, "_get_llm", lambda model: fake_llm)

    state = {"message": "hi", "route": "rag", "context": "some context", "reply": "", "model": "test-model"}
    result = agent_service.answer_node(state)

    assert result["reply"] == "Here is your answer."


def test_answer_node_raises_upstream_error_when_llm_call_fails(monkeypatch):
    def broken_invoke(prompt):
        raise RuntimeError("boom")

    fake_llm = SimpleNamespace(invoke=broken_invoke)
    monkeypatch.setattr(agent_service, "_get_llm", lambda model: fake_llm)

    state = {"message": "hi", "route": "rag", "context": "", "reply": "", "model": "test-model"}
    with pytest.raises(UpstreamServiceError):
        agent_service.answer_node(state)


# --- run_agent (end-to-end through the compiled graph) ----------------

def test_run_agent_tool_branch_end_to_end(monkeypatch):
    fake_llm = SimpleNamespace(invoke=lambda prompt: SimpleNamespace(content=f"answer: {prompt}"))
    monkeypatch.setattr(agent_service, "_get_llm", lambda model: fake_llm)

    reply = agent_service.run_agent("what's the status of order 1001?")

    assert "Shipped" in reply


def test_run_agent_rag_branch_end_to_end(monkeypatch):
    fake_docs = [SimpleNamespace(page_content="We are open 9-5 on weekdays.")]
    fake_retriever = SimpleNamespace(invoke=lambda query: fake_docs)
    fake_llm = SimpleNamespace(invoke=lambda prompt: SimpleNamespace(content=f"answer: {prompt}"))
    monkeypatch.setattr(agent_service, "_get_retriever", lambda: fake_retriever)
    monkeypatch.setattr(agent_service, "_get_llm", lambda model: fake_llm)

    reply = agent_service.run_agent("what are your business hours?")

    assert "open 9-5" in reply


def test_run_agent_uses_default_model_when_none_given(monkeypatch):
    seen_models = []

    def fake_get_llm(model):
        seen_models.append(model)
        return SimpleNamespace(invoke=lambda prompt: SimpleNamespace(content="ok"))

    monkeypatch.setattr(agent_service, "_get_llm", fake_get_llm)

    agent_service.run_agent("order 1001 status", model=None)

    assert seen_models == [agent_service.DEFAULT_MODEL]


def test_run_agent_passes_through_requested_model(monkeypatch):
    seen_models = []

    def fake_get_llm(model):
        seen_models.append(model)
        return SimpleNamespace(invoke=lambda prompt: SimpleNamespace(content="ok"))

    monkeypatch.setattr(agent_service, "_get_llm", fake_get_llm)

    agent_service.run_agent("order 1001 status", model="custom-model")

    assert seen_models == ["custom-model"]
