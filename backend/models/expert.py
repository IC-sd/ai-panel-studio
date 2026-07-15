"""Expert model and data access."""

from __future__ import annotations

import json
import uuid
from dataclasses import dataclass, field as dataclass_field
from datetime import datetime
from enum import Enum
from typing import Optional


class ExpertStatus(str, Enum):
    STANDBY = "standby"
    PREPARING = "preparing"
    READY = "ready"
    SPEAKING = "speaking"
    DONE = "done"


@dataclass
class Expert:
    id: str = dataclass_field(default_factory=lambda: uuid.uuid4().hex[:12])
    discussion_id: str = ""
    role: str = "expert"  # 'host' | 'expert'
    name: str = ""
    occupation: str = ""
    title: str = ""
    field: str = ""
    persona_tags: list[str] = dataclass_field(default_factory=list)
    color_identity: str = "#6366f1"
    avatar_emoji: str = "🧑"
    status: ExpertStatus = ExpertStatus.STANDBY
    focus_point: str = ""
    public_thought: str = ""
    speech_order: int = 0
    created_at: str = dataclass_field(default_factory=lambda: datetime.utcnow().isoformat())

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "discussion_id": self.discussion_id,
            "role": self.role,
            "name": self.name,
            "occupation": self.occupation,
            "title": self.title,
            "field": self.field,
            "persona_tags": self.persona_tags,
            "color_identity": self.color_identity,
            "avatar_emoji": self.avatar_emoji,
            "status": self.status.value,
            "focus_point": self.focus_point,
            "public_thought": self.public_thought,
            "speech_order": self.speech_order,
            "created_at": self.created_at,
        }


@dataclass
class ExpertOpinion:
    """Represents an expert's stance on a specific aspect. Used for consensus/divergence tracking."""
    expert_id: str
    expert_name: str
    stance: str  # 'agree' | 'disagree' | 'neutral'
    summary: str


def row_to_expert(row) -> Expert:
    return Expert(
        id=row["id"],
        discussion_id=row["discussion_id"],
        role=row["role"],
        name=row["name"],
        occupation=row["occupation"],
        title=row["title"],
        field=row["field"],
        persona_tags=json.loads(row["persona_tags"]),
        color_identity=row["color_identity"],
        avatar_emoji=row["avatar_emoji"],
        status=ExpertStatus(row["status"]),
        focus_point=row["focus_point"],
        public_thought=row["public_thought"],
        speech_order=row["speech_order"],
        created_at=row["created_at"],
    )


from backend.database import get_connection


def create_expert(e: Expert) -> Expert:
    conn = get_connection()
    now = datetime.utcnow().isoformat()
    conn.execute(
        """INSERT INTO experts
           (id, discussion_id, role, name, occupation, title, field,
            persona_tags, color_identity, avatar_emoji, status,
            focus_point, public_thought, speech_order, created_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
        (
            e.id, e.discussion_id, e.role, e.name, e.occupation, e.title,
            e.field, json.dumps(e.persona_tags, ensure_ascii=False),
            e.color_identity, e.avatar_emoji, e.status.value,
            e.focus_point, e.public_thought, e.speech_order, now,
        ),
    )
    conn.commit()
    return e


def get_experts_by_discussion(disc_id: str) -> list[Expert]:
    conn = get_connection()
    rows = conn.execute(
        "SELECT * FROM experts WHERE discussion_id = ? ORDER BY speech_order",
        (disc_id,),
    ).fetchall()
    return [row_to_expert(r) for r in rows]


def get_expert(expert_id: str) -> Optional[Expert]:
    conn = get_connection()
    row = conn.execute("SELECT * FROM experts WHERE id = ?", (expert_id,)).fetchone()
    return row_to_expert(row) if row else None


def update_expert_status(expert_id: str, status: ExpertStatus) -> None:
    conn = get_connection()
    conn.execute(
        "UPDATE experts SET status = ? WHERE id = ?",
        (status.value, expert_id),
    )
    conn.commit()


def update_expert_state(
    expert_id: str,
    status: Optional[ExpertStatus] = None,
    focus_point: Optional[str] = None,
    public_thought: Optional[str] = None,
) -> None:
    conn = get_connection()
    parts = []
    params = []
    if status is not None:
        parts.append("status = ?")
        params.append(status.value)
    if focus_point is not None:
        parts.append("focus_point = ?")
        params.append(focus_point)
    if public_thought is not None:
        parts.append("public_thought = ?")
        params.append(public_thought)
    if parts:
        params.append(expert_id)
        conn.execute(
            f"UPDATE experts SET {', '.join(parts)} WHERE id = ?", params
        )
        conn.commit()


def delete_experts_by_discussion(disc_id: str) -> None:
    conn = get_connection()
    conn.execute("DELETE FROM experts WHERE discussion_id = ?", (disc_id,))
    conn.commit()
