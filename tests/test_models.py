"""Unit tests for data models and core logic."""

from __future__ import annotations

import sys
import json
from pathlib import Path

# Add project root
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

import pytest
from backend.database import init_db, get_connection, close_db
from backend.models.discussion import (
    Discussion, DiscussionStatus,
    create_discussion, get_discussion, list_discussions,
    update_discussion_status, update_discussion_summary, delete_discussion,
)
from backend.models.expert import (
    Expert, ExpertStatus,
    create_expert, get_experts_by_discussion, get_expert,
    update_expert_status, update_expert_state, delete_experts_by_discussion,
)
from backend.models.transcript import (
    TranscriptEntry, ConsensusDivergence,
    add_transcript_entry, get_transcript,
    add_consensus_divergence, get_consensus_divergence,
)


@pytest.fixture(autouse=True)
def setup_db():
    """Initialize a fresh in-memory database before each test."""
    import backend.database as db_mod

    # Use in-memory database
    original_path = db_mod.settings.database_path
    db_mod.settings.database_path = ":memory:"

    # Reset thread-local connection
    if hasattr(db_mod._local, "conn"):
        db_mod._local.conn = None

    init_db()
    yield

    # Cleanup
    close_db()
    db_mod.settings.database_path = original_path


class TestDiscussionModel:
    """SDD — Discussion data model and data access tests."""

    def test_create_discussion(self):
        d = Discussion(topic="测试议题", expert_count=4)
        created = create_discussion(d)
        assert created.id is not None
        assert created.id == d.id
        assert created.topic == "测试议题"
        assert created.status == DiscussionStatus.PENDING

    def test_get_discussion(self):
        d = Discussion(topic="获取测试", expert_count=3)
        create_discussion(d)
        fetched = get_discussion(d.id)
        assert fetched is not None
        assert fetched.topic == "获取测试"
        assert fetched.expert_count == 3

    def test_get_nonexistent_discussion(self):
        fetched = get_discussion("nonexistent")
        assert fetched is None

    def test_list_discussions(self):
        d1 = Discussion(topic="讨论1", expert_count=2)
        d2 = Discussion(topic="讨论2", expert_count=4)
        create_discussion(d1)
        create_discussion(d2)
        discussions = list_discussions()
        assert len(discussions) >= 2

    def test_update_discussion_status(self):
        d = Discussion(topic="状态测试", expert_count=4)
        create_discussion(d)
        update_discussion_status(d.id, DiscussionStatus.ACTIVE)
        fetched = get_discussion(d.id)
        assert fetched.status == DiscussionStatus.ACTIVE

    def test_update_discussion_summary(self):
        d = Discussion(topic="总结测试", expert_count=4)
        create_discussion(d)
        update_discussion_summary(d.id, "这是总结内容")
        fetched = get_discussion(d.id)
        assert fetched.host_summary == "这是总结内容"
        assert fetched.status == DiscussionStatus.COMPLETED

    def test_delete_discussion(self):
        d = Discussion(topic="删除测试", expert_count=4)
        create_discussion(d)
        delete_discussion(d.id)
        fetched = get_discussion(d.id)
        assert fetched is None

    def test_discussion_to_dict(self):
        d = Discussion(topic="序列化测试", expert_count=5)
        create_discussion(d)
        data = d.to_dict()
        assert data["topic"] == "序列化测试"
        assert data["expert_count"] == 5
        assert "id" in data
        assert "status" in data


class TestExpertModel:
    """SDD — Expert data model and data access tests."""

    def test_create_expert(self):
        d = Discussion(topic="专家测试")
        create_discussion(d)
        e = Expert(
            discussion_id=d.id,
            role="expert",
            name="张三",
            occupation="研究员",
            title="教授",
            field="计算机科学",
            persona_tags=["AI", "机器学习"],
            color_identity="#34d399",
            avatar_emoji="🧑",
        )
        created = create_expert(e)
        assert created.id is not None
        assert created.name == "张三"

    def test_get_experts_by_discussion(self):
        d = Discussion(topic="多专家测试", expert_count=3)
        create_discussion(d)
        for i in range(3):
            e = Expert(
                discussion_id=d.id,
                role="expert" if i > 0 else "host",
                name=f"专家{i}",
                occupation="研究员",
                title="教授",
                field="AI",
                speech_order=i,
            )
            create_expert(e)
        experts = get_experts_by_discussion(d.id)
        assert len(experts) == 3
        assert experts[0].role == "host"

    def test_update_expert_status(self):
        d = Discussion(topic="状态测试")
        create_discussion(d)
        e = Expert(discussion_id=d.id, name="测试专家")
        create_expert(e)
        update_expert_status(e.id, ExpertStatus.SPEAKING)
        fetched = get_expert(e.id)
        assert fetched.status == ExpertStatus.SPEAKING

    def test_update_expert_state(self):
        d = Discussion(topic="状态更新测试")
        create_discussion(d)
        e = Expert(discussion_id=d.id, name="状态专家")
        create_expert(e)
        update_expert_state(
            e.id,
            status=ExpertStatus.PREPARING,
            focus_point="正在分析议题",
            public_thought="这个问题需要从多角度分析...",
        )
        fetched = get_expert(e.id)
        assert fetched.status == ExpertStatus.PREPARING
        assert fetched.focus_point == "正在分析议题"

    def test_expert_to_dict(self):
        e = Expert(
            name="测试",
            occupation="科学家",
            persona_tags=["AI", "数据"],
        )
        data = e.to_dict()
        assert data["name"] == "测试"
        assert data["persona_tags"] == ["AI", "数据"]


class TestTranscriptModel:
    """SDD — Transcript and consensus/divergence tests."""

    def test_add_transcript_entry(self):
        d = Discussion(topic="转录测试")
        create_discussion(d)
        e = Expert(discussion_id=d.id, name="发言者")
        create_expert(e)
        entry = TranscriptEntry(
            discussion_id=d.id,
            expert_id=e.id,
            speaker_name="发言者",
            content="这是发言内容",
            sequence=1,
        )
        created = add_transcript_entry(entry)
        assert created.id is not None
        assert created.content == "这是发言内容"

    def test_get_transcript(self):
        d = Discussion(topic="转录列表测试")
        create_discussion(d)
        e = Expert(discussion_id=d.id, name="专家")
        create_expert(e)
        for i in range(3):
            add_transcript_entry(TranscriptEntry(
                discussion_id=d.id, expert_id=e.id,
                speaker_name="专家", content=f"发言{i}", sequence=i + 1,
            ))
        entries = get_transcript(d.id)
        assert len(entries) == 3

    def test_add_consensus_divergence(self):
        d = Discussion(topic="共识测试")
        create_discussion(d)
        cd = ConsensusDivergence(
            discussion_id=d.id,
            category="consensus",
            content="这是一个共识点",
        )
        created = add_consensus_divergence(cd)
        assert created.id is not None
        assert created.category == "consensus"

    def test_get_consensus_divergence(self):
        d = Discussion(topic="共识分歧测试")
        create_discussion(d)
        items = [
            ConsensusDivergence(discussion_id=d.id, category="consensus", content="共识1", sequence=1),
            ConsensusDivergence(discussion_id=d.id, category="divergence", content="分歧1", sequence=2),
        ]
        for item in items:
            add_consensus_divergence(item)
        fetched = get_consensus_divergence(d.id)
        assert len(fetched) == 2
        assert fetched[0].category == "consensus"
        assert fetched[1].category == "divergence"


class TestDiscussionEngineLogic:
    """TDD — Core discussion engine logic tests (without LLM mocking)."""

    def test_discussion_status_transitions(self):
        """Verify status lifecycle: pending -> active -> paused -> active -> completed."""
        d = Discussion(topic="生命周期测试")
        create_discussion(d)

        assert d.status == DiscussionStatus.PENDING
        update_discussion_status(d.id, DiscussionStatus.ACTIVE)
        assert get_discussion(d.id).status == DiscussionStatus.ACTIVE

        update_discussion_status(d.id, DiscussionStatus.PAUSED)
        assert get_discussion(d.id).status == DiscussionStatus.PAUSED

        update_discussion_status(d.id, DiscussionStatus.ACTIVE)
        assert get_discussion(d.id).status == DiscussionStatus.ACTIVE

        update_discussion_summary(d.id, "总结")
        assert get_discussion(d.id).status == DiscussionStatus.COMPLETED

    def test_expert_status_transitions(self):
        """Test expert status lifecycle: standby -> preparing -> speaking -> done."""
        d = Discussion(topic="专家状态测试")
        create_discussion(d)
        e = Expert(discussion_id=d.id, name="测试专家")
        create_expert(e)

        assert e.status == ExpertStatus.STANDBY
        update_expert_status(e.id, ExpertStatus.PREPARING)
        assert get_expert(e.id).status == ExpertStatus.PREPARING
        update_expert_status(e.id, ExpertStatus.SPEAKING)
        assert get_expert(e.id).status == ExpertStatus.SPEAKING
        update_expert_status(e.id, ExpertStatus.DONE)
        assert get_expert(e.id).status == ExpertStatus.DONE

    def test_cascade_delete_discussion(self):
        """Verify that deleting a discussion removes associated experts and transcripts."""
        d = Discussion(topic="级联删除测试")
        create_discussion(d)
        e = Expert(discussion_id=d.id, name="将被删除的专家")
        create_expert(e)
        add_transcript_entry(TranscriptEntry(
            discussion_id=d.id, expert_id=e.id,
            speaker_name="专家", content="内容", sequence=1,
        ))

        delete_discussion(d.id)
        assert get_discussion(d.id) is None
        assert get_expert(e.id) is None
        assert get_transcript(d.id) == []

    def test_multiple_discussions_isolation(self):
        """Verify that discussions are completely isolated from each other."""
        d1 = Discussion(topic="讨论A")
        d2 = Discussion(topic="讨论B")
        create_discussion(d1)
        create_discussion(d2)

        e1 = Expert(discussion_id=d1.id, name="A组专家")
        e2 = Expert(discussion_id=d2.id, name="B组专家")
        create_expert(e1)
        create_expert(e2)

        add_transcript_entry(TranscriptEntry(
            discussion_id=d1.id, expert_id=e1.id,
            speaker_name="A", content="A的发言", sequence=1,
        ))
        add_transcript_entry(TranscriptEntry(
            discussion_id=d2.id, expert_id=e2.id,
            speaker_name="B", content="B的发言", sequence=1,
        ))

        assert len(get_transcript(d1.id)) == 1
        assert get_transcript(d1.id)[0].speaker_name == "A"
        assert len(get_transcript(d2.id)) == 1
        assert get_transcript(d2.id)[0].speaker_name == "B"

    def test_consensus_divergence_isolation(self):
        """Verify consensus/divergence isolation between discussions."""
        d1 = Discussion(topic="议题1")
        d2 = Discussion(topic="议题2")
        create_discussion(d1)
        create_discussion(d2)

        add_consensus_divergence(ConsensusDivergence(
            discussion_id=d1.id, category="consensus", content="共识1",
        ))
        add_consensus_divergence(ConsensusDivergence(
            discussion_id=d2.id, category="divergence", content="分歧1",
        ))

        assert len(get_consensus_divergence(d1.id)) == 1
        assert get_consensus_divergence(d1.id)[0].category == "consensus"
        assert len(get_consensus_divergence(d2.id)) == 1
        assert get_consensus_divergence(d2.id)[0].category == "divergence"


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
