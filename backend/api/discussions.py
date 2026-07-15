"""Discussions API routes."""

from __future__ import annotations

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from backend.models.discussion import (
    Discussion,
    DiscussionStatus,
    create_discussion,
    get_discussion,
    list_discussions,
    delete_discussion,
    update_discussion_status,
)
from backend.models.expert import get_experts_by_discussion
from backend.models.transcript import get_transcript, get_consensus_divergence
from backend.services.discussion_engine import engine

router = APIRouter(prefix="/api/discussions", tags=["discussions"])


class CreateDiscussionRequest(BaseModel):
    topic: str = Field(..., min_length=2, max_length=500, description="讨论议题")
    expert_count: int = Field(default=4, ge=2, le=8, description="专家数量")


class DiscussionResponse(BaseModel):
    id: str
    title: str
    topic: str
    expert_count: int
    status: str
    host_summary: str | None = None
    created_at: str
    updated_at: str


@router.get("")
async def list_all_discussions() -> list[dict]:
    """Get all discussions."""
    discussions = list_discussions()
    return [d.to_dict() for d in discussions]


@router.post("", status_code=201)
async def create_new_discussion(req: CreateDiscussionRequest) -> dict:
    """Create a discussion and generate experts."""
    disc = await engine.create_and_prepare(req.topic, req.expert_count)
    return disc.to_dict()


@router.get("/{disc_id}")
async def get_discussion_detail(disc_id: str) -> dict:
    """Get discussion details with experts and summary."""
    disc = get_discussion(disc_id)
    if not disc:
        raise HTTPException(status_code=404, detail="讨论不存在")
    result = disc.to_dict()
    result["experts"] = [e.to_dict() for e in get_experts_by_discussion(disc_id)]
    result["transcript"] = [t.to_dict() for t in get_transcript(disc_id)]
    result["consensus_divergence"] = [c.to_dict() for c in get_consensus_divergence(disc_id)]
    return result


@router.post("/{disc_id}/start")
async def start_discussion(disc_id: str) -> dict:
    """Start the round-table discussion."""
    disc = get_discussion(disc_id)
    if not disc:
        raise HTTPException(status_code=404, detail="讨论不存在")
    if disc.status not in (DiscussionStatus.PENDING, DiscussionStatus.PREPARING):
        raise HTTPException(status_code=400, detail="当前状态无法开始讨论")
    await engine.start_discussion(disc_id)
    return {"status": "started", "id": disc_id}


@router.post("/{disc_id}/pause")
async def pause_discussion(disc_id: str) -> dict:
    """Pause a running discussion."""
    disc = get_discussion(disc_id)
    if not disc:
        raise HTTPException(status_code=404, detail="讨论不存在")
    await engine.pause_discussion(disc_id)
    return {"status": "paused", "id": disc_id}


@router.post("/{disc_id}/resume")
async def resume_discussion(disc_id: str) -> dict:
    """Resume a paused discussion."""
    disc = get_discussion(disc_id)
    if not disc:
        raise HTTPException(status_code=404, detail="讨论不存在")
    await engine.resume_discussion(disc_id)
    return {"status": "resumed", "id": disc_id}


@router.delete("/{disc_id}")
async def delete_discussion_route(disc_id: str) -> dict:
    """Delete a discussion and all related data."""
    disc = get_discussion(disc_id)
    if not disc:
        raise HTTPException(status_code=404, detail="讨论不存在")
    delete_discussion(disc_id)
    return {"status": "deleted", "id": disc_id}
