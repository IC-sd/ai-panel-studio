import { create } from 'zustand'
import type { Discussion, Expert, TranscriptEntry, ConsensusDivergence } from '../types'
import { api } from '../lib/api'

interface DiscussionState {
  // Discussion list
  discussions: Discussion[]
  loading: boolean
  loadDiscussions: () => Promise<void>

  // Current discussion detail
  currentId: string | null
  topic: string
  experts: Expert[]
  transcript: TranscriptEntry[]
  consensusDivergence: ConsensusDivergence[]
  status: string
  sseConnected: boolean

  // Actions
  openDiscussion: (id: string) => Promise<void>
  createDiscussion: (topic: string, expertCount: number) => Promise<Discussion>
  setStatus: (s: string) => void
  addTranscriptEntry: (e: TranscriptEntry) => void
  addConsensusDivergence: (c: ConsensusDivergence) => void
  updateExpertStatus: (expertId: string, status: string) => void
  startDiscussion: () => Promise<void>
  pauseDiscussion: () => Promise<void>
  resumeDiscussion: () => Promise<void>
  setSseConnected: (v: boolean) => void
}

export const useDiscussionStore = create<DiscussionState>((set, get) => ({
  discussions: [],
  loading: false,
  currentId: null,
  topic: '',
  experts: [],
  transcript: [],
  consensusDivergence: [],
  status: '',
  sseConnected: false,

  loadDiscussions: async () => {
    set({ loading: true })
    try {
      const discussions = await api.listDiscussions()
      set({ discussions, loading: false })
    } catch {
      set({ loading: false })
    }
  },

  openDiscussion: async (id: string) => {
    const data = await api.getDiscussion(id)
    set({
      currentId: data.id,
      topic: data.topic,
      experts: data.experts,
      transcript: data.transcript,
      consensusDivergence: data.consensus_divergence,
      status: data.status,
    })
  },

  createDiscussion: async (topic: string, expertCount: number) => {
    const disc = await api.createDiscussion(topic, expertCount)
    await get().loadDiscussions()
    return disc
  },

  setStatus: (s) => set({ status: s }),

  addTranscriptEntry: (e) =>
    set((s) => ({ transcript: [...s.transcript, e] })),

  addConsensusDivergence: (c) =>
    set((s) => ({ consensusDivergence: [...s.consensusDivergence, c] })),

  updateExpertStatus: (expertId, status) =>
    set((s) => ({
      experts: s.experts.map((e) =>
        e.id === expertId ? { ...e, status: status as Expert['status'] } : e
      ),
    })),

  startDiscussion: async () => {
    const id = get().currentId
    if (!id) return
    await api.startDiscussion(id)
    set({ status: 'active' })
  },

  pauseDiscussion: async () => {
    const id = get().currentId
    if (!id) return
    await api.pauseDiscussion(id)
    set({ status: 'paused' })
  },

  resumeDiscussion: async () => {
    const id = get().currentId
    if (!id) return
    await api.resumeDiscussion(id)
    set({ status: 'active' })
  },

  setSseConnected: (v) => set({ sseConnected: v }),
}))
