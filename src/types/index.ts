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
  lastAppearedAt: string
  status: ClueStatus
}

export interface Verification {
  id: string
  clueId: string
  photos: string[]
  voiceNoteUrl: string
  voiceBlob: Blob | null
  voiceDuration: number
  location: string
  verifyStatus: VerifyStatus | null
  verifiedAt: string | null
}

export type AlertType = 'spike' | 'cluster'

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
