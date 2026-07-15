"""Discussion engine — orchestrates the round-table discussion flow."""

from __future__ import annotations

import asyncio
import json
from datetime import datetime

from backend.models.discussion import (
    Discussion,
    DiscussionStatus,
    create_discussion,
    get_discussion,
    update_discussion_status,
    update_discussion_summary,
)
from backend.models.expert import (
    Expert,
    ExpertStatus,
    create_expert,
    get_experts_by_discussion,
    update_expert_state,
)
from backend.models.transcript import (
    TranscriptEntry,
    ConsensusDivergence,
    add_transcript_entry,
    add_consensus_divergence,
    get_transcript,
    get_consensus_divergence,
)
from backend.services.llm_service import llm_service
from backend.services.sse_manager import sse_manager


class DiscussionEngine:
    """Manages the lifecycle and real-time flow of a single discussion."""

    def __init__(self) -> None:
        self._running: dict[str, asyncio.Task] = {}

    async def create_and_prepare(
        self, topic: str, expert_count: int = 4
    ) -> Discussion:
        """Create a discussion and generate experts."""
        disc = Discussion(
            title=topic[:80],
            topic=topic,
            expert_count=expert_count,
            status=DiscussionStatus.PREPARING,
        )
        create_discussion(disc)

        # Publish preparing event
        await sse_manager.publish(disc.id, "discussion_status", {
            "id": disc.id, "status": "preparing", "topic": topic,
        })

        # Generate experts via LLM
        try:
            expert_data = await llm_service.generate_experts(topic, expert_count)
            for i, ed in enumerate(expert_data):
                expert = Expert(
                    discussion_id=disc.id,
                    role=ed.get("role", "expert"),
                    name=ed.get("name", "专家"),
                    occupation=ed.get("occupation", ""),
                    title=ed.get("title", ""),
                    field=ed.get("field", ""),
                    persona_tags=ed.get("persona_tags", []),
                    color_identity=ed.get("color_identity", "#6366f1"),
                    avatar_emoji=ed.get("avatar_emoji", "🧑"),
                    status=ExpertStatus.STANDBY,
                    speech_order=i,
                )
                create_expert(expert)

            update_discussion_status(disc.id, DiscussionStatus.PENDING)
            await sse_manager.publish(disc.id, "experts_generated", {
                "discussion_id": disc.id,
                "experts": [e.to_dict() for e in get_experts_by_discussion(disc.id)],
            })
        except Exception as e:
            update_discussion_status(disc.id, DiscussionStatus.PENDING)
            await sse_manager.publish(disc.id, "error", {
                "message": f"生成专家失败：{str(e)}",
            })

        return disc

    async def start_discussion(self, discussion_id: str) -> None:
        """Start the round-table discussion in the background."""
        if discussion_id in self._running:
            return  # Already running

        disc = get_discussion(discussion_id)
        if not disc:
            raise ValueError(f"Discussion {discussion_id} not found")

        experts = get_experts_by_discussion(discussion_id)
        if not experts:
            raise ValueError("No experts found for this discussion")

        task = asyncio.create_task(
            self._run_discussion_loop(disc, experts)
        )
        self._running[discussion_id] = task

    async def _run_discussion_loop(
        self, disc: Discussion, experts: list[Expert]
    ) -> None:
        """Core discussion loop."""
        discussions_api = __import__(
            "backend.models.discussion", fromlist=["get_discussion"]
        )

        # Update status to active
        update_discussion_status(disc.id, DiscussionStatus.ACTIVE)
        await sse_manager.publish(disc.id, "discussion_status", {
            "id": disc.id, "status": "active",
        })

        host = next((e for e in experts if e.role == "host"), None)
        panelists = [e for e in experts if e.role == "expert"]
        if not host:
            # Use first expert as host fallback
            host = experts[0]
            panelists = experts[1:]

        # 1. Host opening
        try:
            opening = await llm_service.generate_opening(disc.topic, [
                e.to_dict() for e in experts
            ])
        except Exception as e:
            opening = f"欢迎各位来到关于「{disc.topic}」的圆桌讨论。让我们开始吧！"

        entry = add_transcript_entry(TranscriptEntry(
            discussion_id=disc.id,
            expert_id=host.id,
            speaker_name=host.name,
            speaker_title=f"{host.occupation} · {host.title}",
            content=opening,
            entry_type="speech",
            sequence=1,
        ))
        await sse_manager.publish(disc.id, "transcript", entry.to_dict())

        # Update host status
        await sse_manager.publish(disc.id, "expert_status", {
            "expert_id": host.id, "status": "done", "focus_point": "开场致辞完成",
        })

        # 2. Discussion rounds
        turn_count = 0
        max_turns = len(panelists) * 3  # Each expert speaks ~3 times
        seq = 1
        consensus_cache: list[str] = []
        divergence_cache: list[str] = []

        while turn_count < max_turns:
            # Check if discussion was paused/completed externally
            current = get_discussion(disc.id)
            if current and current.status in (
                DiscussionStatus.PAUSED, DiscussionStatus.COMPLETED
            ):
                break

            for expert in panelists:
                current = get_discussion(disc.id)
                if current and current.status in (
                    DiscussionStatus.PAUSED, DiscussionStatus.COMPLETED
                ):
                    break

                # Update expert status to preparing
                update_expert_state(
                    expert.id,
                    status=ExpertStatus.PREPARING,
                    focus_point="准备发言中...",
                )
                await sse_manager.publish(disc.id, "expert_status", {
                    "expert_id": expert.id,
                    "status": "preparing",
                    "focus_point": "准备发言中...",
                })

                await asyncio.sleep(0.5)  # Brief pause for realism

                # Update to speaking
                update_expert_state(
                    expert.id,
                    status=ExpertStatus.SPEAKING,
                )
                await sse_manager.publish(disc.id, "expert_status", {
                    "expert_id": expert.id,
                    "status": "speaking",
                })

                # Generate speech
                recent_transcript = get_transcript(disc.id, limit=20)
                try:
                    speech = await llm_service.generate_speech(
                        topic=disc.topic,
                        expert=expert.to_dict(),
                        host_opening=opening,
                        recent_transcript=[t.to_dict() for t in recent_transcript],
                        consensus_points=consensus_cache,
                        divergence_points=divergence_cache,
                    )
                except Exception as e:
                    speech = f"关于这个议题，我认为需要从{expert.field}的角度来分析。这是一个值得深入探讨的问题。"

                # Publish thought (public, not CoT)
                update_expert_state(
                    expert.id,
                    status=ExpertStatus.SPEAKING,
                    focus_point=f"讨论：{speech[:50]}...",
                    public_thought=speech[:100],
                )
                await sse_manager.publish(disc.id, "expert_status", {
                    "expert_id": expert.id,
                    "status": "speaking",
                    "focus_point": f"讨论：{speech[:50]}...",
                    "public_thought": speech[:100],
                })

                seq += 1
                entry = add_transcript_entry(TranscriptEntry(
                    discussion_id=disc.id,
                    expert_id=expert.id,
                    speaker_name=expert.name,
                    speaker_title=f"{expert.occupation} · {expert.title}",
                    content=speech,
                    entry_type="speech",
                    sequence=seq,
                ))
                await sse_manager.publish(disc.id, "transcript", entry.to_dict())

                # Update to done
                update_expert_state(
                    expert.id,
                    status=ExpertStatus.DONE,
                )
                await sse_manager.publish(disc.id, "expert_status", {
                    "expert_id": expert.id,
                    "status": "done",
                })

                turn_count += 1

                # Every 2 turns, analyze consensus/divergence
                if turn_count % 2 == 0:
                    await self._update_consensus_analysis(
                        disc.id, disc.topic, consensus_cache, divergence_cache
                    )

                await asyncio.sleep(0.3)  # Natural pause between speakers

        # 3. Generate summary
        await sse_manager.publish(disc.id, "discussion_status", {
            "id": disc.id, "status": "summarizing",
        })

        all_transcript = get_transcript(disc.id, limit=100)
        all_consensus = get_consensus_divergence(disc.id)
        consensus_cache = [c.content for c in all_consensus if c.category == "consensus"]
        divergence_cache = [d.content for d in all_consensus if d.category == "divergence"]

        try:
            summary = await llm_service.generate_summary(
                disc.topic,
                [e.to_dict() for e in experts],
                [t.to_dict() for t in all_transcript],
                consensus_cache,
                divergence_cache,
            )
        except Exception as e:
            summary = f"本次关于「{disc.topic}」的圆桌讨论到此结束。感谢各位专家的精彩发言！"

        seq += 1
        entry = add_transcript_entry(TranscriptEntry(
            discussion_id=disc.id,
            expert_id=host.id,
            speaker_name=host.name,
            speaker_title=f"{host.occupation} · {host.title}",
            content=summary,
            entry_type="summary",
            sequence=seq,
        ))
        await sse_manager.publish(disc.id, "transcript", entry.to_dict())

        # Mark discussion as completed
        update_discussion_summary(disc.id, summary)
        await sse_manager.publish(disc.id, "discussion_status", {
            "id": disc.id, "status": "completed", "summary": summary,
        })

        # Cleanup
        self._running.pop(disc.id, None)

    async def _update_consensus_analysis(
        self,
        discussion_id: str,
        topic: str,
        consensus_cache: list[str],
        divergence_cache: list[str],
    ) -> None:
        """Analyze recent transcript for consensus/divergence updates."""
        recent = get_transcript(discussion_id, limit=15)
        if len(recent) < 4:
            return

        try:
            result = await llm_service.generate_consensus_update(
                topic=topic,
                recent_transcript=[t.to_dict() for t in recent],
                existing_consensus=consensus_cache,
                existing_divergence=divergence_cache,
            )
        except Exception:
            return

        existing_cd = get_consensus_divergence(discussion_id)
        existing_consensus_texts = [c.content for c in existing_cd if c.category == "consensus"]
        existing_divergence_texts = [d.content for d in existing_cd if d.category == "divergence"]

        for c in result.get("new_consensus", []):
            if c not in existing_consensus_texts:
                cd = add_consensus_divergence(ConsensusDivergence(
                    discussion_id=discussion_id,
                    category="consensus",
                    content=c,
                    source_expert_ids=[],
                    sequence=len(existing_cd) + 1,
                ))
                consensus_cache.append(c)
                existing_consensus_texts.append(c)
                await sse_manager.publish(discussion_id, "consensus_divergence", cd.to_dict())

        for d in result.get("new_divergence", []):
            if d not in existing_divergence_texts:
                cd = add_consensus_divergence(ConsensusDivergence(
                    discussion_id=discussion_id,
                    category="divergence",
                    content=d,
                    source_expert_ids=[],
                    sequence=len(existing_cd) + 1,
                ))
                divergence_cache.append(d)
                existing_divergence_texts.append(d)
                await sse_manager.publish(discussion_id, "consensus_divergence", cd.to_dict())

    async def pause_discussion(self, discussion_id: str) -> None:
        """Pause a running discussion."""
        update_discussion_status(discussion_id, DiscussionStatus.PAUSED)
        await sse_manager.publish(discussion_id, "discussion_status", {
            "id": discussion_id, "status": "paused",
        })

    async def resume_discussion(self, discussion_id: str) -> None:
        """Resume a paused discussion."""
        update_discussion_status(discussion_id, DiscussionStatus.ACTIVE)
        await sse_manager.publish(discussion_id, "discussion_status", {
            "id": discussion_id, "status": "active",
        })
        # Restart the loop
        disc = get_discussion(discussion_id)
        experts = get_experts_by_discussion(discussion_id)
        if disc and experts and discussion_id not in self._running:
            task = asyncio.create_task(
                self._run_discussion_loop(disc, experts)
            )
            self._running[discussion_id] = task

    def is_running(self, discussion_id: str) -> bool:
        return discussion_id in self._running


# Global engine instance
engine = DiscussionEngine()
