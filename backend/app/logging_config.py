"""
Centralized logging setup. Configures the root logger once at startup so
every module's logger (created with `logging.getLogger(__name__)`) shares the
same structured format and level - call configure_logging() once from
main.py before anything else runs.
"""

import json
import logging
import sys

from app.config import settings


class JsonFormatter(logging.Formatter):
    """Formats each log record as one JSON line, so logs stay machine-
    readable (easy to grep, or ship to a log aggregator) instead of free text."""

    def format(self, record: logging.LogRecord) -> str:
        payload = {
            "timestamp": self.formatTime(record, "%Y-%m-%dT%H:%M:%S"),
            "level": record.levelname,
            "logger": record.name,
            "message": record.getMessage(),
        }
        if record.exc_info:
            payload["exception"] = self.formatException(record.exc_info)
        return json.dumps(payload)


def configure_logging() -> None:
    """Sets up the root logger with a single stdout handler. Call once at
    process startup (see main.py) - every other module just does
    `logging.getLogger(__name__)` and inherits this configuration."""
    root = logging.getLogger()
    root.setLevel(settings.log_level)

    handler = logging.StreamHandler(sys.stdout)
    handler.setFormatter(JsonFormatter())

    root.handlers.clear()
    root.addHandler(handler)

    # These libraries log every HTTP call at INFO, which is too noisy for our
    # purposes - keep them quiet unless something actually goes wrong.
    for noisy_logger in ("httpx", "httpcore"):
        logging.getLogger(noisy_logger).setLevel(logging.WARNING)
