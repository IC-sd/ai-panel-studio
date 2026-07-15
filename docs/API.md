# AI Panel Studio — API 文档

Base URL: `http://localhost:8000/api`

## Discussions

### 获取所有讨论列表
```
GET /discussions
```
Response: `200 OK`
```json
[
  {
    "id": "abc123",
    "title": "讨论标题",
    "topic": "讨论议题",
    "expert_count": 4,
    "status": "pending|preparing|active|paused|completed",
    "host_summary": null,
    "created_at": "2026-01-01T00:00:00",
    "updated_at": "2026-01-01T00:00:00"
  }
]
```

### 创建讨论
```
POST /discussions
```
Request:
```json
{
  "topic": "讨论议题",
  "expert_count": 4
}
```
Response: `201 Created` — 返回创建的讨论对象

### 获取讨论详情
```
GET /discussions/{id}
```
Response: 包含讨论信息、专家列表、转录内容、共识分歧

### 开始讨论
```
POST /discussions/{id}/start
```
Response: `{"status": "started", "id": "abc123"}`

### 暂停讨论
```
POST /discussions/{id}/pause
```

### 继续讨论
```
POST /discussions/{id}/resume`
```

### 删除讨论
```
DELETE /discussions/{id}
```

## Streaming (SSE)

### 订阅讨论事件流
```
GET /api/stream/{discussion_id}
```
SSE 事件类型：
- `discussion_status` — 讨论状态变更
- `experts_generated` — 专家生成完成
- `expert_status` — 单个专家状态更新
- `transcript` — 新的转录条目
- `consensus_divergence` — 新的共识/分歧点
- `error` — 错误信息
- `ping` — 心跳保活

## 数据模型

### Discussion
| 字段 | 类型 | 说明 |
|------|------|------|
| id | TEXT PK | UUID 12位hex |
| title | TEXT | 标题 |
| topic | TEXT | 议题 |
| expert_count | INTEGER | 专家数量 |
| status | TEXT | pending/preparing/active/paused/completed |
| host_summary | TEXT | 主持人总结 |
| created_at | TEXT | 创建时间 |
| updated_at | TEXT | 更新时间 |

### Expert
| 字段 | 类型 | 说明 |
|------|------|------|
| id | TEXT PK | UUID 12位hex |
| discussion_id | TEXT FK | 所属讨论 |
| role | TEXT | host/expert |
| name | TEXT | 姓名 |
| occupation | TEXT | 职业 |
| title | TEXT | 头衔 |
| field | TEXT | 领域 |
| persona_tags | TEXT JSON | 标签数组 |
| color_identity | TEXT | 配色标识 |
| status | TEXT | standby/preparing/ready/speaking/done |
| focus_point | TEXT | 当前关注点 |
| public_thought | TEXT | 公开思考 |
| speech_order | INTEGER | 发言顺序 |

### TranscriptEntry
| 字段 | 类型 | 说明 |
|------|------|------|
| id | INTEGER PK | 自增 |
| discussion_id | TEXT FK | 所属讨论 |
| expert_id | TEXT FK | 发言专家 |
| speaker_name | TEXT | 发言人姓名 |
| speaker_title | TEXT | 发言人职称 |
| content | TEXT | 发言内容 |
| entry_type | TEXT | speech/system/host_interject/summary |
| sequence | INTEGER | 顺序号 |

### ConsensusDivergence
| 字段 | 类型 | 说明 |
|------|------|------|
| id | INTEGER PK | 自增 |
| discussion_id | TEXT FK | 所属讨论 |
| category | TEXT | consensus/divergence |
| content | TEXT | 内容 |
| source_expert_ids | TEXT JSON | 相关专家ID列表 |
| sequence | INTEGER | 顺序号 |
