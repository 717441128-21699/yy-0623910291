import { create } from 'zustand'
import type { Clue, Verification, FeedbackRecord, VerifyStatus } from '@/types'
import { communities, initialClues, initialVerifications, initialFeedbacks } from '@/data/mockData'

interface AppState {
  clues: Clue[]
  verifications: Verification[]
  feedbacks: FeedbackRecord[]
  selectedClueId: string | null
  activeVerifyClueId: string | null

  selectClue: (id: string | null) => void
  startVerify: (clueId: string) => void
  submitVerification: (data: {
    clueId: string
    photos: string[]
    voiceNoteUrl: string
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
  getVerificationByClueId: (clueId: string) => Verification | undefined
  getPendingFeedbacks: () => (Verification & { clue: Clue })[]
  getDoneFeedbacks: () => (FeedbackRecord & { clue: Clue; verification: Verification })[]
}

export const useStore = create<AppState>((set, get) => ({
  clues: initialClues,
  verifications: initialVerifications,
  feedbacks: initialFeedbacks,
  selectedClueId: null,
  activeVerifyClueId: null,

  selectClue: (id) => set({ selectedClueId: id }),

  startVerify: (clueId) => {
    set((state) => ({
      activeVerifyClueId: clueId,
      clues: state.clues.map((c) =>
        c.id === clueId ? { ...c, status: 'verifying' as const } : c
      ),
    }))
  },

  submitVerification: (data) => {
    const verification: Verification = {
      id: `v_${Date.now()}`,
      clueId: data.clueId,
      photos: data.photos,
      voiceNoteUrl: data.voiceNoteUrl,
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
    const verifyLabel = verification?.verifyStatus === 'confirmed' ? '属实' :
      verification?.verifyStatus === 'partial' ? '部分属实' : '待进一步了解'

    const categoryMap: Record<string, string> = {
      garbage: '垃圾清运',
      lighting: '楼道照明',
      noise: '噪声扰民',
      parking: '违停占道',
      water: '供水问题',
      other: '其他问题',
    }
    const categoryLabel = clue ? categoryMap[clue.category] || '相关问题' : '相关问题'
    const community = clue ? get().getCommunityById(clue.communityId)?.name : ''
    const resultText = data.transferDept
      ? `已转办至${data.transferDept}处理`
      : data.result

    const generatedNotice = `【社区回复】关于${community}${categoryLabel}问题的反馈：经现场核验，情况${verifyLabel}。${resultText}感谢居民朋友的关注与反馈，我们将持续跟进处理。`

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

  getCommunityById: (id) => communities.find((c) => c.id === id),
  getClueById: (id) => get().clues.find((c) => c.id === id),

  getVerificationByClueId: (clueId) =>
    get().verifications.find((v) => v.clueId === clueId),

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
}))
