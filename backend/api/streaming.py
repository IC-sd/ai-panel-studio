"""Streaming API routes (SSE)."""

from __future__ import annotations

from fastapi import APIRouter, Request
from fastapi.responses import StreamingResponse

from backend.services.sse_manager import sse_manager
from backend.models.discussion import get_discussion

router = APIRouter(prefix="/api/stream", tags=["streaming"])


@router.get("/{disc_id}")
async def stream_discussion(disc_id: str, request: Request):
    """SSE endpoint for real-time discussion updates."""
    disc = get_discussion(disc_id)
    if not disc:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="讨论不存在")

    queue = sse_manager.subscribe(disc_id)

    async def event_generator():
        async for message in sse_manager.event_stream(disc_id, queue):
            if await request.is_disconnected():
                break
            yield message

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )
