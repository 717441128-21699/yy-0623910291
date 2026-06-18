import { create } from 'zustand'
import type {
  Clue,
  Verification,
  FeedbackRecord,
  VerifyStatus,
  ClueWithAlert,
  AlertType,
  FollowUpRecord,
  TaskItem,
  TaskGroup,
  TaskType,
  TransferProgress,
  UrgeRecord,
  UrgeMethod,
} from '@/types'
import { communities, initialClues, initialVerifications, initialFeedbacks } from '@/data/mockData'
import { saveToLocalStorage, loadFromLocalStorage, blobToBase64 } from '@/utils/storage'

const DEBOUNCE_MS = 500

let saveTimeout: ReturnType<typeof setTimeout> | null = null

function debouncedSave(data: {
  clues: Clue[]
  verifications: Verification[]
  feedbacks: FeedbackRecord[]
}) {
  if (saveTimeout) clearTimeout(saveTimeout)
  saveTimeout = setTimeout(() => {
    saveToLocalStorage(data)
  }, DEBOUNCE_MS)
}

function getDaysDiff(dateStr: string): number {
  const date = new Date(dateStr)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const diff = Math.ceil((date.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
  return diff
}

function getTaskGroup(daysRemaining: number): TaskGroup {
  if (daysRemaining < 0) return 'overdue'
  if (daysRemaining === 0) return 'today'
  if (daysRemaining === 1) return 'tomorrow'
  return 'future'
}

function getMissingActions(type: TaskType, feedback?: FeedbackRecord): string[] {
  const actions: string[] = []
  if (type === 'verify') {
    actions.push('现场核验')
  } else if (type === 'feedback') {
    actions.push('填写反馈')
  } else if (type === 'transfer_followup') {
    actions.push('回访确认结果')
    if (feedback && feedback.followUps.length === 0) {
      actions.push('补充回访记录')
    }
  }
  return actions
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

function generateFollowUpNotice(params: {
  originalText: string
  category: string
  communityName: string
  satisfaction: 'satisfied' | 'neutral' | 'dissatisfied' | null
  isRecurrence: boolean
  additionalNotes: string
  prevNotice: string
}): string {
  const { originalText, category, communityName, satisfaction, isRecurrence, additionalNotes, prevNotice } = params
  const categoryLabel = CATEGORY_MAP[category] || '相关问题'
  const shortText = originalText.length > 15 ? originalText.slice(0, 15) + '...' : originalText

  const satisfactionLabel = satisfaction === 'satisfied' ? '居民表示满意' :
    satisfaction === 'neutral' ? '居民反馈一般' :
    satisfaction === 'dissatisfied' ? '居民表示不满意' : ''

  const recurrenceLabel = isRecurrence ? '问题出现反复' : '问题未复发'

  let followUpContent = ''
  if (satisfactionLabel) followUpContent += satisfactionLabel
  if (satisfactionLabel && recurrenceLabel) followUpContent += '，'
  if (recurrenceLabel) followUpContent += recurrenceLabel
  if (additionalNotes) followUpContent += `（${additionalNotes}）`

  return `【社区回访】关于${communityName}${categoryLabel}问题的回访反馈：针对居民反映"${shortText}"，${followUpContent}。我们将持续关注居民诉求，如有其他问题欢迎随时反馈。\n\n此前反馈：${prevNotice}`
}

interface AppState {
  clues: Clue[]
  verifications: Verification[]
  feedbacks: FeedbackRecord[]
  selectedClueId: string | null
  activeVerifyClueId: string | null
  viewingVerificationId: string | null
  isLoaded: boolean

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
  addFollowUp: (data: {
    feedbackId: string
    clueId: string
    satisfaction: 'satisfied' | 'neutral' | 'dissatisfied' | null
    isRecurrence: boolean
    additionalPhotos: string[]
    additionalNotes: string
  }) => void
  addUrgeRecord: (data: {
    feedbackId: string
    clueId: string
    urgeContent: string
    urgeMethod: UrgeMethod
    handlerName: string
    responseContent: string
  }) => void
  getCommunityById: (id: string) => typeof communities[0] | undefined
  getClueById: (id: string) => Clue | undefined
  getVerificationById: (id: string) => Verification | undefined
  getVerificationByClueId: (clueId: string) => Verification | undefined
  getFeedbackByClueId: (clueId: string) => FeedbackRecord | undefined
  getPendingFeedbacks: () => (Verification & { clue: Clue })[]
  getDoneFeedbacks: () => (FeedbackRecord & { clue: Clue; verification: Verification })[]
  getCluesWithAlerts: () => (ClueWithAlert & {
    communityName: string
    alertTypes: AlertType[]
    alertLabel: string
    transferDept?: string
    transferSimilarCount?: number
  })[]
  getTasks: () => Record<TaskGroup, TaskItem[]>
  getTransferProgressList: (filters?: {
    dept?: string
    isOverdue?: boolean
    communityId?: string
  }) => TransferProgress[]
  generateNotice: typeof generateNotice
  generateFollowUpNotice: typeof generateFollowUpNotice
  generateUrgeNotice: (data: {
    communityName: string
    categoryLabel: string
    urgeContent: string
    urgeMethod: UrgeMethod
    handlerName: string
    responseContent: string
    prevNotice: string
  }) => string
}

function initializeState() {
  const stored = loadFromLocalStorage()
  if (stored) {
    return {
      clues: stored.clues,
      verifications: stored.verifications,
      feedbacks: stored.feedbacks.map((f) => ({
        ...f,
        followUps: f.followUps || [],
        urgeRecords: f.urgeRecords || [],
        handlerName: f.handlerName || '',
        expectedFinishAt: f.expectedFinishAt || '',
        transferSimilarCount: f.transferSimilarCount || 0,
      })),
      isLoaded: true,
    }
  }
  return {
    clues: initialClues,
    verifications: initialVerifications,
    feedbacks: initialFeedbacks.map((f) => ({
      ...f,
      followUps: f.followUps || [],
      urgeRecords: f.urgeRecords || [],
      handlerName: f.handlerName || '',
      expectedFinishAt: f.expectedFinishAt || '',
      transferSimilarCount: f.transferSimilarCount || 0,
    })),
    isLoaded: false,
  }
}

export const useStore = create<AppState>((set, get) => ({
  ...initializeState(),
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
    debouncedSave(get())
  },

  setViewingVerification: (id) => set({ viewingVerificationId: id }),

  submitVerification: async (data) => {
    let voiceBase64: string | null = null
    if (data.voiceBlob) {
      try {
        voiceBase64 = await blobToBase64(data.voiceBlob)
      } catch {
        voiceBase64 = null
      }
    }

    const verification: Verification = {
      id: `v_${Date.now()}`,
      clueId: data.clueId,
      photos: data.photos,
      voiceNoteUrl: data.voiceNoteUrl,
      voiceBlob: data.voiceBlob,
      voiceBase64,
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
    debouncedSave(get())
  },

  addFollowUp: (data) => {
    const clue = get().clues.find((c) => c.id === data.clueId)
    const feedback = get().feedbacks.find((f) => f.id === data.feedbackId)
    const community = clue ? get().getCommunityById(clue.communityId)?.name : ''

    if (!feedback) return

    const generatedFollowUpNotice = get().generateFollowUpNotice({
      originalText: clue?.originalText || '',
      category: clue?.category || 'other',
      communityName: community || '',
      satisfaction: data.satisfaction,
      isRecurrence: data.isRecurrence,
      additionalNotes: data.additionalNotes,
      prevNotice: feedback.generatedNotice,
    })

    const followUp: FollowUpRecord = {
      id: `fu_${Date.now()}`,
      feedbackId: data.feedbackId,
      satisfaction: data.satisfaction,
      isRecurrence: data.isRecurrence,
      additionalPhotos: data.additionalPhotos,
      additionalNotes: data.additionalNotes,
      generatedFollowUpNotice,
      createdAt: new Date().toISOString(),
    }

    set((state) => ({
      feedbacks: state.feedbacks.map((f) =>
        f.id === data.feedbackId
          ? { ...f, followUps: [...f.followUps, followUp] }
          : f
      ),
    }))
    debouncedSave(get())
  },

  addUrgeRecord: (data) => {
    const urge: UrgeRecord = {
      id: `urge_${Date.now()}`,
      feedbackId: data.feedbackId,
      clueId: data.clueId,
      urgeContent: data.urgeContent,
      urgeMethod: data.urgeMethod,
      handlerName: data.handlerName,
      responseContent: data.responseContent,
      createdAt: new Date().toISOString(),
    }

    set((state) => ({
      feedbacks: state.feedbacks.map((f) =>
        f.id === data.feedbackId
          ? {
              ...f,
              urgeRecords: [...f.urgeRecords, urge],
              handlerName: data.handlerName || f.handlerName,
            }
          : f
      ),
    }))
    debouncedSave(get())
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

    const expectedFinish = new Date()
    expectedFinish.setDate(expectedFinish.getDate() + 3)

    const feedback: FeedbackRecord = {
      id: `fb_${Date.now()}`,
      verificationId: data.verificationId,
      clueId: data.clueId,
      result: data.result,
      transferDept: data.transferDept,
      transferReason: data.transferReason,
      generatedNotice,
      createdAt: new Date().toISOString(),
      followUps: [],
      handlerName: '',
      expectedFinishAt: data.transferDept ? expectedFinish.toISOString() : '',
      transferSimilarCount: 0,
      urgeRecords: [],
    }
    set((state) => ({
      feedbacks: [...state.feedbacks, feedback],
      clues: state.clues.map((c) =>
        c.id === data.clueId ? { ...c, status: 'feedback_done' as const } : c
      ),
    }))
    debouncedSave(get())
  },

  generateNotice,
  generateFollowUpNotice,
  generateUrgeNotice: (data) => {
    const { communityName, categoryLabel, urgeContent, urgeMethod, handlerName, responseContent, prevNotice } = data
    const methodLabel = urgeMethod === 'phone' ? '电话' : urgeMethod === 'wechat' ? '微信' : urgeMethod === 'onsite' ? '现场' : '会议'
    return `【社区催办】关于${communityName}${categoryLabel}问题的催办反馈：${urgeContent}。已通过${methodLabel}联系${handlerName}，对方回复：${responseContent}。请居民朋友放心，我们将持续跟进。\n\n此前反馈：${prevNotice}`
  },

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
    const { clues, feedbacks } = get()

    const categoryCountByCommunity: Record<string, Record<string, number>> = {}
    clues.forEach((c) => {
      if (!categoryCountByCommunity[c.communityId]) {
        categoryCountByCommunity[c.communityId] = {}
      }
      categoryCountByCommunity[c.communityId][c.category] = (categoryCountByCommunity[c.communityId][c.category] || 0) + 1
    })

    return clues
      .map((c) => {
        const alertTypes: AlertType[] = []
        const community = get().getCommunityById(c.communityId)
        const feedback = feedbacks.find((f) => f.clueId === c.id)

        if (c.similarCount >= 10) {
          alertTypes.push('spike')
        }

        const categoryCount = categoryCountByCommunity[c.communityId]?.[c.category] || 0
        if (categoryCount >= 2) {
          alertTypes.push('cluster')
        }

        const daysSinceFirst = getDaysDiff(c.firstAppearedAt) * -1
        if (daysSinceFirst >= 3) {
          alertTypes.push('persistent')
        }

        if (c.isTransferFollowUp && c.similarCount >= 5) {
          alertTypes.push('transfer_spike')
        }

        if (feedback && feedback.transferDept && c.similarCount >= 5) {
          if (!alertTypes.includes('transfer_spike')) {
            alertTypes.push('transfer_spike')
          }
        }

        let alertLabel = ''
        if (alertTypes.includes('transfer_spike') || (alertTypes.includes('spike') && alertTypes.includes('persistent'))) {
          alertLabel = '重点关注'
        } else if (alertTypes.includes('spike')) {
          alertLabel = '投诉突增'
        } else if (alertTypes.includes('cluster')) {
          alertLabel = '同类聚集'
        } else if (alertTypes.includes('persistent')) {
          alertLabel = '持续多日'
        } else if (alertTypes.includes('transfer_spike')) {
          alertLabel = '转办后仍投诉'
        }

        const result: any = {
          ...c,
          communityName: community?.name || '',
          alertTypes,
          alertLabel,
        }

        if (feedback && feedback.transferDept) {
          result.transferDept = feedback.transferDept
          result.transferSimilarCount = feedback.transferSimilarCount
        }

        return result
      })
  },

  getTransferProgressList: (filters) => {
    const { clues, feedbacks, verifications } = get()

    return feedbacks
      .filter((f) => f.transferDept)
      .map((f) => {
        const clue = clues.find((c) => c.id === f.clueId)!
        const daysRemaining = getDaysDiff(f.expectedFinishAt)
        const isOverdue = daysRemaining < 0
        const latestFollowUp = f.followUps.length > 0 ? f.followUps[f.followUps.length - 1] : null

        const progress: TransferProgress = {
          feedbackId: f.id,
          clueId: f.clueId,
          handlerName: f.handlerName,
          currentProgress: latestFollowUp
            ? `已回访${f.followUps.length}次，${latestFollowUp.satisfaction === 'satisfied' ? '居民满意' : latestFollowUp.satisfaction === 'dissatisfied' ? '居民不满意' : '居民反馈一般'}`
            : f.urgeRecords.length > 0
            ? `已催办${f.urgeRecords.length}次`
            : '待催办',
          isOverdue,
          overdueDays: isOverdue ? -daysRemaining : 0,
          latestFollowUp,
          transferAt: f.createdAt || new Date().toISOString(),
          expectedFinishAt: f.expectedFinishAt,
          urgeRecords: f.urgeRecords,
        }

        return progress
      })
      .filter((p) => {
        if (!filters) return true
        if (filters.dept) {
          const feedback = feedbacks.find((f) => f.id === p.feedbackId)
          if (feedback?.transferDept !== filters.dept) return false
        }
        if (filters.isOverdue !== undefined && p.isOverdue !== filters.isOverdue) return false
        if (filters.communityId) {
          const clue = clues.find((c) => c.id === p.clueId)
          if (clue?.communityId !== filters.communityId) return false
        }
        return true
      })
  },

  getTasks: () => {
    const { clues, verifications, feedbacks } = get()
    const tasks: TaskItem[] = []

    clues.forEach((clue) => {
      const community = get().getCommunityById(clue.communityId)
      const verification = verifications.find((v) => v.clueId === clue.id)
      const feedback = feedbacks.find((f) => f.clueId === clue.id)

      let type: TaskType | null = null

      if (clue.status === 'pending' || clue.status === 'verifying') {
        type = 'verify'
      } else if (clue.status === 'verified' && !feedback) {
        type = 'feedback'
      } else if (clue.status === 'feedback_done' && feedback && feedback.transferDept) {
        type = 'transfer_followup'
      }

      if (type) {
        const daysRemaining = getDaysDiff(clue.expectedDeadline)
        const group = getTaskGroup(daysRemaining)
        tasks.push({
          id: `${type}_${clue.id}`,
          type,
          group,
          clue,
          verification,
          feedback,
          communityName: community?.name || '',
          daysRemaining,
          missingActions: getMissingActions(type, feedback),
        })
      }
    })

    const grouped: Record<TaskGroup, TaskItem[]> = {
      overdue: [],
      today: [],
      tomorrow: [],
      future: [],
    }

    tasks.forEach((t) => {
      grouped[t.group].push(t)
    })

    const sortByUrgency = (a: TaskItem, b: TaskItem) => {
      const typePriority = { verify: 0, feedback: 1, transfer_followup: 2 }
      const typeDiff = typePriority[a.type] - typePriority[b.type]
      if (typeDiff !== 0) return typeDiff
      return a.daysRemaining - b.daysRemaining
    }

    grouped.overdue.sort(sortByUrgency)
    grouped.today.sort(sortByUrgency)
    grouped.tomorrow.sort(sortByUrgency)
    grouped.future.sort(sortByUrgency)

    return grouped
  },
}))
