import logging
import time

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings  # noqa: F401  (imported to fail fast if config is invalid)
from app.logging_config import configure_logging
from app.api.routes import router
from app.error_handlers import register_exception_handlers

# Must run before any other module logs, so every logger shares this setup.
configure_logging()
logger = logging.getLogger(__name__)

app = FastAPI(
    title="Mini AI Support Agent",
    description=(
        "A chat assistant that answers from a small knowledge base (RAG) or calls a "
        "mock order-status tool, decided by a LangGraph agent. "
        "Interactive docs: Swagger UI at /docs, ReDoc at /redoc, raw schema at /openapi.json."
    ),
    version="1.0.0",
)

# Allow the React dev server to call this API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.middleware("http")
async def log_requests(request: Request, call_next):
    """Logs one line per request (method, path, status code, duration) so
    there's basic request visibility without adding logging to every route."""
    start = time.perf_counter()
    response = await call_next(request)
    duration_ms = (time.perf_counter() - start) * 1000
    logger.info(
        "%s %s -> %d (%.1fms)",
        request.method,
        request.url.path,
        response.status_code,
        duration_ms,
    )
    return response


register_exception_handlers(app)
app.include_router(router)

logger.info("Application startup complete (log_level=%s)", settings.log_level)
