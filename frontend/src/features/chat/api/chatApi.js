// All raw HTTP calls to the backend for the chat feature live here, so
// components/hooks never call fetch() directly.

// Vite only exposes env vars prefixed with VITE_ to client code (see
// frontend/.env.example). Falls back to the local backend default so dev
// still works if the var isn't set.
const API_BASE = `${import.meta.env.VITE_API_BASE_URL || "http://localhost:8000"}/api/v1`;

// Thrown for any non-2xx response. Carries the backend's own message (it
// always replies with {"error": {"message": "..."}}, see error_handlers.py)
// so callers can show something more useful than a generic failure.
export class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

async function handleResponse(res) {
  if (!res.ok) {
    let message = "Something went wrong. Please try again.";
    try {
      const body = await res.json();
      if (body?.error?.message) message = body.error.message;
    } catch {
      // Body wasn't JSON (or was empty) - fall back to the generic message.
    }
    throw new ApiError(message, res.status);
  }
  return res.json();
}

export async function fetchModels() {
  const res = await fetch(`${API_BASE}/models`);
  return handleResponse(res);
}

export async function sendChatMessage(message, model) {
  const res = await fetch(`${API_BASE}/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message, model: model || undefined }),
  });
  return handleResponse(res);
}
