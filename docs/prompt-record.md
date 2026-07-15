# Core Prompt 记录文档

本文档记录了 AI Panel Studio 项目开发过程中各阶段的核心 Prompt，遵循 **SDD + DDD + TDD + E2E** 多范式工程路线。

---

## 【SDD 阶段】数据模型 & API 契约生成

### Prompt 1: 数据模型定义

**阶段说明**：SDD（Spec/Schema-Driven Development）前期，基于业务需求驱动数据建模和 API 契约定义。

**Prompt 原文**：
```
根据以下业务需求设计数据模型和 API 接口：

业务需求：AI 圆桌讨论 Web App MVP
- 用户输入议题，系统动态生成主持人+多领域专家
- 专家在演播厅中进行实时 AI 驱动讨论
- 实时转录、共识/分歧分析、专家状态跟踪
- 多讨论并行运行，数据完全隔离
- SQLite 数据库，前后端分离

请完成：
1. 设计 4 个核心数据表（discussions, experts, transcript_entries, consensus_divergence）
2. 每个表的字段、类型、约束、外键关系
3. 对应的 Python 数据模型（使用 dataclass）
4. 完整的 CRUD 数据访问层函数

要求：
- 专家状态流转：standby -> preparing -> speaking -> done
- 讨论状态流转：pending -> preparing -> active -> paused -> completed
- 字段 field 与 dataclasses.field 命名需避免冲突
- 支持级联删除
```

**说明**：第一版模型设计时遇到了 `field` 属性与 `dataclasses.field()` 的命名冲突，通过将导入重命名为 `dataclass_field` 解决。同时发现 `from __future__ import annotations` 对 dataclass 的兼容性问题，最终在 Expert 模型上全部显式使用 `dataclass_field` 调用。

---

### Prompt 2: API 路由设计

**阶段说明**：在数据模型确定后，设计 RESTful API 路由和 SSE 流式接口。

**Prompt 原文**：
```
基于已定义的数据模型（Discussion, Expert, TranscriptEntry, ConsensusDivergence），
设计 FastAPI 路由：

1. Discussions API：
   - GET /api/discussions - 列表（按更新时间倒序）
   - POST /api/discussions - 创建（接收 topic + expert_count，异步生成专家）
   - GET /api/discussions/{id} - 详情（含专家、转录、共识分歧）
   - POST /api/discussions/{id}/start - 启动讨论
   - POST /api/discussions/{id}/pause - 暂停
   - POST /api/discussions/{id}/resume - 继续
   - DELETE /api/discussions/{id} - 删除

2. SSE Streaming：
   - GET /api/stream/{id} - 事件流（discussion_status, experts_generated, 
     expert_status, transcript, consensus_divergence, error, ping）

要求：
- 所有请求/响应使用 Pydantic 模型
- SSE 使用 asyncio.Queue 实现每讨论独立队列
- 30 秒心跳保活
- 中文错误提示
```

**说明**：设计时重点考虑了 SSE 的多讨论隔离——每个讨论独立维护一个订阅者队列列表，发布事件时只推送对应讨论的订阅者。心跳使用 30 秒超时配合 `asyncio.wait_for` 实现。

---

## 【DDD 阶段】前端组件 & 页面生成

### Prompt 3: 前端架构与 UI 设计

**阶段说明**：DDD（Design-Driven Development）中期，以 UX 为导向定义视觉风格和交互设计。

**Prompt 原文**：
```
为 AI 圆桌讨论应用设计并实现前端界面：

设计规范：
- 深色主题（现代化科技感）
- 左侧固定侧边栏（220px）+ 右侧主内容区
- 整页不做顶层滚动，每个内容区域各自内部滚动
- 响应式布局：超窄屏(侧栏收缩图标)、正常、全宽合理分栏

页面结构：
1. 首页（讨论列表）：
   - 卡片式布局，显示议题、专家数量、状态、时间
   - 状态徽章：待开始(紫色)、准备中(黄色)、进行中(绿色)、已暂停(红色)、已完成(灰色)
   - 空状态提示
   - 新建讨论对话框（议题输入框 + 专家数量选择）

2. 演播厅页面：
   - 左栏：专家阵容网格 + 共识/分歧面板
   - 右栏：实时转录区（自动滚动到底部）
   - 专家卡片：头像emoji + 姓名 + 职称 + 领域 + 标签 + 状态指示灯
   - 控制按钮：开始/暂停/继续
   - 每段发言显示发言人姓名（着色）、职称、内容

交互要求：
- SSE 实时推送时，新转录条目自动滚动到底部
- 专家状态变化时卡片动画过渡（pulse闪烁）
- 新建讨论后自动跳转到演播厅
- 连接状态指示器

技术约束：
- 纯 HTML + CSS + Vanilla JS，无框架依赖
- CSS 变量实现主题统一
- 所有组件使用 IIFE 或全局命名空间隔离
- ES6+ 语法，不使用 TypeScript
```

**说明**：UI 设计采用深色主题 + 紫色强调色为主的配色方案。状态指示灯使用 CSS `@keyframes pulse` 动画让发言中的专家卡片有呼吸感。专家卡片的左边框使用 `--expert-color` CSS 变量实现每个专家不同的配色标识。响应式布局在 900px 以下将左右分栏改为上下排列。

---

## 【TDD 阶段】测试用例 & 业务实现

### Prompt 4: 测试驱动开发

**阶段说明**：TDD（Test-Driven Development）后期，先写测试用例，再实现业务逻辑。

**Prompt 原文**：
```
为 AI Panel Studio 编写完整的测试套件，覆盖以下测试场景：

1. Discussion 模型测试：
   - 创建、查询、更新状态、更新总结、删除、序列化
   - 查询不存在的讨论返回 None

2. Expert 模型测试：
   - 创建专家、按讨论查询列表、更新状态、更新综合状态
   - 级联删除（删除讨论时关联专家应被删除）

3. Transcript 模型测试：
   - 新增转录条目、获取转录列表
   - 新增共识分歧、获取共识分歧列表

4. 讨论引擎核心逻辑测试（不依赖 LLM）：
   - 状态生命周期：pending -> active -> paused -> active -> completed
   - 专家状态生命周期：standby -> preparing -> speaking -> done
   - 级联删除验证
   - 多讨论隔离性验证
   - 共识分歧隔离性验证

测试要求：
- 每个测试使用独立的内存数据库（pytest fixture）
- 使用 pytest，测试函数命名清晰描述测试场景
- 测试应不依赖外部 API
- 22+ 条测试用例覆盖所有核心路径

测试环境使用内存 SQLite，每个测试前重置数据库状态。
```

**说明**：测试是 TDD 核心环节。最初使用 sqlite3 的 `:memory:` 特性在每个测试前创建独立数据库，确保完全隔离。共编写 22 条测试用例，覆盖所有核心数据操作和状态流转。后续追加了讨论引擎的业务逻辑验证。

---

## 【E2E 阶段】端到端测试 & 质量循环

### Prompt 5: 种子数据与端到端验证

**阶段说明**：E2E（End-to-End Testing）最后阶段，系统集成测试。

**Prompt 原文**：
```
生成 5 组高质量样本数据用于开发演示和 E2E 测试：

每组数据要求：
- 不同议题（覆盖科技、社会、能源、职场、开发者生态等话题）
- 3-4 位风格各异的专家（含主持人）
- 每个专家有完整的 name, occupation, title, field, persona_tags, color_identity, avatar_emoji
- 模拟的转录预览（体现观点碰撞）
- 共识点和分歧点

讨论议题：
1. AI 是否会在未来十年取代大部分人类工作？
2. Web3 是技术革命还是资本泡沫？
3. 远程办公会成为未来主流工作模式吗？
4. 新能源汽车的终极技术路线是纯电还是氢能？
5. 低代码/无代码平台会取代程序员吗？

每个专家的设定要有差异化立场，模拟真实讨论中的观点多样性。
转录内容要体现：赞同、补充、反驳等真实讨论互动。

运行 seed 脚本后，用 curl 验证：
1. GET /api/discussions 返回 5 条记录
2. GET /api/discussions/{id} 返回完整详情（含专家、转录、共识分歧）
3. 前端页面正确渲染
4. 所有 22 条 pytest 测试通过
```

**说明**：种子数据的设计体现了产品要求的"真实感"——每个专家有独立的职业背景和观点立场。5 个议题覆盖不同的社会热点，专家阵容反映了讨论的真实多样性。E2E 验证通过 API 响应断言 + 前端页面渲染 + pytest 测试套件三重保证。

---

## 总结

### 技术债与改进点
1. **LLM 集成**：当前讨论引擎的 LLM 调用需要配置 Deepseek API Key。后续可以增加 fallback 机制，在 API 不可用时使用模板对话。
2. **实时性优化**：当前 SSE 每 30 秒心跳，专家发言间隔 0.3-0.5 秒。可以进一步优化为流式输出实时显示。
3. **前端状态管理**：当前使用全局变量 + DOM 直接操作，后续可以引入简单状态机管理。
4. **测试覆盖率**：当前 22 条测试覆盖数据层，讨论引擎的 LLM 交互部分需要 mock 测试。

### AI 协作反思
1. **命名冲突是常见的"AI 盲点"**：`field` 属性与 `dataclasses.field` 的冲突是 Python 新手和老手都可能忽略的陷阱，AI 生成的代码需要人工审阅。
2. **SSE 的多讨论隔离设计**：SSE 管理器使用 `asyncio.Queue` 的讨论隔离方案，经过 AI 讨论后选择了按讨论 ID 分队列 + 心跳保活的模式，比全局广播更高效。
3. **TDD 的 Fixture 设计**：在内存数据库的 fixture 中重置 `_local` 线程局部变量是关键的测试技巧，纯 AI 生成的测试代码可能忽略线程安全细节。
