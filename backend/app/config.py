"""
Centralized app configuration, loaded from environment variables (and a local
.env file via python-dotenv). Import `settings` instead of reading
os.environ directly - keeps secrets out of the code and gives us a single
place that validates required config at startup.
"""

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    # Required - no default, so startup fails fast with a clear error if it's missing.
    groq_api_key: str

    # Optional, with a sensible default.
    groq_model: str = "openai/gpt-oss-20b"

    # Standard library logging level name (DEBUG, INFO, WARNING, ERROR).
    log_level: str = "INFO"

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")


# Built once at import time and reused everywhere.
settings = Settings()
