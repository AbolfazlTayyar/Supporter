# CLAUDE.md

Guidance for Claude Code in this repo.

## Project

Mini AI Support Agent — a portfolio project: a chat assistant that either answers from a small knowledge base (RAG) or calls a mock order-lookup tool, decided by a LangGraph agent. FastAPI backend, React frontend, Groq LLM, Chroma vector store, Docker.

**Ground rules:** keep it small (RAG + one tool + one endpoint + one chat UI, nothing more). Basic Python experience — prefer simple, explicit code, comment non-obvious library behavior. No stubs/TODOs. Never commit `.env` files.

## Structure

- `backend/app/`: `api/` (thin routes) → `services/` (LangGraph agent, model caching) → `data/` (Chroma, fake orders, Groq HTTP client). Plus `exceptions.py`, `error_handlers.py`, `logging_config.py`. Route handlers never contain business logic.
- `backend/tests/`: pytest, mirrors the layers above.
- `frontend/src/features/chat/`: `api/` (only place that calls `fetch`), `hooks/` (state/logic), `components/` (presentational). `src/components/` is app-shell-only (e.g. `ErrorBoundary`).

## Commands

```bash
# Backend
cd backend && python -m venv venv && source venv/bin/activate
pip install -r requirements.txt && cp .env.example .env   # add GROQ_API_KEY
uvicorn app.main:app --reload
pip install -r requirements-dev.txt && pytest --cov=app --cov-report=term-missing

# Frontend
cd frontend && npm install && cp .env.example .env
npm run dev
npm test          # or npm run test:watch
npm run analyze   # bundle size treemap -> dist/stats.html

# Docker
cp backend/.env.example backend/.env   # add GROQ_API_KEY
docker compose up --build
```

Env vars: backend `GROQ_API_KEY` (required), `LOG_LEVEL` (default `INFO`); frontend `VITE_API_BASE_URL` (default `http://localhost:8000`, must be a Docker build `ARG` not a runtime var since Vite inlines it at build time).

## Backend rules

- Config only via `pydantic-settings`'s `settings` object — never `os.getenv` or hardcoded values.
- `requirements.txt`: exact pins (`==`) only. Regenerate `requirements-lock.txt` (`pip freeze`) after changes. Work inside `backend/venv`.
- Validate external input with Pydantic models — never hand-roll dict/JSON validation.
- Routes: versioned `/api/v1/...`, explicit `status_code`, typed `response_model` + docs (`summary`/`tags`/`responses`). Raise `AppError` subclasses (`app/exceptions.py`) instead of bare `HTTPException` — `400` invalid request, `502` upstream failure, `422` auto-validation.
- All error→response translation is centralized in `error_handlers.py`; never leak raw exceptions/tracebacks — catch-all returns a generic message and logs server-side.
- Structured JSON logging via `logging.getLogger(__name__)` only, configured once in `logging_config.py`. Never log API keys or raw chat content.
- Tests: mock all external calls (`respx` for HTTP, `monkeypatch` for LLM/retriever/model-fetch collaborators). Never hit real Groq/Chroma in tests.

## Frontend rules

- Feature-based folders, not type-based. `api/` = only fetch layer, `hooks/` = logic, `components/` = presentational only.
- Two-layer error handling: `ErrorBoundary` for render errors, `ApiError` (thrown from `chatApi.js`'s `handleResponse()`) for non-2xx responses — never call `res.json()` directly elsewhere.
- Follow Rules of Hooks strictly; correct `useEffect` deps. Extract imperative DOM logic into a hook only when genuinely reusable.
- Default to local `useState`/`useReducer` — no global store unless real cross-component sharing need arises.
- No routing yet (single screen); when a second screen is added, centralize routes and lazy-load with `React.lazy`/`Suspense`.
- Tests: Vitest + RTL, colocated `*.test.jsx`, query by role/text, mock only true boundaries (`chatApi`, jsdom gaps).
- Keep dependencies minimal (just `react`/`react-dom` at runtime) — check cost with `npm run analyze` before adding one.

## Status

Backend and frontend are both fully implemented, tested, and dockerized per the conventions above.
