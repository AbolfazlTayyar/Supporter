"""
Domain-level exceptions. Services/data code raises these for known failure
cases; the handlers in app/error_handlers.py turn them into a consistent JSON
response. Kept at the top level (like config.py) so any layer can import it
without creating a dependency back onto the api layer.
"""


class AppError(Exception):
    """Base class for expected application errors that map to an HTTP response."""

    status_code = 500
    message = "Something went wrong."

    def __init__(self, message: str | None = None):
        self.message = message or self.message
        super().__init__(self.message)


class UpstreamServiceError(AppError):
    """Raised when a call to an external service (e.g. Groq) fails or times out."""

    status_code = 502
    message = "The AI service is temporarily unavailable. Please try again shortly."


class InvalidRequestError(AppError):
    """Raised when a request is well-formed but refers to something invalid
    (e.g. an unknown model id) - a 400, as opposed to the 422s Pydantic/FastAPI
    already produce for malformed request bodies."""

    status_code = 400
    message = "Invalid request."
