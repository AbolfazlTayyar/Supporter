"""
Centralized exception handling. Every error path - a known AppError, a
request validation failure, an HTTPException, or a totally unexpected
exception - is turned into the same JSON shape, and unexpected exceptions
never leak their message or stack trace to the client (they're logged
server-side instead).
"""

import logging

from fastapi import FastAPI, Request, status
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from starlette.exceptions import HTTPException as StarletteHTTPException

from app.exceptions import AppError

logger = logging.getLogger(__name__)


def _error_response(status_code: int, message: str) -> JSONResponse:
    return JSONResponse(status_code=status_code, content={"error": {"message": message}})


def register_exception_handlers(app: FastAPI) -> None:
    """Registers all exception handlers on the FastAPI app. Call once at startup."""

    @app.exception_handler(AppError)
    async def app_error_handler(request: Request, exc: AppError) -> JSONResponse:
        logger.warning("Handled application error on %s %s: %s", request.method, request.url.path, exc.message)
        return _error_response(exc.status_code, exc.message)

    @app.exception_handler(RequestValidationError)
    async def validation_error_handler(request: Request, exc: RequestValidationError) -> JSONResponse:
        # Don't echo back raw pydantic internals - just tell the client the request was bad.
        return _error_response(status.HTTP_422_UNPROCESSABLE_ENTITY, "Invalid request data.")

    @app.exception_handler(StarletteHTTPException)
    async def http_exception_handler(request: Request, exc: StarletteHTTPException) -> JSONResponse:
        # Covers fastapi.HTTPException raised explicitly in route handlers.
        return _error_response(exc.status_code, str(exc.detail))

    @app.exception_handler(Exception)
    async def unhandled_exception_handler(request: Request, exc: Exception) -> JSONResponse:
        # Catch-all safety net: log the real error, return a generic message.
        logger.exception("Unhandled exception on %s %s", request.method, request.url.path)
        return _error_response(status.HTTP_500_INTERNAL_SERVER_ERROR, "Internal server error.")
