"""In-memory runtime configuration (API key, etc.).
Values set via the API take precedence over .env file settings.
"""

from __future__ import annotations

from typing import Optional

_runtime_config: dict[str, str] = {}


def set(key: str, value: str) -> None:
    _runtime_config[key] = value


def get(key: str, default: str = "") -> str:
    return _runtime_config.get(key, default)


def has(key: str) -> bool:
    return key in _runtime_config


def delete(key: str) -> None:
    _runtime_config.pop(key, None)


# Well-known config keys
DEEPSEEK_API_KEY = "deepseek_api_key"
DEEPSEEK_MODEL = "deepseek_model"
DEEPSEEK_API_BASE = "deepseek_api_base"
