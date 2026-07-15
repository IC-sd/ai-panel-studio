# 开发过程思路 & 工作流说明

## 概述

本文档记录了使用 **Hermes Agent（对接 Deepseek V4 Flash 模型）** 完成 AI Panel Studio 项目的完整开发过程，包括工作流设计、AI 协作经验和工程化思考。

## 开发流程

### 阶段一：需求分析与架构设计（SDD）

**输入**：业务需求文档（AI 圆桌讨论 MVP 的 5 个功能要求）

**工作流**：
1. 需求拆解 → 4 个核心实体（Discussion, Expert, TranscriptEntry, ConsensusDivergence）
2. 状态机设计 → 讨论状态（6 种） + 专家状态（5 种）流转图
3. SQLite Schema 设计 → 4 张表 + 外键约束 + 级联删除
4. API 契约 → 7 个 REST 端点 + 1 个 SSE 流端点
5. 架构分层 → API 层 / 服务层 / 数据访问层 / SSE 管理层

**关键决策**：
- 选择 FastAPI 而非 Flask，因其原生异步支持和 SSE 支持
- SQLite 的 WAL 模式提升并发读取性能
- 使用 `threading.local()` 实现线程安全的数据库连接

### 阶段二：前端设计与开发（DDD）

**输入**：SDD 阶段的 API 契约

**工作流**：
1. 设计深色主题 UI 规范 → CSS 变量系统 + 配色方案
2. 组件拆分 → 首页列表 / 演播厅 / 专家卡片 / 转录区 / 共识分歧面板
3. 响应式布局 → 三档断点（700px, 900px, 无限制）
4. SSE 客户端 → 自动重连 + 7 种事件处理

**设计原则**：
- 整页不做顶层滚动，每个内容区独立滚动
- 专家卡片左边框使用 CSS 变量 `--expert-color` 实现个性化配色
- 状态指示灯使用 CSS pulse 动画表达"发言中"的实时感
- 新转录条目自动滚动到底部

### 阶段三：测试驱动开发（TDD）

**输入**：数据模型和 API 契约

**工作流**：
1. 先写测试：22 条测试用例覆盖所有数据操作
2. Fixture 设计：每个测试使用独立内存 SQLite
3. 业务逻辑验证：状态流转、级联删除、多讨论隔离
4. 测试即文档：每条测试描述一个业务场景

### 阶段四：端到端集成（E2E）

**输入**：完整的前后端代码

**工作流**：
1. 生成 5 组高质量种子数据（覆盖不同社会热点议题）
2. 启动 uvicorn 服务器
3. 用 curl 验证所有 API 端点
4. 检查前端页面正确渲染
5. 运行全部测试套件（22/22 通过）

## AI 协作中的经典问题

### 问题 1：命名冲突（Python dataclasses）

**现象**：`Expert` 类的 `field` 属性和 `dataclasses.field()` 函数冲突，导致 `TypeError: 'str' object is not callable`。

**原因**：在 `from __future__ import annotations` 开启的情况下，Python 将注解转换为字符串，但类的属性 `field: str = ""` 在运行时仍然会覆盖同名的导入函数。

**解决方案**：将 `dataclasses.field` 重命名为 `dataclass_field` 导入：
```python
from dataclasses import dataclass, field as dataclass_field
```

**教训**：AI 生成的代码在 ORM 模型 / dataclass 中经常出现字段名与标准库函数冲突，开发者在 Review 时需特别留意 `field`, `type`, `id`, `format` 等常见命名。

### 问题 2：SSE 的多讨论隔离设计

**挑战**：讨论引擎需要支持多个讨论并行运行，每个讨论的 SSE 事件流必须完全隔离，不能互相干扰。

**初始方案**：全局广播 + 前端过滤 → 不可接受（带宽浪费 + 隐私问题）

**最终方案**：`SSEManager` 使用 `dict[str, list[asyncio.Queue]]`，以 `discussion_id` 为 key，每个讨论拥有独立的订阅者队列列表。发布事件时只向对应讨论的队列推送：

```python
class SSEManager:
    def __init__(self):
        self._subscribers: dict[str, list[asyncio.Queue]] = {}
    
    async def publish(self, discussion_id, event, data):
        if discussion_id not in self._subscribers:
            return
        for queue in self._subscribers[discussion_id]:
            await queue.put(message)
```

**效果**：每个讨论的 SSE 连接只接收本讨论的事件，客户端无需额外过滤。

### 问题 3：TDD 中数据库重置的线程安全问题

**挑战**：pytest 使用多线程/协程运行测试，而 SQLite 连接存储在 `threading.local()` 中，测试间可能互相污染。

**解决方案**：在 fixture 中重置 `_local` 线程局部变量，并使用 `:memory:` 数据库：
```python
@pytest.fixture(autouse=True)
def setup_db():
    import backend.database as db_mod
    db_mod.settings.database_path = ":memory:"
    if hasattr(db_mod._local, "conn"):
        db_mod._local.conn = None
    init_db()
    yield
    close_db()
```

## 对"工程化 AI 开发"的理解

### 1. AI 是协作者，不是替代者

本项目展示了 AI 工具（Hermes Agent / Deepseek）的合理使用方式：**AI 负责执行和生成，人类负责决策和方向**。从架构设计到代码实现，AI 提供了高效执行，但每个关键决策点（技术选型、架构分层、数据模型设计）都经过了人工判断。

### 2. 分层 Prompt 是工程化关键

相比"一键生成"的单一 Prompt 方法，本项目采用了分层 Prompt 策略：
- **宏观 Prompt**：定义阶段目标（如"设计数据模型"）
- **微观 Prompt**：指导具体实现（如"解决 field 命名冲突"）
- **验证 Prompt**：检查输出质量（如"运行测试套件"）

这种分层使得每个阶段的输出都经过验证，质量问题可以精准定位到具体阶段。

### 3. TDD 是质量保障的核心

在 AI 辅助开发中，**测试是可信度的锚点**。22 条测试覆盖了所有核心数据操作和业务逻辑，每次修改后运行测试套件可以快速验证改动是否引入回归。

### 4. 产品还原度来自迭代

"早熟型"的精髓在于：**先有可用的 MVP，再逐步迭代完善**。AI Panel Studio 从需求到可运行产品经过 SDD → DDD → TDD → E2E 四个阶段，每阶段都有可验证的产物，而不是一次性生成全部代码。

### 总结

工程化 AI 开发 = **结构化需求拆解** + **分层 Prompt 执行** + **测试驱动的质量闭环** + **人对关键决策的掌控**。这套方法论让 AI 从"玩具"变成了真正的生产力工具。
