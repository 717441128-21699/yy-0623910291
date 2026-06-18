import { create } from 'zustand'
import type { Clue, Verification, FeedbackRecord, VerifyStatus, ClueWithAlert, AlertType } from '@/types'
import { communities, initialClues, initialVerifications, initialFeedbacks } from '@/data/mockData'

interface AppState {
  clues: Clue[]
  verifications: Verification[]
  feedbacks: FeedbackRecord[]
  selectedClueId: string | null
  activeVerifyClueId: string | null
  viewingVerificationId: string | null

  selectClue: (id: string | null) => void
  startVerify: (clueId: string) => void
  setViewingVerification: (id: string | null) => void
  submitVerification: (data: {
    clueId: string
    photos: string[]
    voiceNoteUrl: string
    voiceBlob: Blob | null
    voiceDuration: number
    location: string
    verifyStatus: VerifyStatus
  }) => void
  submitFeedback: (data: {
    verificationId: string
    clueId: string
    result: string
    transferDept: string
    transferReason: string
  }) => void
  getCommunityById: (id: string) => typeof communities[0] | undefined
  getClueById: (id: string) => Clue | undefined
  getVerificationById: (id: string) => Verification | undefined
  getVerificationByClueId: (clueId: string) => Verification | undefined
  getFeedbackByClueId: (clueId: string) => FeedbackRecord | undefined
  getPendingFeedbacks: () => (Verification & { clue: Clue })[]
  getDoneFeedbacks: () => (FeedbackRecord & { clue: Clue; verification: Verification })[]
  getCluesWithAlerts: () => (ClueWithAlert & { communityName: string; alertTypes: AlertType[]; alertLabel: string })[]
  generateNotice: (params: {
    originalText: string
    category: string
    communityName: string
    verifyStatus: VerifyStatus | null
    result: string
    transferDept: string
    transferReason: string
  }) => string
}

const CATEGORY_MAP: Record<string, string> = {
  garbage: '垃圾清运',
  lighting: '楼道照明',
  noise: '噪声扰民',
  parking: '违停占道',
  water: '供水问题',
  other: '其他问题',
}

function generateNotice(params: {
  originalText: string
  category: string
  communityName: string
  verifyStatus: VerifyStatus | null
  result: string
  transferDept: string
  transferReason: string
}): string {
  const { originalText, category, communityName, verifyStatus, result, transferDept, transferReason } = params
  const verifyLabel = verifyStatus === 'confirmed' ? '属实' :
    verifyStatus === 'partial' ? '部分属实' : '待进一步了解'
  const categoryLabel = CATEGORY_MAP[category] || '相关问题'
  const shortText = originalText.length > 15 ? originalText.slice(0, 15) + '...' : originalText

  let action = ''
  if (transferDept) {
    action = `已转办至${transferDept}处理`
    if (transferReason) {
      action += `（${transferReason}）`
    }
    if (result) {
      action += `，${result}`
    }
  } else if (result) {
    action = result
  } else {
    action = '我们正在跟进处理'
  }

  return `【社区回复】关于${communityName}${categoryLabel}问题的反馈：针对居民反映"${shortText}"，经现场核验，情况${verifyLabel}。${action}。感谢居民朋友的关注与反馈，我们将持续跟进。`
}

export const useStore = create<AppState>((set, get) => ({
  clues: initialClues,
  verifications: initialVerifications,
  feedbacks: initialFeedbacks,
  selectedClueId: null,
  activeVerifyClueId: null,
  viewingVerificationId: null,

  selectClue: (id) => set({ selectedClueId: id }),

  startVerify: (clueId) => {
    set((state) => ({
      activeVerifyClueId: clueId,
      clues: state.clues.map((c) =>
        c.id === clueId ? { ...c, status: 'verifying' as const } : c
      ),
    }))
  },

  setViewingVerification: (id) => set({ viewingVerificationId: id }),

  submitVerification: (data) => {
    const verification: Verification = {
      id: `v_${Date.now()}`,
      clueId: data.clueId,
      photos: data.photos,
      voiceNoteUrl: data.voiceNoteUrl,
      voiceBlob: data.voiceBlob,
      voiceDuration: data.voiceDuration,
      location: data.location,
      verifyStatus: data.verifyStatus,
      verifiedAt: new Date().toISOString(),
    }
    set((state) => ({
      verifications: [...state.verifications, verification],
      clues: state.clues.map((c) =>
        c.id === data.clueId ? { ...c, status: 'verified' as const } : c
      ),
      activeVerifyClueId: null,
    }))
  },

  submitFeedback: (data) => {
    const clue = get().clues.find((c) => c.id === data.clueId)
    const verification = get().verifications.find((v) => v.id === data.verificationId)
    const community = clue ? get().getCommunityById(clue.communityId)?.name : ''

    const generatedNotice = get().generateNotice({
      originalText: clue?.originalText || '',
      category: clue?.category || 'other',
      communityName: community || '',
      verifyStatus: verification?.verifyStatus || null,
      result: data.result,
      transferDept: data.transferDept,
      transferReason: data.transferReason,
    })

    const feedback: FeedbackRecord = {
      id: `fb_${Date.now()}`,
      verificationId: data.verificationId,
      clueId: data.clueId,
      result: data.result,
      transferDept: data.transferDept,
      transferReason: data.transferReason,
      generatedNotice,
      createdAt: new Date().toISOString(),
    }
    set((state) => ({
      feedbacks: [...state.feedbacks, feedback],
      clues: state.clues.map((c) =>
        c.id === data.clueId ? { ...c, status: 'feedback_done' as const } : c
      ),
    }))
  },

  generateNotice,

  getCommunityById: (id) => communities.find((c) => c.id === id),
  getClueById: (id) => get().clues.find((c) => c.id === id),
  getVerificationById: (id) => get().verifications.find((v) => v.id === id),

  getVerificationByClueId: (clueId) =>
    get().verifications.find((v) => v.clueId === clueId),

  getFeedbackByClueId: (clueId) =>
    get().feedbacks.find((f) => f.clueId === clueId),

  getPendingFeedbacks: () => {
    const { verifications, clues } = get()
    return verifications
      .filter((v) => !get().feedbacks.some((f) => f.verificationId === v.id))
      .map((v) => {
        const clue = clues.find((c) => c.id === v.clueId)!
        return { ...v, clue }
      })
      .filter((v) => v.clue !== undefined)
  },

  getDoneFeedbacks: () => {
    const { feedbacks, clues, verifications } = get()
    return feedbacks
      .map((f) => {
        const clue = clues.find((c) => c.id === f.clueId)!
        const verification = verifications.find((v) => v.id === f.verificationId)!
        return { ...f, clue, verification }
      })
      .filter((f) => f.clue && f.verification)
  },

  getCluesWithAlerts: () => {
    const { clues } = get()

    const categoryCountByCommunity: Record<string, Record<string, number>> = {}
    clues.forEach((c) => {
      if (!categoryCountByCommunity[c.communityId]) {
        categoryCountByCommunity[c.communityId] = {}
      }
      categoryCountByCommunity[c.communityId][c.category] = (categoryCountByCommunity[c.communityId][c.category] || 0) + 1
    })

    return clues
      .filter((c) => c.status !== 'feedback_done')
      .map((c) => {
        const alertTypes: AlertType[] = []
        const community = get().getCommunityById(c.communityId)

        if (c.similarCount >= 10) {
          alertTypes.push('spike')
        }

        const categoryCount = categoryCountByCommunity[c.communityId]?.[c.category] || 0
        if (categoryCount >= 2) {
          alertTypes.push('cluster')
        }

        let alertLabel = ''
        if (alertTypes.includes('spike') && alertTypes.includes('cluster')) {
          alertLabel = '重点关注'
        } else if (alertTypes.includes('spike')) {
          alertLabel = '投诉突增'
        } else if (alertTypes.includes('cluster')) {
          alertLabel = '同类聚集'
        }

        return {
          ...c,
          communityName: community?.name || '',
          alertTypes,
          alertLabel,
        }
      })
  },
}))
