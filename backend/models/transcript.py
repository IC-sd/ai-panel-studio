"""Transcript entry and consensus/divergence models."""

from __future__ import annotations

import json
from dataclasses import dataclass, field
from datetime import datetime
from typing import Optional


@dataclass
class TranscriptEntry:
    id: Optional[int] = None
    discussion_id: str = ""
    expert_id: str = ""
    speaker_name: str = ""
    speaker_title: str = ""
    content: str = ""
    entry_type: str = "speech"  # 'speech' | 'system' | 'host_interject' | 'summary'
    sequence: int = 0
    created_at: str = field(default_factory=lambda: datetime.utcnow().isoformat())

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "discussion_id": self.discussion_id,
            "expert_id": self.expert_id,
            "speaker_name": self.speaker_name,
            "speaker_title": self.speaker_title,
            "content": self.content,
            "entry_type": self.entry_type,
            "sequence": self.sequence,
            "created_at": self.created_at,
        }


@dataclass
class ConsensusDivergence:
    id: Optional[int] = None
    discussion_id: str = ""
    category: str = "consensus"  # 'consensus' | 'divergence'
    content: str = ""
    source_expert_ids: list[str] = field(default_factory=list)
    sequence: int = 0
    created_at: str = field(default_factory=lambda: datetime.utcnow().isoformat())

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "discussion_id": self.discussion_id,
            "category": self.category,
            "content": self.content,
            "source_expert_ids": self.source_expert_ids,
            "sequence": self.sequence,
            "created_at": self.created_at,
        }


# ---- Data Access ----

from backend.database import get_connection


def add_transcript_entry(entry: TranscriptEntry) -> TranscriptEntry:
    conn = get_connection()
    now = datetime.utcnow().isoformat()
    cursor = conn.execute(
        """INSERT INTO transcript_entries
           (discussion_id, expert_id, speaker_name, speaker_title,
            content, entry_type, sequence, created_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)""",
        (
            entry.discussion_id, entry.expert_id, entry.speaker_name,
            entry.speaker_title, entry.content, entry.entry_type,
            entry.sequence, now,
        ),
    )
    conn.commit()
    entry.id = cursor.lastrowid
    entry.created_at = now
    return entry


def get_transcript(disc_id: str, limit: int = 200) -> list[TranscriptEntry]:
    conn = get_connection()
    rows = conn.execute(
        """SELECT * FROM transcript_entries
           WHERE discussion_id = ? ORDER BY sequence ASC LIMIT ?""",
        (disc_id, limit),
    ).fetchall()
    return [
        TranscriptEntry(
            id=r["id"], discussion_id=r["discussion_id"],
            expert_id=r["expert_id"], speaker_name=r["speaker_name"],
            speaker_title=r["speaker_title"], content=r["content"],
            entry_type=r["entry_type"], sequence=r["sequence"],
            created_at=r["created_at"],
        )
        for r in rows
    ]


def add_consensus_divergence(cd: ConsensusDivergence) -> ConsensusDivergence:
    conn = get_connection()
    now = datetime.utcnow().isoformat()
    cursor = conn.execute(
        """INSERT INTO consensus_divergence
           (discussion_id, category, content, source_expert_ids, sequence, created_at)
           VALUES (?, ?, ?, ?, ?, ?)""",
        (
            cd.discussion_id, cd.category, cd.content,
            json.dumps(cd.source_expert_ids, ensure_ascii=False),
            cd.sequence, now,
        ),
    )
    conn.commit()
    cd.id = cursor.lastrowid
    cd.created_at = now
    return cd


def get_consensus_divergence(disc_id: str) -> list[ConsensusDivergence]:
    conn = get_connection()
    rows = conn.execute(
        """SELECT * FROM consensus_divergence
           WHERE discussion_id = ? ORDER BY sequence ASC""",
        (disc_id,),
    ).fetchall()
    return [
        ConsensusDivergence(
            id=r["id"], discussion_id=r["discussion_id"],
            category=r["category"], content=r["content"],
            source_expert_ids=json.loads(r["source_expert_ids"]),
            sequence=r["sequence"], created_at=r["created_at"],
        )
        for r in rows
    ]


def delete_transcript_by_discussion(disc_id: str) -> None:
    conn = get_connection()
    conn.execute("DELETE FROM transcript_entries WHERE discussion_id = ?", (disc_id,))
    conn.execute("DELETE FROM consensus_divergence WHERE discussion_id = ?", (disc_id,))
    conn.commit()
