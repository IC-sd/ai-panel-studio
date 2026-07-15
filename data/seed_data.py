"""Seed data for development and demo purposes.

Generates 5 high-quality sample discussions with diverse topics and expert libraries.
"""

from __future__ import annotations

import sys
import os
from pathlib import Path

# Add project root
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from backend.database import init_db, get_connection
from backend.models.discussion import create_discussion, Discussion, DiscussionStatus
from backend.models.expert import create_expert, Expert, ExpertStatus
from backend.models.transcript import (
    add_transcript_entry, TranscriptEntry,
    add_consensus_divergence, ConsensusDivergence,
)


SAMPLE_DISCUSSIONS = [
    {
        "topic": "AI 是否会在未来十年取代大部分人类工作？",
        "expert_count": 4,
        "status": "completed",
        "experts": [
            {
                "role": "host", "name": "张明远", "occupation": "科技媒体主编",
                "title": "《前沿科技》杂志主编",
                "field": "科技趋势分析",
                "persona_tags": ["理性", "公正", "洞察力强"],
                "color_identity": "#818cf8", "avatar_emoji": "🎙",
            },
            {
                "role": "expert", "name": "李思然", "occupation": "AI 研究员",
                "title": "清华大学计算机系副教授",
                "field": "人工智能与机器学习",
                "persona_tags": ["技术乐观", "学术严谨", "数据驱动"],
                "color_identity": "#34d399", "avatar_emoji": "🔬",
            },
            {
                "role": "expert", "name": "王建国", "occupation": "制造业企业主",
                "title": "华东精密制造 CEO",
                "field": "工业自动化与劳动力市场",
                "persona_tags": ["务实", "经验丰富", "关注就业"],
                "color_identity": "#fbbf24", "avatar_emoji": "🏭",
            },
            {
                "role": "expert", "name": "陈雨萱", "occupation": "社会政策研究员",
                "title": "中国社会科学院副研究员",
                "field": "劳动经济学与社会保障",
                "persona_tags": ["人文关怀", "政策导向", "数据敏感"],
                "color_identity": "#f87171", "avatar_emoji": "📊",
            },
            {
                "role": "expert", "name": "赵明哲", "occupation": "创业者",
                "title": "灵犀AI 创始人兼 CEO",
                "field": "AI应用落地与企业转型",
                "persona_tags": ["实战派", "创新", "乐观"],
                "color_identity": "#a78bfa", "avatar_emoji": "🚀",
            },
        ],
        "transcript_preview": "李思然：从技术角度来看，AI在特定领域的表现确实惊人，但通用人工智能仍面临本质性挑战。\n王建国：作为制造业从业者，我亲眼看到自动化产线正在改变工厂，但技术替代的同时也创造了新的岗位。\n陈雨萱：我们需要关注的是转型期的社会保障问题，技术性失业的冲击需要政策提前布局。",
        "consensus": ["AI会深刻改变就业结构而非简单替代", "人机协作是未来主要工作模式"],
        "divergence": ["AI替代的速度预期：技术派认为5-10年，产业派认为10-20年"],
    },
    {
        "topic": "Web3 是技术革命还是资本泡沫？",
        "expert_count": 4,
        "status": "completed",
        "experts": [
            {
                "role": "host", "name": "吴晓峰", "occupation": "资深财经评论员",
                "title": "财经观察家",
                "field": "宏观经济与科技投资",
                "persona_tags": ["中立", "深度", "犀利"],
                "color_identity": "#818cf8", "avatar_emoji": "🎙",
            },
            {
                "role": "expert", "name": "刘天宇", "occupation": "区块链技术专家",
                "title": "ConsenSys 高级工程师",
                "field": "去中心化技术架构",
                "persona_tags": ["技术理想主义", "坚定", "前沿"],
                "color_identity": "#34d399", "avatar_emoji": "⛓",
            },
            {
                "role": "expert", "name": "周敏", "occupation": "风险投资人",
                "title": "经纬中国 VP",
                "field": "科技投资与项目管理",
                "persona_tags": ["理性", "回报驱动", "审慎"],
                "color_identity": "#fbbf24", "avatar_emoji": "💰",
            },
            {
                "role": "expert", "name": "杨雪", "occupation": "金融监管研究员",
                "title": "北京大学法学院研究员",
                "field": "金融科技监管政策",
                "persona_tags": ["严谨", "政策导向", "风险意识强"],
                "color_identity": "#f87171", "avatar_emoji": "⚖",
            },
            {
                "role": "expert", "name": "黄伟强", "occupation": "连续创业者",
                "title": "NFT平台 ArtMeta 联合创始人",
                "field": "数字资产与创作者经济",
                "persona_tags": ["乐观", "实战经验", "社群导向"],
                "color_identity": "#a78bfa", "avatar_emoji": "🎨",
            },
        ],
        "transcript_preview": "刘天宇：去中心化不仅仅是一项技术，更是一种全新的组织形态和协作方式。\n周敏：从投资角度看，90%的项目会归零，但剩下的10%可能改变世界。\n杨雪：监管不是阻碍，而是为了让这个行业健康发展而必要的护栏。",
        "consensus": ["区块链技术在特定场景确有实际价值", "行业需要合理监管"],
        "divergence": ["当前市场估值是否合理；技术应用是否已到达落地拐点"],
    },
    {
        "topic": "远程办公会成为未来主流工作模式吗？",
        "expert_count": 3,
        "status": "completed",
        "experts": [
            {
                "role": "host", "name": "林小雅", "occupation": "HR 行业观察者",
                "title": "《人力资源》杂志副主编",
                "field": "组织行为学与职场趋势",
                "persona_tags": ["亲和", "观察力强", "平衡"],
                "color_identity": "#818cf8", "avatar_emoji": "🎙",
            },
            {
                "role": "expert", "name": "张一川", "occupation": "科技公司高管",
                "title": "字节跳动技术VP",
                "field": "分布式团队管理",
                "persona_tags": ["效率导向", "技术驱动", "国际视野"],
                "color_identity": "#34d399", "avatar_emoji": "💻",
            },
            {
                "role": "expert", "name": "孙丽华", "occupation": "组织心理学教授",
                "title": "浙江大学管理学院教授",
                "field": "组织行为学与员工福祉",
                "persona_tags": ["学术严谨", "人文关怀", "数据支持"],
                "color_identity": "#fbbf24", "avatar_emoji": "🧠",
            },
            {
                "role": "expert", "name": "马强", "occupation": "传统企业高管",
                "title": "万科集团人力资源总监",
                "field": "传统行业组织管理",
                "persona_tags": ["务实", "经验丰富", "审慎变革"],
                "color_identity": "#f87171", "avatar_emoji": "🏢",
            },
        ],
        "transcript_preview": "张一川：远程办公让我们的工程师效率提升了30%，但协作成本确实增加了。\n孙丽华：研究表明完全远程会导致创新下降，面对面的偶发交流对于创意行业至关重要。\n马强：对于制造业和传统行业，远程只是辅助，现场管理依然是核心。",
        "consensus": ["混合办公是未来的趋势", "不同行业适合不同模式"],
        "divergence": ["远程对创新能力的影响程度；管理成本上升是否值得"],
    },
    {
        "topic": "新能源汽车的终极技术路线是纯电还是氢能？",
        "expert_count": 3,
        "status": "completed",
        "experts": [
            {
                "role": "host", "name": "陈志远", "occupation": "汽车行业分析师",
                "title": "汽车之家首席分析师",
                "field": "汽车产业趋势",
                "persona_tags": ["中立", "数据说话", "行业洞察"],
                "color_identity": "#818cf8", "avatar_emoji": "🎙",
            },
            {
                "role": "expert", "name": "高文博", "occupation": "电池技术专家",
                "title": "宁德时代研究院副院长",
                "field": "动力电池技术",
                "persona_tags": ["技术自信", "务实", "前瞻"],
                "color_identity": "#34d399", "avatar_emoji": "🔋",
            },
            {
                "role": "expert", "name": "山口太郎", "occupation": "氢能技术专家",
                "title": "丰田氢能研究院首席科学家",
                "field": "氢燃料电池技术",
                "persona_tags": ["执着", "技术深度", "环保理想主义"],
                "color_identity": "#fbbf24", "avatar_emoji": "💨",
            },
            {
                "role": "expert", "name": "赵雪梅", "occupation": "能源政策研究员",
                "title": "国家能源研究所研究员",
                "field": "能源战略与政策",
                "persona_tags": ["政策敏感", "全局观", "实用主义"],
                "color_identity": "#f87171", "avatar_emoji": "🌍",
            },
        ],
        "transcript_preview": "高文博：固态电池量产在即，纯电的续航焦虑即将成为历史。\n山口太郎：氢能在重载、长途场景下拥有纯电无法比拟的优势。\n赵雪梅：多技术路线并存是最现实的能源战略，各场景各取所需。",
        "consensus": ["纯电是当前主流路线", "氢能在特定场景有优势"],
        "divergence": ["氢能乘用车的前景；固态电池量产时间表"],
    },
    {
        "topic": "低代码/无代码平台会取代程序员吗？",
        "expert_count": 4,
        "status": "completed",
        "experts": [
            {
                "role": "host", "name": "徐天行", "occupation": "技术媒体人",
                "title": "InfoQ 中国主编",
                "field": "开发者生态与技术趋势",
                "persona_tags": ["中立", "社群连接", "深度思考"],
                "color_identity": "#818cf8", "avatar_emoji": "🎙",
            },
            {
                "role": "expert", "name": "何小明", "occupation": "资深全栈工程师",
                "title": "前阿里巴巴高级技术专家",
                "field": "软件工程与架构",
                "persona_tags": ["技术信仰", "务实", "热爱编码"],
                "color_identity": "#34d399", "avatar_emoji": "👨‍💻",
            },
            {
                "role": "expert", "name": "苏婉清", "occupation": "产品经理",
                "title": "飞书多维表格产品负责人",
                "field": "低代码平台产品设计",
                "persona_tags": ["用户导向", "创新", "跨界思维"],
                "color_identity": "#fbbf24", "avatar_emoji": "📱",
            },
            {
                "role": "expert", "name": "刘大鹏", "occupation": "中小企业主",
                "title": "悦动科技 CEO",
                "field": "中小企业的数字化需求",
                "persona_tags": ["实战派", "成本敏感", "效率至上"],
                "color_identity": "#f87171", "avatar_emoji": "🏪",
            },
            {
                "role": "expert", "name": "李悠然", "occupation": "计算机教育者",
                "title": "MIT 计算机科学讲师",
                "field": "编程教育与计算思维",
                "persona_tags": ["教育者", "基础理论", "未来视角"],
                "color_identity": "#a78bfa", "avatar_emoji": "🎓",
            },
        ],
        "transcript_preview": "何小明：低代码工具确实提高了效率，但复杂业务逻辑仍需要专业程序员。\n苏婉清：我们的目标是赋能业务人员，让他们能快速实现想法，而不是取代程序员。\n刘大鹏：对于中小公司，低代码确实让我们摆脱了对昂贵开发团队的依赖。\n李悠然：编程教育的核心是培养计算思维，工具会变，思维是永恒的。",
        "consensus": ["低代码是重要补充但不会完全取代程序员", "降低开发门槛是好事"],
        "divergence": ["程序员角色会如何演变；低代码的适用边界在哪里"],
    },
]


def seed():
    """Insert sample data into the database."""
    init_db()
    conn = get_connection()

    # Clear existing data
    for table in ["transcript_entries", "consensus_divergence", "experts", "discussions"]:
        conn.execute(f"DELETE FROM {table}")

    for sd in SAMPLE_DISCUSSIONS:
        status_map = {"pending": DiscussionStatus.PENDING, "preparing": DiscussionStatus.PREPARING,
                       "active": DiscussionStatus.ACTIVE, "paused": DiscussionStatus.PAUSED,
                       "completed": DiscussionStatus.COMPLETED}
        disc = Discussion(
            title=sd["topic"][:80],
            topic=sd["topic"],
            expert_count=sd["expert_count"],
            status=status_map.get(sd["status"], DiscussionStatus.COMPLETED),
        )
        create_discussion(disc)

        for i, ed in enumerate(sd["experts"]):
            expert = Expert(
                discussion_id=disc.id,
                role=ed["role"],
                name=ed["name"],
                occupation=ed["occupation"],
                title=ed["title"],
                field=ed["field"],
                persona_tags=ed["persona_tags"],
                color_identity=ed["color_identity"],
                avatar_emoji=ed["avatar_emoji"],
                status=ExpertStatus.DONE,
                speech_order=i,
            )
            create_expert(expert)

        # Add transcript preview
        lines = [l.strip() for l in sd["transcript_preview"].split("\n") if l.strip()]
        for seq, line in enumerate(lines, 1):
            if "：" in line:
                name, content = line.split("：", 1)
                expert_obj = next(
                    (e for e in sd["experts"] if e["name"] == name), None
                )
                if expert_obj:
                    expert_id = conn.execute(
                        "SELECT id FROM experts WHERE discussion_id = ? AND name = ?",
                        (disc.id, name),
                    ).fetchone()["id"]
                    add_transcript_entry(TranscriptEntry(
                        discussion_id=disc.id,
                        expert_id=expert_id,
                        speaker_name=name,
                        speaker_title=f"{expert_obj['occupation']} · {expert_obj['title']}",
                        content=content,
                        entry_type="speech",
                        sequence=seq,
                    ))

        # Add consensus/divergence
        for ci, c in enumerate(sd.get("consensus", [])):
            add_consensus_divergence(ConsensusDivergence(
                discussion_id=disc.id,
                category="consensus",
                content=c,
                sequence=ci + 1,
            ))

        for di, d in enumerate(sd.get("divergence", [])):
            add_consensus_divergence(ConsensusDivergence(
                discussion_id=disc.id,
                category="divergence",
                content=d,
                sequence=len(sd.get("consensus", [])) + di + 1,
            ))

        # Add summary
        experts_list = conn.execute(
            "SELECT id, name, occupation, title FROM experts WHERE discussion_id = ?",
            (disc.id,),
        ).fetchall()
        if experts_list:
            host = experts_list[0]  # First is host
            add_transcript_entry(TranscriptEntry(
                discussion_id=disc.id,
                expert_id=host["id"],
                speaker_name=host["name"],
                speaker_title=f"{host['occupation']} · {host['title']}",
                content=f"感谢各位关于「{sd['topic'][:50]}」的精彩讨论！今天的圆桌到此结束，我们下次再会！",
                entry_type="summary",
                sequence=len(lines) + 1,
            ))

        # Update host_summary
        disc.host_summary = f"关于「{sd['topic'][:50]}」的圆桌讨论已结束。"
        conn.execute(
            "UPDATE discussions SET host_summary = ? WHERE id = ?",
            (disc.host_summary[:200], disc.id),
        )

    conn.commit()
    print(f"Seeded {len(SAMPLE_DISCUSSIONS)} sample discussions successfully!")


if __name__ == "__main__":
    seed()
