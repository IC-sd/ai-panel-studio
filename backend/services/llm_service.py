"""LLM service for Deepseek API calls."""

from __future__ import annotations

import json
from typing import AsyncGenerator, Optional

import httpx

from backend.config import settings


LLM_SYSTEM_PROMPT = """你是一个专业的AI圆桌讨论系统。你的任务是根据用户输入的议题生成专家阵容，并驱动多轮真实的圆桌讨论。

## 核心原则
1. 生成的主持人和专家必须有真实感——姓名、职业、头衔、领域都应当合理且多样
2. 每个专家应当有鲜明的观点立场和性格特点
3. 讨论过程模拟真实辩论，有赞同、有反驳、有补充
4. 每次发言控制在1-2句话，自然口语化
5. 专家之间观点应有碰撞，不能所有人都一致
"""


class LLMService:
    """Service for communicating with the Deepseek API."""

    def __init__(self) -> None:
        self.api_key = settings.deepseek_api_key
        self.api_base = settings.deepseek_api_base.rstrip("/")
        self.model = settings.deepseek_model
        self._client: Optional[httpx.AsyncClient] = None

    @property
    def client(self) -> httpx.AsyncClient:
        if self._client is None:
            self._client = httpx.AsyncClient(
                base_url=self.api_base,
                timeout=httpx.Timeout(120.0, connect=10.0),
            )
        return self._client

    async def chat(
        self,
        messages: list[dict],
        system_prompt: Optional[str] = None,
        temperature: float = 0.7,
        max_tokens: int = 4096,
        stream: bool = False,
    ) -> str | AsyncGenerator[str, None]:
        """Send a chat completion request to Deepseek API."""
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
        }
        full_messages = []
        if system_prompt:
            full_messages.append({"role": "system", "content": system_prompt})
        full_messages.extend(messages)

        body = {
            "model": self.model,
            "messages": full_messages,
            "temperature": temperature,
            "max_tokens": max_tokens,
            "stream": stream,
        }

        if stream:
            return self._stream_chat(headers, body)
        else:
            return await self._sync_chat(headers, body)

    async def _sync_chat(self, headers: dict, body: dict) -> str:
        """Non-streaming chat completion."""
        response = await self.client.post(
            "/chat/completions", headers=headers, json=body
        )
        response.raise_for_status()
        data = response.json()
        return data["choices"][0]["message"]["content"]

    async def _stream_chat(
        self, headers: dict, body: dict
    ) -> AsyncGenerator[str, None]:
        """Streaming chat completion."""
        async with self.client.stream(
            "POST", "/chat/completions", headers=headers, json=body
        ) as response:
            response.raise_for_status()
            async for line in response.aiter_lines():
                if line.startswith("data: "):
                    data_str = line[6:]
                    if data_str.strip() == "[DONE]":
                        break
                    try:
                        data = json.loads(data_str)
                        delta = data["choices"][0].get("delta", {})
                        content = delta.get("content", "")
                        if content:
                            yield content
                    except (json.JSONDecodeError, KeyError, IndexError):
                        continue

    async def generate_experts(
        self, topic: str, expert_count: int = 4
    ) -> list[dict]:
        """Generate a host + expert array based on the topic."""
        system_prompt = LLM_SYSTEM_PROMPT + """
你现在的任务是：根据用户提供的议题，生成一个主持人 + 指定数量的专家。

返回严格的JSON数组格式（不要markdown包裹）：
[
  {
    "role": "host",
    "name": "主持人姓名",
    "occupation": "职业",
    "title": "头衔",
    "field": "领域",
    "persona_tags": ["标签1", "标签2"],
    "color_identity": "#16进制颜色",
    "avatar_emoji": "emoji"
  },
  {
    "role": "expert",
    "name": "专家姓名",
    "occupation": "职业",
    "title": "头衔",
    "field": "领域",
    "persona_tags": ["标签1", "标签2"],
    "color_identity": "#16进制颜色",
    "avatar_emoji": "emoji"
  }
]

要求：
- 第一个必须是主持人(role="host")
- 后面跟 {expert_count} 个专家(role="expert")
- 专家的领域需要覆盖不同角度，立场要有差异
- 姓名要多样，职业要真实
- color_identity 使用鲜明但不刺眼的颜色
- 直接返回JSON数组，不要任何其他文字
"""

        result = await self.chat(
            messages=[{"role": "user", "content": f"议题：{topic}\n专家数量：{expert_count}"}],
            system_prompt=system_prompt,
            temperature=0.8,
            max_tokens=4096,
            stream=False,
        )

        if isinstance(result, str):
            # Try to parse JSON from the response
            result_str = result.strip()
            # Remove markdown code fences if present
            if result_str.startswith("```"):
                result_str = result_str.split("\n", 1)[1]
                result_str = result_str.rsplit("```", 1)[0]
            try:
                return json.loads(result_str)
            except json.JSONDecodeError:
                # Try to find JSON array
                import re
                match = re.search(r"\[.*\]", result_str, re.DOTALL)
                if match:
                    return json.loads(match.group())
                raise
        raise ValueError("Unexpected non-string result from non-streaming call")

    async def generate_opening(
        self, topic: str, experts: list[dict]
    ) -> str:
        """Generate the host's opening speech."""
        system_prompt = LLM_SYSTEM_PROMPT + """
你现在是圆桌讨论的主持人。请根据议题和专家阵容，发表一段开场白。

要求：
- 热情、专业、有引导性
- 简要介绍议题背景和意义
- 逐一介绍每位专家（简短）
- 控制在3-5句话
- 口语化，像是在现场说话
- 直接说话内容，不要任何标注
"""

        experts_desc = "\n".join(
            f"- {e['name']}（{e['occupation']}，{e['title']}，擅长{e['field']}）"
            for e in experts
        )
        result = await self.chat(
            messages=[{
                "role": "user",
                "content": f"议题：{topic}\n\n专家阵容：\n{experts_desc}",
            }],
            system_prompt=system_prompt,
            temperature=0.8,
            max_tokens=1024,
            stream=False,
        )
        if isinstance(result, str):
            return result.strip()
        raise ValueError("Unexpected non-string result")

    async def generate_speech(
        self,
        topic: str,
        expert: dict,
        host_opening: str,
        recent_transcript: list[dict],
        consensus_points: list[str],
        divergence_points: list[str],
        is_direct_response: bool = False,
        responding_to: Optional[str] = None,
    ) -> str:
        """Generate a single speech for an expert."""
        system_prompt = LLM_SYSTEM_PROMPT + f"""
你现在是{expert['name']}——{expert['occupation']}，{expert['title']}，专攻{expert['field']}领域。

你的标签：{', '.join(expert.get('persona_tags', []))}

角色要求：
- 你是一个有鲜明观点的{expert['field']}专家
- 从你的专业角度出发分析议题
- 如果别人和你的观点一致，可以表示赞同并补充
- 如果别人和你的观点不同，可以礼貌地质疑和反驳
- 每次只说1-2句话，口语化，有真实感
- 不要长篇大论，不要列点
"""
        if is_direct_response and responding_to:
            system_prompt += f"\n你正在回应{responding_to}的发言。先回应他/她的观点，再提出你的看法。"

        transcript_text = ""
        for entry in recent_transcript[-10:]:  # last 10 entries for context
            transcript_text += f"{entry.get('speaker_name', '')}：{entry.get('content', '')}\n"

        user_message = f"""议题：{topic}
主持人开场：{host_opening}

最近讨论内容：
{transcript_text}

当前共识：{'、'.join(consensus_points) if consensus_points else '暂无'}
当前分歧：{'、'.join(divergence_points) if divergence_points else '暂无'}

作为{expert['name']}，请发言（1-2句话）："""

        result = await self.chat(
            messages=[{"role": "user", "content": user_message}],
            system_prompt=system_prompt,
            temperature=0.9,
            max_tokens=512,
            stream=False,
        )
        if isinstance(result, str):
            return result.strip()
        raise ValueError("Unexpected non-string result")

    async def generate_consensus_update(
        self,
        topic: str,
        recent_transcript: list[dict],
        existing_consensus: list[str],
        existing_divergence: list[str],
    ) -> dict:
        """Analyze recent transcript for new consensus/divergence points."""
        system_prompt = """你是一个圆桌讨论的分析师。根据最近的对话内容，提取新的共识和分歧点。

返回JSON格式：
{
  "new_consensus": ["共识点1", "共识点2"],
  "new_divergence": ["分歧点1", "分歧点2"]
}

要求：
- 只提取讨论中明确出现的新共识/分歧
- 不要重复已有的
- 如果没有新的，返回空数组
- 直接返回JSON，不要markdown包裹
"""

        transcript_text = "\n".join(
            f"{e.get('speaker_name', '')}：{e.get('content', '')}"
            for e in recent_transcript[-15:]
        )

        result = await self.chat(
            messages=[{
                "role": "user",
                "content": f"""议题：{topic}
已有共识：{'、'.join(existing_consensus) if existing_consensus else '暂无'}
已有分歧：{'、'.join(existing_divergence) if existing_divergence else '暂无'}

最近对话：
{transcript_text}

请提取新的共识和分歧点：""",
            }],
            system_prompt=system_prompt,
            temperature=0.5,
            max_tokens=1024,
            stream=False,
        )

        if isinstance(result, str):
            result_str = result.strip()
            if result_str.startswith("```"):
                result_str = result_str.split("\n", 1)[1]
                result_str = result_str.rsplit("```", 1)[0]
            try:
                return json.loads(result_str)
            except json.JSONDecodeError:
                import re
                match = re.search(r"\{.*\}", result_str, re.DOTALL)
                if match:
                    return json.loads(match.group())
                return {"new_consensus": [], "new_divergence": []}
        raise ValueError("Unexpected non-string result")

    async def generate_summary(
        self,
        topic: str,
        experts: list[dict],
        transcript: list[dict],
        consensus_points: list[str],
        divergence_points: list[str],
    ) -> str:
        """Generate the host's concluding summary."""
        system_prompt = LLM_SYSTEM_PROMPT + """
你现在是圆桌讨论的主持人。讨论即将结束，请发表一段总结。

要求：
- 回顾讨论的核心观点和亮点
- 总结共识和分歧
- 对每位专家的贡献做一句点评
- 感谢大家参与
- 3-5句话，口语化
- 直接说总结内容，不要标注
"""

        transcript_text = "\n".join(
            f"{e.get('speaker_name', '')}：{e.get('content', '')}"
            for e in transcript[-20:]
        )

        result = await self.chat(
            messages=[{
                "role": "user",
                "content": f"""议题：{topic}

核心共识：{'、'.join(consensus_points) if consensus_points else '暂无'}
核心分歧：{'、'.join(divergence_points) if divergence_points else '暂无'}

讨论过程：
{transcript_text}

请以主持人身份做总结：""",
            }],
            system_prompt=system_prompt,
            temperature=0.8,
            max_tokens=1024,
            stream=False,
        )
        if isinstance(result, str):
            return result.strip()
        raise ValueError("Unexpected non-string result")


# Global LLM service instance
llm_service = LLMService()
