export interface Discussion {
  id: string
  title: string
  topic: string
  expert_count: number
  status: 'pending' | 'preparing' | 'active' | 'paused' | 'completed'
  host_summary: string | null
  created_at: string
  updated_at: string
}

export interface Expert {
  id: string
  discussion_id: string
  role: 'host' | 'expert'
  name: string
  occupation: string
  title: string
  field: string
  persona_tags: string[]
  color_identity: string
  avatar_emoji: string
  status: 'standby' | 'preparing' | 'ready' | 'speaking' | 'done'
  focus_point: string
  public_thought: string
  speech_order: number
  created_at: string
}

export interface TranscriptEntry {
  id: number
  discussion_id: string
  expert_id: string
  speaker_name: string
  speaker_title: string
  content: string
  entry_type: 'speech' | 'system' | 'host_interject' | 'summary'
  sequence: number
  created_at: string
}

export interface ConsensusDivergence {
  id: number
  discussion_id: string
  category: 'consensus' | 'divergence'
  content: string
  source_expert_ids: string[]
  sequence: number
  created_at: string
}

export interface DiscussionDetail extends Discussion {
  experts: Expert[]
  transcript: TranscriptEntry[]
  consensus_divergence: ConsensusDivergence[]
}
