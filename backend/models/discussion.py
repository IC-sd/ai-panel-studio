"""Discussion model and data access."""

from __future__ import annotations

import json
import uuid
from dataclasses import dataclass, field
from datetime import datetime
from enum import Enum
from typing import Optional


class DiscussionStatus(str, Enum):
    PENDING = "pending"
    PREPARING = "preparing"
    ACTIVE = "active"
    PAUSED = "paused"
    COMPLETED = "completed"


@dataclass
class Discussion:
    id: str = field(default_factory=lambda: uuid.uuid4().hex[:12])
    title: str = ""
    topic: str = ""
    expert_count: int = 4
    status: DiscussionStatus = DiscussionStatus.PENDING
    host_summary: Optional[str] = None
    created_at: str = field(default_factory=lambda: datetime.utcnow().isoformat())
    updated_at: str = field(default_factory=lambda: datetime.utcnow().isoformat())

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "title": self.title,
            "topic": self.topic,
            "expert_count": self.expert_count,
            "status": self.status.value,
            "host_summary": self.host_summary,
            "created_at": self.created_at,
            "updated_at": self.updated_at,
        }


def row_to_discussion(row) -> Discussion:
    return Discussion(
        id=row["id"],
        title=row["title"],
        topic=row["topic"],
        expert_count=row["expert_count"],
        status=DiscussionStatus(row["status"]),
        host_summary=row["host_summary"],
        created_at=row["created_at"],
        updated_at=row["updated_at"],
    )


# ---- Data Access ----

from backend.database import get_connection


def create_discussion(d: Discussion) -> Discussion:
    conn = get_connection()
    now = datetime.utcnow().isoformat()
    conn.execute(
        """INSERT INTO discussions (id, title, topic, expert_count, status, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?)""",
        (d.id, d.title, d.topic, d.expert_count, d.status.value, now, now),
    )
    conn.commit()
    d.created_at = now
    d.updated_at = now
    return d


def get_discussion(disc_id: str) -> Optional[Discussion]:
    conn = get_connection()
    row = conn.execute(
        "SELECT * FROM discussions WHERE id = ?", (disc_id,)
    ).fetchone()
    return row_to_discussion(row) if row else None


def list_discussions() -> list[Discussion]:
    conn = get_connection()
    rows = conn.execute(
        "SELECT * FROM discussions ORDER BY updated_at DESC"
    ).fetchall()
    return [row_to_discussion(r) for r in rows]


def update_discussion_status(disc_id: str, status: DiscussionStatus) -> None:
    conn = get_connection()
    now = datetime.utcnow().isoformat()
    conn.execute(
        "UPDATE discussions SET status = ?, updated_at = ? WHERE id = ?",
        (status.value, now, disc_id),
    )
    conn.commit()


def update_discussion_summary(disc_id: str, summary: str) -> None:
    conn = get_connection()
    now = datetime.utcnow().isoformat()
    conn.execute(
        "UPDATE discussions SET host_summary = ?, status = ?, updated_at = ? WHERE id = ?",
        (summary, DiscussionStatus.COMPLETED.value, now, disc_id),
    )
    conn.commit()


def delete_discussion(disc_id: str) -> None:
    conn = get_connection()
    conn.execute("DELETE FROM discussions WHERE id = ?", (disc_id,))
    conn.commit()
