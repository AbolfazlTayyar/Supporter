"""
API routes (controllers). Handlers stay thin: parse the request, call a
service, return the response - no business logic lives here.
"""

import logging
from typing import Optional

from fastapi import APIRouter, status
from pydantic import BaseModel, Field, field_validator

from app.exceptions import InvalidRequestError
from app.services import model_service
from app.services.agent_service import run_agent

logger = logging.getLogger(__name__)

# All routes are versioned under /api/v1 so the API can evolve (e.g. /api/v2)
# without breaking existing clients.
router = APIRouter(prefix="/api/v1")


class ChatRequest(BaseModel):
    # Bounds keep the request sane before it ever reaches the agent/LLM call.
    message: str = Field(min_length=1, max_length=2000)
    model: Optional[str] = Field(default=None, max_length=100)

    @field_validator("message")
    @classmethod
    def message_not_blank(cls, value: str) -> str:
        value = value.strip()
        if not value:
            raise ValueError("message must not be blank")
        return value


class ChatResponse(BaseModel):
    reply: str


class HealthResponse(BaseModel):
    status: str


class ModelInfo(BaseModel):
    id: str
    label: str


class ModelsResponse(BaseModel):
    models: list[ModelInfo]
    default: str


class ErrorDetail(BaseModel):
    message: str


class ErrorResponse(BaseModel):
    # Mirrors the JSON shape every error handler in app/error_handlers.py returns.
    error: ErrorDetail


@router.get(
    "/health",
    response_model=HealthResponse,
    status_code=status.HTTP_200_OK,
    tags=["health"],
    summary="Health check",
    description="Liveness check used by orchestrators/monitoring - always returns ok if the app is running.",
)
async def health():
    return {"status": "ok"}


@router.get(
    "/models",
    response_model=ModelsResponse,
    status_code=status.HTTP_200_OK,
    tags=["models"],
    summary="List available chat models",
    description="Returns the chat-capable Groq models this API key can use, plus the default model to preselect.",
    responses={
        502: {"model": ErrorResponse, "description": "The AI service is temporarily unavailable."},
    },
)
async def list_models():
    return await model_service.get_models_response()


@router.post(
    "/chat",
    response_model=ChatResponse,
    status_code=status.HTTP_200_OK,
    tags=["chat"],
    summary="Send a chat message",
    description=(
        "Runs the LangGraph agent on the given message: it answers from the knowledge base (RAG) "
        "or calls the mock order-status tool, depending on the message content."
    ),
    responses={
        400: {"model": ErrorResponse, "description": "The request refers to an unknown model id."},
        502: {"model": ErrorResponse, "description": "The AI service is temporarily unavailable."},
    },
)
async def chat(request: ChatRequest):
    # Log request shape, never the message/reply text itself - chat content
    # can carry customer PII (names, order details, etc.) that shouldn't end
    # up in logs.
    logger.info("Chat request received (message_length=%d, model=%s)", len(request.message), request.model or "default")

    if request.model is not None:
        available = await model_service.get_available_models()
        if not any(m["id"] == request.model for m in available):
            logger.warning("Chat request rejected: unknown model %s", request.model)
            raise InvalidRequestError(f"Unknown model: {request.model}")

    reply = run_agent(request.message, request.model)
    logger.info("Chat request completed (reply_length=%d)", len(reply))
    return ChatResponse(reply=reply)
