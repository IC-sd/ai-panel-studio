"""Configuration API routes — manage API key at runtime."""

from __future__ import annotations

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from backend.services import runtime_config

router = APIRouter(prefix="/api/config", tags=["config"])


class ConfigUpdate(BaseModel):
    key: str = Field(..., description="配置项名称")
    value: str = Field(..., description="配置值（留空则清除）")


class ConfigResponse(BaseModel):
    configured_keys: list[str]


ALLOWED_KEYS = {
    "deepseek_api_key": "API Key",
    "deepseek_model": "模型",
    "deepseek_api_base": "API 地址",
}


@router.get("")
async def get_config() -> dict:
    """Return which config keys are currently set (NOT the values)."""
    keys = []
    for k in ALLOWED_KEYS:
        if runtime_config.has(k):
            keys.append(k)
    return {"configured_keys": keys}


@router.post("")
async def set_config(update: ConfigUpdate) -> dict:
    """Set a runtime config value."""
    if update.key not in ALLOWED_KEYS:
        from fastapi import HTTPException
        raise HTTPException(status_code=400, detail=f"Unknown config key: {update.key}")
    if update.value:
        runtime_config.set(update.key, update.value)
    else:
        runtime_config.delete(update.key)
    return {"status": "ok", "key": update.key, "configured": bool(update.value)}
