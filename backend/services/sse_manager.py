"""Server-Sent Events connection manager.

Manages per-discussion SSE connections for real-time updates.
"""

from __future__ import annotations

import asyncio
import json
from typing import AsyncGenerator


class SSEManager:
    """Manages SSE connections keyed by discussion_id."""

    def __init__(self) -> None:
        self._subscribers: dict[str, list[asyncio.Queue]] = {}

    def subscribe(self, discussion_id: str) -> asyncio.Queue:
        """Register a new subscriber queue for a discussion."""
        if discussion_id not in self._subscribers:
            self._subscribers[discussion_id] = []
        queue: asyncio.Queue = asyncio.Queue()
        self._subscribers[discussion_id].append(queue)
        return queue

    def unsubscribe(self, discussion_id: str, queue: asyncio.Queue) -> None:
        """Remove a subscriber queue."""
        if discussion_id in self._subscribers:
            self._subscribers[discussion_id] = [
                q for q in self._subscribers[discussion_id] if q is not queue
            ]
            if not self._subscribers[discussion_id]:
                del self._subscribers[discussion_id]

    async def publish(self, discussion_id: str, event: str, data: object) -> None:
        """Publish an event to all subscribers of a discussion."""
        if discussion_id not in self._subscribers:
            return
        payload = json.dumps(data, ensure_ascii=False)
        message = f"event: {event}\ndata: {payload}\n\n"
        for queue in self._subscribers[discussion_id]:
            await queue.put(message)

    async def broadcast_all(self, event: str, data: object) -> None:
        """Broadcast to ALL discussions (e.g., for dashboard updates)."""
        payload = json.dumps(data, ensure_ascii=False)
        message = f"event: {event}\ndata: {payload}\n\n"
        for disc_id in list(self._subscribers.keys()):
            for queue in self._subscribers.get(disc_id, []):
                await queue.put(message)

    async def event_stream(
        self, discussion_id: str, queue: asyncio.Queue
    ) -> AsyncGenerator[str, None]:
        """Async generator for SSE endpoint."""
        try:
            while True:
                try:
                    message = await asyncio.wait_for(queue.get(), timeout=30.0)
                    yield message
                except asyncio.TimeoutError:
                    yield "event: ping\ndata: {}\n\n"
        except asyncio.CancelledError:
            pass
        finally:
            self.unsubscribe(discussion_id, queue)


# Global SSE manager instance
sse_manager = SSEManager()
