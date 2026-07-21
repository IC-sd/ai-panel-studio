# 🎙️ AI Panel Studio — AI 圆桌讨论 Web App

用户输入任意讨论议题，系统动态生成虚拟主持人和多领域专家，进行实时 AI 驱动的圆桌辩论。

## 核心功能

- 🏠 **首页** — 讨论列表展示、新建讨论
- 👥 **嘉宾生成** — 输入议题 → LLM 动态生成主持人 + 专家库
- 🎬 **演播厅模式** — 实时 AI 圆桌辩论，支持暂停/继续
- 📊 **专家状态小窗** — 每位专家独立 UI，实时展示 Agent 状态
- ✅ **实时共识与分歧** — 讨论过程中动态更新
- 📝 **现场 Transcript** — 实时流式转录
- ⚙️ **设置面板** — 在界面中自由配置 API Key、模型、提供商、API 地址

## 技术栈

| 层级 | 技术 |
|------|------|
| 后端框架 | Python FastAPI |
| 数据库 | SQLite (WAL模式) |
| 实时通信 | Server-Sent Events (SSE) |
| LLM API | 兼容 OpenAI 格式（Deepseek / OpenAI / 自定义） |
| 前端 | React + TypeScript + Tailwind CSS |
| 状态管理 | Zustand |
| 构建工具 | Vite |
| 测试 | pytest + pytest-asyncio |

## 快速开始

### 环境要求
- Python 3.11+
- Node.js 18+
- uv (推荐) 或 pip

### 1. 克隆 & 安装后端

```bash
git clone https://github.com/IC-sd/ai-panel-studio.git
cd ai-panel-studio

uv venv --python 3.11 .venv
source .venv/bin/activate      # Linux/Mac
# .venv\Scripts\activate       # Windows

uv pip install -r backend/requirements.txt
```

### 2. 安装前端 & 构建

```bash
cd frontend-new
npm install
npx vite build
cd ..
```

### 3. 初始化种子数据（可选）

```bash
python data/seed_data.py
```

### 4. 启动

```bash
python -m uvicorn backend.main:app --host 0.0.0.0 --port 8000
```

### 5. 打开浏览器

访问 **http://127.0.0.1:8000**

### 6. 配置 API Key

进入页面后，点击左侧导航栏底部的 **⚙️ 设置**，填入：
- API Key（必填）
- 模型（默认 deepseek-chat）
- AI 提供商（Deepseek / OpenAI / 自定义）
- API 地址

Key 仅在本地内存中使用，服务重启后需重新配置。

## 开发模式（前后端热更新）

```bash
# 终端 1：启动后端
python -m uvicorn backend.main:app --host 127.0.0.1 --port 8000 --reload

# 终端 2：启动前端开发服务器（自动代理 API 到后端）
cd frontend-new
npx vite dev     # 访问 http://localhost:5173
```

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
| GET | `/api/config` | 查看已配置项（不返回 Key） |
| POST | `/api/config` | 设置配置项 |

## 运行测试

```bash
python -m pytest tests/ -v
```

## 项目结构

```
ai-panel-studio/
├── backend/
│   ├── main.py                 # FastAPI 入口
│   ├── config.py               # 环境配置（.env 后备）
│   ├── database.py             # SQLite 数据库管理
│   ├── models/                 # 数据模型 & 数据访问层
│   ├── api/                    # API 路由（含 config）
│   └── services/               # 服务层（LLM/讨论引擎/SSE/运行时配置）
├── frontend-new/               # React + TypeScript 前端
│   ├── src/
│   │   ├── components/         # React 组件
│   │   ├── store/              # Zustand 状态管理
│   │   ├── lib/                # API 客户端
│   │   └── types/              # TypeScript 类型
│   └── dist/                   # 构建产物（生产模式使用）
├── frontend/                   # 旧版 Vanilla JS 前端（保留）
├── tests/                      # 22 条测试
├── data/                       # 种子数据脚本
├── docs/                       # API 文档 & ER 图
└── .env.example                # 环境变量模板
```

## 样本数据

预置 5 组高质量讨论数据：

1. AI 是否会在未来十年取代大部分人类工作？
2. Web3 是技术革命还是资本泡沫？
3. 远程办公会成为未来主流工作模式吗？
4. 新能源汽车的终极技术路线是纯电还是氢能？
5. 低代码/无代码平台会取代程序员吗？

## 许可

MIT License
