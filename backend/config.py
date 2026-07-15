"""Application configuration loaded from environment variables."""

from __future__ import annotations

import os
from dataclasses import dataclass, field
from pathlib import Path

from dotenv import load_dotenv

load_dotenv()


@dataclass
class Settings:
    deepseek_api_key: str = field(
        default_factory=lambda: os.getenv("DEEPSEEK_API_KEY", "")
    )
    deepseek_api_base: str = field(
        default_factory=lambda: os.getenv(
            "DEEPSEEK_API_BASE", "https://api.deepseek.com/v1"
        )
    )
    deepseek_model: str = field(
        default_factory=lambda: os.getenv("DEEPSEEK_MODEL", "deepseek-chat")
    )
    database_path: str = field(
        default_factory=lambda: os.getenv(
            "DATABASE_PATH",
            str(Path(__file__).resolve().parent.parent / "data" / "panel_studio.db"),
        )
    )
    host: str = field(default_factory=lambda: os.getenv("HOST", "0.0.0.0"))
    port: int = field(
        default_factory=lambda: int(os.getenv("PORT", "8000"))
    )


settings = Settings()
