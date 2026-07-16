import type { Discussion, DiscussionDetail } from '../types'

const BASE = '/api'

async function req<T>(path: string, opts?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...opts,
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }))
    throw new Error(err.detail || `HTTP ${res.status}`)
  }
  return res.json()
}

export const api = {
  listDiscussions: () => req<Discussion[]>('/discussions'),
  getDiscussion: (id: string) => req<DiscussionDetail>(`/discussions/${id}`),
  createDiscussion: (topic: string, expertCount: number) =>
    req<Discussion>('/discussions', {
      method: 'POST',
      body: JSON.stringify({ topic, expert_count: expertCount }),
    }),
  startDiscussion: (id: string) => req<{ status: string }>(`/discussions/${id}/start`, { method: 'POST' }),
  pauseDiscussion: (id: string) => req<{ status: string }>(`/discussions/${id}/pause`, { method: 'POST' }),
  resumeDiscussion: (id: string) => req<{ status: string }>(`/discussions/${id}/resume`, { method: 'POST' }),
}
