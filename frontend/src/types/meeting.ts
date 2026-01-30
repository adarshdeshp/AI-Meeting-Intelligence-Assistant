export type MeetingStatus =
  | 'UPLOADED'
  | 'PROCESSING'
  | 'TRANSCRIBED'
  | 'SUMMARIZED'
  | 'TASKS_EXTRACTED'
  | 'SENTIMENT_ANALYZED'
  | 'READY'
  | 'FAILED'
  | 'ERROR'

export interface TranscriptSegment {
  start: number
  end: number
  text: string
  speaker?: string
}

export interface Transcript {
  language?: string
  full_text?: string
  segments?: TranscriptSegment[]
}

export interface Summary {
  short_bullets?: string[]
  detailed?: string
  topics?: string[]
  decisions?: string[]
}

export interface Task {
  assignee?: string
  task?: string
  deadline?: string | null
  confidence?: number
}

export interface SentimentSegment {
  text: string
  label: string
  score: number
}

export interface Sentiment {
  overall_label?: string
  overall_score?: number
  segments?: SentimentSegment[]
  by_speaker?: Array<{
    speaker: string
    label: string
    score: number
  }>
  tone_features?: Record<string, {
    avg_pitch?: number
    avg_energy?: number
  }>
}

export interface FileInfo {
  original_filename?: string
  local_path?: string
  size_bytes?: number
  ext?: string
}

export interface Meeting {
  _id?: string
  id?: string
  meeting_id?: string
  title?: string
  created_at?: string
  updated_at?: string
  status: MeetingStatus
  progress?: number
  file?: FileInfo
  transcript?: Transcript | null
  summary?: Summary | null
  tasks?: Task[]
  sentiment?: Sentiment | null
  vector_index?: {
    provider?: string
    collection?: string
  } | null
  error?: {
    stage?: string
    message?: string
    trace_id?: string
    timestamp?: string
  } | null
  trace_id?: string
}

export interface MeetingStatusResponse {
  meeting_id: string
  status: MeetingStatus
  progress?: number
  updated_at?: string
  trace_id?: string
  error?: string | {
    stage?: string
    message?: string
    trace_id?: string
    timestamp?: string
  }
}

export interface AskQuestionResponse {
  answer: string
  sources?: Array<{
    start?: number
    end?: number
    text: string
  }>
}
