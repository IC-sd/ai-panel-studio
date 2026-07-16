import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useDiscussionStore } from '../store/discussion'
import { connectSSE } from '../lib/sse-client'
import { RoundTable } from './RoundTable'

const statusLabels: Record<string, string> = {
  pending: '待开始', preparing: '准备中', active: '讨论中',
  paused: '已暂停', completed: '已结束',
}

export function StudioPage() {
  const { id } = useParams<{ id: string }>()
  const nav = useNavigate()
  const store = useDiscussionStore()
  const [speakingId, setSpeakingId] = useState<string | null>(null)

  useEffect(() => {
    if (!id) return
    store.openDiscussion(id).then(() => {
      const cleanup = connectSSE(id)
      return cleanup
    })
  }, [id])

  // Track who's speaking from expert status updates
  useEffect(() => {
    const speaking = store.experts.find((e) => e.status === 'speaking')
    setSpeakingId(speaking?.id || null)
  }, [store.experts])

  if (!store.currentId) {
    return <div className="flex-1 flex items-center justify-center text-[#6b6b85]">加载中...</div>
  }

  const status = store.status

  return (
    <>
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-3 border-b border-[#2e2e50] bg-[#1a1a2e] shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <button onClick={() => nav('/')} className="text-lg cursor-pointer hover:opacity-80 shrink-0">←</button>
          <span className="text-sm font-semibold truncate">{store.topic}</span>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {status === 'pending' && (
            <button
              onClick={() => store.startDiscussion()}
              className="px-3 py-1.5 rounded-lg bg-[#34d399] text-[#0f0f1a] text-xs font-semibold hover:brightness-110 transition-all cursor-pointer"
            >
              ▶ 开始圆桌
            </button>
          )}
          {status === 'active' && (
            <button
              onClick={() => store.pauseDiscussion()}
              className="px-3 py-1.5 rounded-lg bg-[#fbbf24] text-[#0f0f1a] text-xs font-semibold hover:brightness-110 transition-all cursor-pointer"
            >
              ⏸ 暂停
            </button>
          )}
          {status === 'paused' && (
            <button
              onClick={() => store.resumeDiscussion()}
              className="px-3 py-1.5 rounded-lg bg-[#818cf8] text-white text-xs font-semibold hover:bg-[#6366f1] transition-all cursor-pointer"
            >
              ▶ 继续
            </button>
          )}
          <span className={`text-xs px-2.5 py-1 rounded-full ${
            status === 'active' ? 'bg-[#34d399]/15 text-[#34d399]' :
            status === 'paused' ? 'bg-[#f87171]/15 text-[#f87171]' :
            status === 'completed' ? 'bg-[#a0a0b8]/15 text-[#a0a0b8]' :
            'bg-[#a0a0b8]/15 text-[#a0a0b8]'
          }`}>
            {statusLabels[status] || status}
          </span>
        </div>
      </div>

      {/* Canvas round table */}
      <div className="flex-1 relative overflow-hidden bg-gradient-to-b from-[#12101e] to-[#0a0815]">
        <RoundTable
          experts={store.experts}
          transcript={store.transcript}
          speakingId={speakingId}
          topic={store.topic}
        />
      </div>

      {/* Consensus & Divergence footer */}
      <div className="flex gap-4 px-6 py-3 border-t border-[#2e2e50] bg-[#0f0f1a]/80 shrink-0">
        <div className="flex-1">
          <div className="text-xs font-semibold text-[#34d399] mb-1">✅ 共识</div>
          {store.consensusDivergence.filter((c) => c.category === 'consensus').length === 0 ? (
            <div className="text-xs text-[#6b6b85]">暂无</div>
          ) : (
            store.consensusDivergence
              .filter((c) => c.category === 'consensus')
              .map((c) => (
                <div key={c.id} className="text-xs text-[#a0a0b8] leading-relaxed">• {c.content}</div>
              ))
          )}
        </div>
        <div className="flex-1">
          <div className="text-xs font-semibold text-[#f87171] mb-1">⚠️ 分歧</div>
          {store.consensusDivergence.filter((c) => c.category === 'divergence').length === 0 ? (
            <div className="text-xs text-[#6b6b85]">暂无</div>
          ) : (
            store.consensusDivergence
              .filter((c) => c.category === 'divergence')
              .map((c) => (
                <div key={c.id} className="text-xs text-[#a0a0b8] leading-relaxed">• {c.content}</div>
              ))
          )}
        </div>
      </div>
    </>
  )
}
