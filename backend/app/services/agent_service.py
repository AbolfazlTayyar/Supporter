"""
The small "brain" of the assistant, built with LangGraph.

Flow:
  user message -> decide node -> either "rag" branch or "tool" branch -> answer node -> reply
"""

import logging
import re
from functools import lru_cache
from typing import TypedDict, Literal, Optional

from langchain_groq import ChatGroq
from langgraph.graph import StateGraph, END

from app.config import settings
from app.data.vectorstore import get_retriever
from app.data.orders import find_order
from app.exceptions import UpstreamServiceError
from app.services.model_service import DEFAULT_MODEL

logger = logging.getLogger(__name__)


@lru_cache(maxsize=None)
def _get_llm(model: str) -> ChatGroq:
    """One ChatGroq client per model, built lazily and reused across requests."""
    return ChatGroq(model=model, api_key=settings.groq_api_key)

# Built once at startup - reused for every request
_retriever = None


def _get_retriever():
    global _retriever
    if _retriever is None:
        _retriever = get_retriever()
    return _retriever


class AgentState(TypedDict):
    message: str
    route: Literal["rag", "tool"]
    context: str
    reply: str
    model: str


def decide_node(state: AgentState) -> AgentState:
    """Very simple routing: order-related questions -> tool, everything else -> RAG."""
    text = state["message"].lower()
    if "order" in text or "status" in text:
        state["route"] = "tool"
    else:
        state["route"] = "rag"
    logger.debug("Routed message to '%s' branch", state["route"])
    return state


def rag_node(state: AgentState) -> AgentState:
    """Retrieves relevant FAQ chunks and puts them into context for the LLM."""
    try:
        docs = _get_retriever().invoke(state["message"])
    except Exception as exc:
        # Embedding/vectorstore lookup failed - treat as an upstream/service error too.
        logger.error("Vectorstore retrieval failed: %s", exc)
        raise UpstreamServiceError() from exc
    state["context"] = "\n\n".join(d.page_content for d in docs)
    logger.debug("Retrieved %d document chunk(s) for RAG context", len(docs))
    return state


def tool_node(state: AgentState) -> AgentState:
    """Extracts an order ID from the message (simple regex) and looks up its status."""
    match = re.search(r"\b\d{4}\b", state["message"])
    if not match:
        logger.debug("Tool branch: no order ID found in message")
        state["context"] = "No order ID was found in the message. Ask the user for their order ID."
        return state

    order_id = match.group()
    order = find_order(order_id)
    if order:
        logger.debug("Tool branch: found order %s (status=%s)", order_id, order["status"])
        state["context"] = f"Order {order_id} status: {order['status']} (ETA: {order['eta']})."
    else:
        logger.debug("Tool branch: no order found with ID %s", order_id)
        state["context"] = f"No order found with ID {order_id}."
    return state


def answer_node(state: AgentState) -> AgentState:
    """Asks the LLM to produce the final reply, given whatever context was gathered."""
    prompt = (
        "You are a helpful customer support assistant. "
        "Use the context below to answer the user's question naturally and briefly.\n\n"
        f"Context:\n{state['context']}\n\n"
        f"User question: {state['message']}"
    )
    llm = _get_llm(state["model"])
    try:
        response = llm.invoke(prompt)
    except Exception as exc:
        # Groq call failed (network issue, rate limit, bad model name, etc.) - surface
        # this as a known upstream error instead of a raw/unclear exception.
        logger.error("Groq LLM call failed (model=%s): %s", state["model"], exc)
        raise UpstreamServiceError() from exc
    state["reply"] = response.content
    logger.debug("LLM produced reply (model=%s, reply_length=%d)", state["model"], len(state["reply"]))
    return state


def _route_decision(state: AgentState) -> str:
    return state["route"]


def build_graph():
    graph = StateGraph(AgentState)

    graph.add_node("decide", decide_node)
    graph.add_node("rag", rag_node)
    graph.add_node("tool", tool_node)
    graph.add_node("answer", answer_node)

    graph.set_entry_point("decide")
    graph.add_conditional_edges("decide", _route_decision, {"rag": "rag", "tool": "tool"})
    graph.add_edge("rag", "answer")
    graph.add_edge("tool", "answer")
    graph.add_edge("answer", END)

    return graph.compile()


# Built once and reused across requests
_compiled_graph = None


def run_agent(message: str, model: Optional[str] = None) -> str:
    global _compiled_graph
    if _compiled_graph is None:
        _compiled_graph = build_graph()

    result = _compiled_graph.invoke(
        {"message": message, "route": "rag", "context": "", "reply": "", "model": model or DEFAULT_MODEL}
    )
    return result["reply"]
