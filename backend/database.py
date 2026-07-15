"""SQLite database setup and session management."""

from __future__ import annotations

import sqlite3
import threading
from pathlib import Path

from backend.config import settings

_local = threading.local()


def get_db_path() -> str:
    """Ensure the data directory exists and return the database path."""
    path = Path(settings.database_path)
    path.parent.mkdir(parents=True, exist_ok=True)
    return str(path)


def get_connection() -> sqlite3.Connection:
    """Get a thread-local database connection."""
    if not hasattr(_local, "conn") or _local.conn is None:
        db_path = get_db_path()
        _local.conn = sqlite3.connect(db_path, check_same_thread=False)
        _local.conn.row_factory = sqlite3.Row
        _local.conn.execute("PRAGMA journal_mode=WAL")
        _local.conn.execute("PRAGMA foreign_keys=ON")
    return _local.conn


def init_db() -> None:
    """Initialize the database schema."""
    conn = get_connection()
    conn.executescript("""
        CREATE TABLE IF NOT EXISTS discussions (
            id              TEXT PRIMARY KEY,
            title           TEXT NOT NULL,
            topic           TEXT NOT NULL,
            expert_count    INTEGER NOT NULL DEFAULT 4,
            status          TEXT NOT NULL DEFAULT 'pending'
                            CHECK(status IN ('pending','preparing','active','paused','completed')),
            host_summary    TEXT,
            created_at      TEXT NOT NULL DEFAULT (datetime('now')),
            updated_at      TEXT NOT NULL DEFAULT (datetime('now'))
        );

        CREATE TABLE IF NOT EXISTS experts (
            id              TEXT PRIMARY KEY,
            discussion_id   TEXT NOT NULL REFERENCES discussions(id) ON DELETE CASCADE,
            role            TEXT NOT NULL CHECK(role IN ('host','expert')),
            name            TEXT NOT NULL,
            occupation      TEXT NOT NULL DEFAULT '',
            title           TEXT NOT NULL DEFAULT '',
            field           TEXT NOT NULL DEFAULT '',
            persona_tags    TEXT NOT NULL DEFAULT '[]',
            color_identity  TEXT NOT NULL DEFAULT '#6366f1',
            avatar_emoji    TEXT NOT NULL DEFAULT '🧑',
            status          TEXT NOT NULL DEFAULT 'standby'
                            CHECK(status IN ('standby','preparing','ready','speaking','done')),
            focus_point     TEXT NOT NULL DEFAULT '',
            public_thought  TEXT NOT NULL DEFAULT '',
            speech_order    INTEGER NOT NULL DEFAULT 0,
            created_at      TEXT NOT NULL DEFAULT (datetime('now'))
        );

        CREATE TABLE IF NOT EXISTS transcript_entries (
            id              INTEGER PRIMARY KEY AUTOINCREMENT,
            discussion_id   TEXT NOT NULL REFERENCES discussions(id) ON DELETE CASCADE,
            expert_id       TEXT NOT NULL REFERENCES experts(id) ON DELETE CASCADE,
            speaker_name    TEXT NOT NULL,
            speaker_title   TEXT NOT NULL DEFAULT '',
            content         TEXT NOT NULL,
            entry_type      TEXT NOT NULL DEFAULT 'speech'
                            CHECK(entry_type IN ('speech','system','host_interject','summary')),
            sequence        INTEGER NOT NULL DEFAULT 0,
            created_at      TEXT NOT NULL DEFAULT (datetime('now'))
        );

        CREATE TABLE IF NOT EXISTS consensus_divergence (
            id              INTEGER PRIMARY KEY AUTOINCREMENT,
            discussion_id   TEXT NOT NULL REFERENCES discussions(id) ON DELETE CASCADE,
            category        TEXT NOT NULL CHECK(category IN ('consensus','divergence')),
            content         TEXT NOT NULL,
            source_expert_ids TEXT NOT NULL DEFAULT '[]',
            sequence        INTEGER NOT NULL DEFAULT 0,
            created_at      TEXT NOT NULL DEFAULT (datetime('now'))
        );
    """)
    conn.commit()


def close_db() -> None:
    """Close the thread-local connection if open."""
    if hasattr(_local, "conn") and _local.conn is not None:
        _local.conn.close()
        _local.conn = None
