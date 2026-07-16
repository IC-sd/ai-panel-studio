import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useDiscussionStore } from '../store/discussion'
import type { Discussion } from '../types'

const statusLabels: Record<string, string> = {
  pending: '待开始', preparing: '准备中', active: '进行中',
  paused: '已暂停', completed: '已完成',
}
const statusColors: Record<string, string> = {
  pending: 'bg-[#818cf8]/15 text-[#818cf8]',
  preparing: 'bg-[#fbbf24]/15 text-[#fbbf24]',
  active: 'bg-[#34d399]/15 text-[#34d399]',
  paused: 'bg-[#f87171]/15 text-[#f87171]',
  completed: 'bg-[#a0a0b8]/15 text-[#a0a0b8]',
}

function fmtTime(iso: string) {
  const d = new Date(iso)
  return `${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')} ${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`
}

export function HomePage() {
  const { discussions, loading, loadDiscussions, createDiscussion } = useDiscussionStore()
  const nav = useNavigate()
  const [showDialog, setShowDialog] = useState(false)
  const [topic, setTopic] = useState('')
  const [count, setCount] = useState(4)
  const [creating, setCreating] = useState(false)

  useEffect(() => { loadDiscussions() }, [])

  const handleCreate = async () => {
    if (!topic.trim()) return
    setCreating(true)
    try {
      const d = await createDiscussion(topic.trim(), count)
      setShowDialog(false)
      setTopic('')
      nav(`/studio/${d.id}`)
    } catch (e: any) {
      alert(e.message)
    } finally {
      setCreating(false)
    }
  }

  return (
    <>
      <div className="flex items-center justify-between px-6 py-4 border-b border-[#2e2e50] shrink-0">
        <h2 className="text-xl font-semibold">📋 讨论列表</h2>
        <button
          onClick={() => setShowDialog(true)}
          className="px-4 py-2 rounded-lg bg-[#818cf8] text-white text-sm font-medium hover:bg-[#6366f1] transition-colors cursor-pointer"
        >
          + 新建讨论
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        {loading ? (
          <div className="text-center text-[#6b6b85] py-10">加载中...</div>
        ) : discussions.length === 0 ? (
          <div className="text-center text-[#6b6b85] py-16">
            <div className="text-5xl mb-4">🎙️</div>
            <p className="text-lg mb-2">还没有讨论</p>
            <p className="text-sm">点击上方「新建讨论」开始一场AI圆桌对话</p>
          </div>
        ) : (
          <div className="grid grid-cols-[repeat(auto-fill,minmax(300px,1fr))] gap-4">
            {discussions.map((d) => (
              <div
                key={d.id}
                onClick={() => nav(`/studio/${d.id}`)}
                className="bg-[#222240] border border-[#2e2e50] rounded-xl p-5 cursor-pointer hover:border-[#818cf8] hover:-translate-y-0.5 transition-all"
              >
                <div className="font-semibold mb-2 line-clamp-2">{d.topic}</div>
                <div className="flex items-center gap-3 text-sm text-[#a0a0b8] mb-3">
                  <span>👥 {d.expert_count} 位专家</span>
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColors[d.status]}`}>
                    {statusLabels[d.status]}
                  </span>
                </div>
                <div className="flex justify-between text-xs text-[#6b6b85]">
                  <span>🕐 {fmtTime(d.created_at)}</span>
                  {d.host_summary && <span>✅ 已总结</span>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Dialog */}
      {showDialog && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50" onClick={() => setShowDialog(false)}>
          <div className="bg-[#1a1a2e] border border-[#2e2e50] rounded-xl p-7 w-[460px] max-w-[90vw]" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold mb-5">🚀 新建圆桌讨论</h3>
            <div className="mb-4">
              <label className="block text-sm text-[#a0a0b8] mb-1.5">讨论议题</label>
              <textarea
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                rows={3}
                className="w-full px-3 py-2.5 rounded-lg border border-[#2e2e50] bg-[#16162e] text-white text-sm resize-y focus:outline-none focus:border-[#818cf8]"
                placeholder="例如：AI 是否会在未来十年取代大部分人类工作？"
              />
            </div>
            <div className="mb-5">
              <label className="block text-sm text-[#a0a0b8] mb-1.5">专家人数</label>
              <div className="inline-flex items-center gap-4 px-4 py-2 rounded-lg border border-[#2e2e50] bg-[#16162e]">
                <button
                  onClick={() => setCount(Math.max(2, count - 1))}
                  className="w-8 h-8 rounded-full border border-[#2e2e50] bg-[#222240] flex items-center justify-center hover:bg-[#818cf8] hover:border-[#818cf8] transition-colors cursor-pointer"
                >
                  −
                </button>
                <span className="text-lg font-semibold w-8 text-center">{count}</span>
                <button
                  onClick={() => setCount(Math.min(8, count + 1))}
                  className="w-8 h-8 rounded-full border border-[#2e2e50] bg-[#222240] flex items-center justify-center hover:bg-[#818cf8] hover:border-[#818cf8] transition-colors cursor-pointer"
                >
                  +
                </button>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowDialog(false)}
                className="px-4 py-2 rounded-lg border border-[#2e2e50] text-sm text-[#a0a0b8] hover:bg-[#2a2a4a] transition-colors cursor-pointer"
              >
                取消
              </button>
              <button
                onClick={handleCreate}
                disabled={creating || !topic.trim()}
                className="px-4 py-2 rounded-lg bg-[#818cf8] text-white text-sm font-medium hover:bg-[#6366f1] disabled:opacity-50 transition-colors cursor-pointer"
              >
                {creating ? '⏳ 生成中...' : '✨ 生成专家阵容'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
