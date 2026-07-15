# 🎙️ AI Panel Studio — AI 圆桌讨论 Web App

用户输入任意讨论议题，系统动态生成虚拟主持人和多领域专家，进行实时 AI 驱动的圆桌辩论。

## 核心功能

- 🏠 **首页** — 讨论列表展示、新建讨论
- 👥 **嘉宾生成** — 输入议题 → LLM 动态生成主持人 + 专家库
- 🎬 **演播厅模式** — 实时 AI 圆桌辩论，支持暂停/继续
- 📊 **专家状态小窗** — 每位专家独立 UI，实时展示 Agent 状态
- ✅ **实时共识与分歧** — 讨论过程中动态更新
- 📝 **现场 Transcript** — 实时流式转录

## 技术栈

| 层级 | 技术 |
|------|------|
| 后端框架 | Python FastAPI |
| 数据库 | SQLite (WAL模式) |
| 实时通信 | Server-Sent Events (SSE) |
| LLM API | 兼容 OpenAI 格式 (Deepseek / OpenAI 等) |
| 前端 | 纯 HTML + CSS + Vanilla JS |
| 测试 | pytest + pytest-asyncio |

## 快速开始

### 环境要求
- Python 3.11+
- uv (推荐) 或 pip

### 安装 & 运行

```bash
# 克隆
git clone https://github.com/IC-sd/ai-panel-studio.git
cd ai-panel-studio

# 安装依赖
uv venv --python 3.11 .venv
source .venv/bin/activate  # Linux/Mac
# .venv\Scripts\activate   # Windows
uv pip install -r backend/requirements.txt

# 配置环境变量
cp .env.example .env
# 编辑 .env，填入你的 LLM API Key

# 初始化种子数据
python data/seed_data.py

# 启动
python -m uvicorn backend.main:app --host 0.0.0.0 --port 8000
```

打开 **http://localhost:8000**

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

## 项目结构

```
ai-panel-studio/
├── backend/
│   ├── main.py                 # FastAPI 入口
│   ├── config.py               # 环境配置
│   ├── database.py             # SQLite 数据库管理
│   ├── models/                 # 数据模型 & 数据访问层
│   ├── api/                    # API 路由
│   └── services/               # 服务层 (LLM/讨论引擎/SSE)
├── frontend/
│   ├── index.html              # 主页面
│   ├── css/style.css           # 深色主题样式
│   └── js/                     # 前端脚本
├── tests/                      # 22 条测试
├── data/                       # 种子数据脚本
├── docs/                       # API 文档 & ER 图
└── .env.example
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
