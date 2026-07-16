import type { TranscriptEntry, ConsensusDivergence } from '../types'
import { useDiscussionStore } from '../store/discussion'

export function connectSSE(discussionId: string) {
  const store = useDiscussionStore.getState()
  const es = new EventSource(`/api/stream/${discussionId}`)

  es.addEventListener('discussion_status', (e) => {
    const d = JSON.parse(e.data)
    store.setStatus(d.status)
  })

  es.addEventListener('expert_status', (e) => {
    const d = JSON.parse(e.data)
    store.updateExpertStatus(d.expert_id, d.status)
  })

  es.addEventListener('transcript', (e) => {
    const d: TranscriptEntry = JSON.parse(e.data)
    store.addTranscriptEntry(d)
  })

  es.addEventListener('consensus_divergence', (e) => {
    const d: ConsensusDivergence = JSON.parse(e.data)
    store.addConsensusDivergence(d)
  })

  es.addEventListener('error', (e) => {
    const d = JSON.parse(e.data)
    console.error('SSE error:', d.message)
  })

  es.onopen = () => store.setSseConnected(true)
  es.onerror = () => store.setSseConnected(false)

  return () => {
    es.close()
    store.setSseConnected(false)
  }
}
