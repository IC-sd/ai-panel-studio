import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useDiscussionStore } from '../store/discussion'
import { connectSSE } from '../lib/sse-client'

const statusLabels: Record<string, string> = {
  pending: '待开始', preparing: '准备中', active: '讨论中',
  paused: '已暂停', completed: '已结束',
}
const statusBtnClass: Record<string, string> = {
  pending: 'bg-[#34d399] text-[#0f0f1a] hover:brightness-110',
  active: 'bg-[#fbbf24] text-[#0f0f1a] hover:brightness-110',
  paused: 'bg-[#818cf8] text-white hover:bg-[#6366f1]',
}

export function StudioPage() {
  const { id } = useParams<{ id: string }>()
  const nav = useNavigate()
  const store = useDiscussionStore()

  useEffect(() => {
    if (!id) return
    store.openDiscussion(id).then(() => connectSSE(id))
  }, [id])

  if (!store.currentId) {
    return <div className="flex-1 flex items-center justify-center text-[#6b6b85]">加载中...</div>
  }

  const consensus = store.consensusDivergence.filter(c => c.category === 'consensus')
  const divergence = store.consensusDivergence.filter(c => c.category === 'divergence')

  return (
    <>
      {/* ── Header ── */}
      <div className="flex items-center justify-between px-6 py-3 border-b border-[#2e2e50] bg-[#1a1a2e] shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <button onClick={() => nav('/')} className="text-lg cursor-pointer hover:opacity-80 shrink-0">←</button>
          <span className="text-sm font-semibold truncate">{store.topic}</span>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {store.status === 'pending' && (
            <button onClick={() => store.startDiscussion()} className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${statusBtnClass.pending}`}>▶ 开始圆桌</button>
          )}
          {store.status === 'active' && (
            <button onClick={() => store.pauseDiscussion()} className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${statusBtnClass.active}`}>⏸ 暂停</button>
          )}
          {store.status === 'paused' && (
            <button onClick={() => store.resumeDiscussion()} className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${statusBtnClass.paused}`}>▶ 继续</button>
          )}
          <span className={`text-xs px-2.5 py-1 rounded-full ${
            store.status === 'active' ? 'bg-[#34d399]/15 text-[#34d399]' :
            store.status === 'paused' ? 'bg-[#f87171]/15 text-[#f87171]' :
            store.status === 'completed' ? 'bg-[#a0a0b8]/15 text-[#a0a0b8]' :
            'bg-[#a0a0b8]/15 text-[#a0a0b8]'
          }`}>{statusLabels[store.status] || store.status}</span>
        </div>
      </div>

      {/* ── Main: experts left + transcript right ── */}
      <div className="flex-1 flex overflow-hidden min-h-0">
        {/* Left: Expert panel */}
        <div className="w-[260px] min-w-[260px] border-r border-[#2e2e50] flex flex-col">
          <div className="px-4 py-3 border-b border-[#2e2e50] shrink-0">
            <h3 className="text-xs font-semibold text-[#a0a0b8] uppercase tracking-wider">👥 专家阵容</h3>
          </div>
          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {store.experts.map(ex => {
              const color = ex.color_identity || '#818cf8'
              const isHost = ex.role === 'host'
              const isSpeaking = ex.status === 'speaking'
              const isPreparing = ex.status === 'preparing'
              return (
                <div
                  key={ex.id}
                  className={`rounded-xl p-3 border transition-all ${
                    isSpeaking ? 'border-transparent' : 'border-[#2e2e50]'
                  } ${isSpeaking ? 'bg-[#222240]' : 'bg-[#1a1a2e]'}`}
                  style={{
                    boxShadow: isSpeaking ? `0 0 20px ${color}22, inset 0 0 20px ${color}11` : '',
                    borderColor: isSpeaking ? color : undefined,
                  }}
                >
                  <div className="flex items-center gap-2.5 mb-1.5">
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center text-sm shrink-0"
                      style={{ background: `${color}33` }}
                    >
                      {ex.avatar_emoji || '🧑'}
                    </div>
                    <div className="min-w-0">
                      <div className="text-sm font-semibold truncate flex items-center gap-1.5">
                        {ex.name}
                        {isHost && <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#818cf8]/20 text-[#818cf8] leading-none">主持人</span>}
                      </div>
                      <div className="text-[11px] text-[#6b6b85] truncate">{ex.occupation} · {ex.title}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-[11px]">
                    <span className="flex items-center gap-1">
                      <span className={`w-1.5 h-1.5 rounded-full ${
                        ex.status === 'speaking' ? 'bg-[#34d399] animate-pulse' :
                        ex.status === 'preparing' ? 'bg-[#fbbf24] animate-pulse' :
                        ex.status === 'done' ? 'bg-[#6b6b85]' :
                        'bg-[#6b6b85]'
                      }`} />
                      {ex.status === 'standby' ? '待命' :
                       ex.status === 'preparing' ? '准备中' :
                       ex.status === 'ready' ? '待发言' :
                       ex.status === 'speaking' ? '发言中' :
                       ex.status === 'done' ? '已发言' : ex.status}
                    </span>
                    {ex.focus_point && (
                      <span className="text-[#6b6b85] truncate">{ex.focus_point}</span>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Right: Transcript */}
        <div className="flex-1 flex flex-col min-w-0">
          <div className="px-5 py-3 border-b border-[#2e2e50] shrink-0">
            <h3 className="text-xs font-semibold text-[#a0a0b8] uppercase tracking-wider">📝 现场转录</h3>
          </div>
          <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3" id="transcript-scroll">
            {store.transcript.length === 0 ? (
              <div className="flex items-center justify-center h-full text-[#6b6b85] text-sm">讨论尚未开始...</div>
            ) : (
              store.transcript.map((entry, i) => {
                const expert = store.experts.find(e => e.id === entry.expert_id)
                const color = expert?.color_identity || '#818cf8'
                const isSummary = entry.entry_type === 'summary'
                return (
                  <div
                    key={i}
                    className={`rounded-xl px-4 py-3 border-l-[3px] ${
                      isSummary ? 'bg-[#222240]/60 border-t border-[#2e2e50]' : 'bg-[#222240]/40'
                    }`}
                    style={{ borderLeftColor: color }}
                  >
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <span className="text-xs font-semibold shrink-0" style={{ color }}>{entry.speaker_name}</span>
                      <span className="text-[10px] text-[#6b6b85] truncate max-w-[200px]">{entry.speaker_title}</span>
                      {isSummary && <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#818cf8]/20 text-[#818cf8] shrink-0">📋 总结</span>}
                    </div>
                    <div className="text-sm leading-6">{entry.content}</div>
                    <div className="text-[10px] text-[#6b6b85] mt-1.5">
                      {entry.created_at ? new Date(entry.created_at).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }) : ''}
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>
      </div>

      {/* ── Consensus & Divergence bar ── */}
      {(consensus.length > 0 || divergence.length > 0) && (
        <div className="flex gap-4 px-6 py-3 border-t border-[#2e2e50] bg-[#0f0f1a]/80 shrink-0">
          {consensus.length > 0 && (
            <div className="flex-1">
              <div className="text-xs font-semibold text-[#34d399] mb-1">✅ 共识</div>
              {consensus.map(c => (
                <div key={c.id} className="text-xs text-[#a0a0b8] leading-relaxed">• {c.content}</div>
              ))}
            </div>
          )}
          {divergence.length > 0 && (
            <div className="flex-1">
              <div className="text-xs font-semibold text-[#f87171] mb-1">⚠️ 分歧</div>
              {divergence.map(d => (
                <div key={d.id} className="text-xs text-[#a0a0b8] leading-relaxed">• {d.content}</div>
              ))}
            </div>
          )}
        </div>
      )}
    </>
  )
}
