# 🎙️ AI Panel Studio — AI 圆桌讨论 Web App

> **AI开发实习生远程作业项目**  
> 从 0 到 1，遵循 SDD → DDD → TDD → E2E 多范式工程化开发流程

## 产品介绍

**AI Panel Studio** 是一个 AI 圆桌讨论 Web 应用。用户输入任意讨论议题，系统动态生成虚拟主持人和多领域专家，进行实时 AI 驱动的圆桌辩论。

### 核心功能

- 🏠 **首页** — 讨论列表展示、新建讨论
- 👥 **嘉宾生成** — 输入议题 → LLM 动态生成主持人 + 专家库
- 🎬 **演播厅模式** — 实时 AI 圆桌辩论，支持暂停/继续
- 📊 **专家状态小窗** — 每位专家独立 UI，实时展示 Agent 状态
- ✅ **实时共识与分歧** — 讨论过程中动态更新
- 📝 **现场 Transcript** — 实时流式转录

## 技术栈

| 层级 | 技术 | 说明 |
|------|------|------|
| 后端框架 | Python FastAPI | 异步高性能 Web 框架 |
| 数据库 | SQLite (WAL模式) | 零配置嵌入式数据库 |
| 实时通信 | Server-Sent Events (SSE) | 轻量级服务端推送 |
| LLM API | Deepseek API | 兼容 OpenAI 格式 |
| 前端 | 纯 HTML + CSS + Vanilla JS | 无框架依赖 |
| 测试 | pytest + pytest-asyncio | 22 条测试用例 |
| 包管理 | uv | 快速 Python 包管理 |

## 快速开始

### 环境要求

- Python 3.11+
- uv (推荐) 或 pip

### 1. 克隆项目

```bash
git clone https://github.com/IC-sd/ai-panel-studio.git
cd ai-panel-studio
```

### 2. 安装依赖

```bash
uv venv --python 3.11 .venv
source .venv/bin/activate  # Linux/Mac
# 或 .venv\Scripts\activate  # Windows

uv pip install -r backend/requirements.txt
```

### 3. 配置环境变量

```bash
cp .env.example .env
```

编辑 `.env`，填入你的 Deepseek API Key：

```
DEEPSEEK_API_KEY=sk-your-deepseek-api-key-here
DEEPSEEK_API_BASE=https://api.deepseek.com/v1
DEEPSEEK_MODEL=deepseek-chat
DATABASE_PATH=./data/panel_studio.db
HOST=0.0.0.0
PORT=8000
```

### 4. 初始化数据库 & 种子数据

```bash
python data/seed_data.py
```

### 5. 启动服务

```bash
python -m uvicorn backend.main:app --host 0.0.0.0 --port 8000
```

### 6. 打开浏览器

访问 **http://localhost:8000**

## API 接口

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/discussions` | 获取所有讨论列表 |
| POST | `/api/discussions` | 创建新讨论 |
| GET | `/api/discussions/{id}` | 获取讨论详情 |
| POST | `/api/discussions/{id}/start` | 开始讨论 |
| POST | `/api/discussions/{id}/pause` | 暂停讨论 |
| POST | `/api/discussions/{id}/resume` | 继续讨论 |
| DELETE | `/api/discussions/{id}` | 删除讨论 |
| GET | `/api/stream/{id}` | SSE 事件流 |

完整 API 文档见 [docs/API.md](docs/API.md)

## 运行测试

```bash
python -m pytest tests/ -v
```

预期输出：22 passed

## 项目结构

```
ai-panel-studio/
├── backend/
│   ├── main.py                 # FastAPI 入口
│   ├── config.py               # 环境配置
│   ├── database.py             # SQLite 数据库管理
│   ├── models/                 # 数据模型 & 数据访问层
│   │   ├── discussion.py
│   │   ├── expert.py
│   │   └── transcript.py
│   ├── api/                    # API 路由
│   │   ├── discussions.py
│   │   └── streaming.py
│   └── services/               # 服务层
│       ├── llm_service.py      # Deepseek API 服务
│       ├── discussion_engine.py # 讨论引擎
│       └── sse_manager.py      # SSE 事件管理器
├── frontend/
│   ├── index.html              # 主页面
│   ├── css/style.css           # 样式
│   └── js/                     # 前端脚本
│       ├── api.js
│       ├── app.js
│       ├── sse-client.js
│       └── components/
├── tests/
│   └── test_models.py          # 22 条测试用例
├── data/
│   └── seed_data.py            # 5 组样本数据
├── docs/
│   ├── PRD.md                  # 产品需求文档
│   ├── API.md                  # API 文档
│   ├── ER.md                   # ER 图 (Mermaid)
│   ├── prompt-record.md        # Core Prompt 记录
│   └── workflow.md             # 开发工作流说明
├── .env.example
├── .gitignore
└── README.md
```

## 样本数据

预置 5 组高质量讨论数据：

1. AI 是否会在未来十年取代大部分人类工作？
2. Web3 是技术革命还是资本泡沫？
3. 远程办公会成为未来主流工作模式吗？
4. 新能源汽车的终极技术路线是纯电还是氢能？
5. 低代码/无代码平台会取代程序员吗？

## 开发范式

本项目遵循 **SDD + DDD + TDD + E2E** 多范式工程化开发流程：

| 阶段 | 内容 | 产物 |
|------|------|------|
| **SDD** | 数据建模 & API 契约设计 | 数据模型、API 路由、数据库 Schema |
| **DDD** | 前端设计与开发 | UI 组件、页面、样式系统 |
| **TDD** | 测试先行 & 业务实现 | 22 条测试用例、业务逻辑 |
| **E2E** | 端到端集成 & 质量闭环 | 种子数据、集成验证 |

## 许可

MIT License
