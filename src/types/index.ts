export interface Community {
  id: string
  name: string
  district: string
}

export type ClueCategory = 'garbage' | 'lighting' | 'noise' | 'parking' | 'water' | 'other'
export type ClueSource = 'wechat' | 'bulletin' | 'video'
export type ClueStatus = 'pending' | 'verifying' | 'verified' | 'feedback_done'
export type VerifyStatus = 'confirmed' | 'partial' | 'pending_further'

export interface Clue {
  id: string
  communityId: string
  category: ClueCategory
  originalText: string
  similarTexts: string[]
  source: ClueSource
  similarCount: number
  firstAppearedAt: string
  lastAppearedAt: string
  status: ClueStatus
  expectedDeadline: string
  isTransferFollowUp?: boolean
}

export interface Verification {
  id: string
  clueId: string
  photos: string[]
  voiceNoteUrl: string
  voiceBlob: Blob | null
  voiceBase64: string | null
  voiceDuration: number
  location: string
  verifyStatus: VerifyStatus | null
  verifiedAt: string | null
}

export type AlertType = 'spike' | 'cluster' | 'persistent' | 'transfer_spike'

export interface ClueWithAlert extends Clue {
  alertTypes?: AlertType[]
}

export interface FeedbackRecord {
  id: string
  verificationId: string
  clueId: string
  result: string
  transferDept: string
  transferReason: string
  generatedNotice: string
  createdAt: string | null
  followUps: FollowUpRecord[]
}

export interface FollowUpRecord {
  id: string
  feedbackId: string
  satisfaction: 'satisfied' | 'neutral' | 'dissatisfied' | null
  isRecurrence: boolean
  additionalPhotos: string[]
  additionalNotes: string
  generatedFollowUpNotice: string
  createdAt: string
}

export type TaskGroup = 'today' | 'tomorrow' | 'overdue' | 'future'
export type TaskType = 'verify' | 'feedback' | 'transfer_followup'

export interface TaskItem {
  id: string
  type: TaskType
  group: TaskGroup
  clue: Clue
  verification?: Verification
  feedback?: FeedbackRecord
  communityName: string
  daysRemaining: number
  missingActions: string[]
}

export const CATEGORY_LABELS: Record<ClueCategory, string> = {
  garbage: '垃圾清运',
  lighting: '楼道照明',
  noise: '噪声扰民',
  parking: '违停占道',
  water: '供水问题',
  other: '其他',
}

export const SOURCE_LABELS: Record<ClueSource, string> = {
  wechat: '微信群',
  bulletin: '公告评论',
  video: '短视频',
}

export const VERIFY_STATUS_LABELS: Record<VerifyStatus, string> = {
  confirmed: '属实',
  partial: '部分属实',
  pending_further: '待进一步了解',
}

export const SATISFACTION_LABELS: Record<Exclude<FollowUpRecord['satisfaction'], null>, string> = {
  satisfied: '满意',
  neutral: '一般',
  dissatisfied: '不满意',
}

export const TASK_TYPE_LABELS: Record<TaskType, string> = {
  verify: '待核验',
  feedback: '待反馈',
  transfer_followup: '待回访',
}

export const TASK_GROUP_LABELS: Record<TaskGroup, { label: string; color: string; bg: string }> = {
  overdue: { label: '已逾期', color: 'text-red-600', bg: 'bg-red-50' },
  today: { label: '今天', color: 'text-orange-600', bg: 'bg-orange-50' },
  tomorrow: { label: '明天', color: 'text-amber-600', bg: 'bg-amber-50' },
  future: { label: '稍后', color: 'text-slate-500', bg: 'bg-slate-50' },
}
