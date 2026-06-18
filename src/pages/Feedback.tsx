import { useState, useCallback, useMemo } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { ClipboardCopy, ChevronRight, FileText, Send, Filter, Eye, Edit3 } from 'lucide-react'
import type { ClueCategory } from '@/types'
import { CATEGORY_LABELS, VERIFY_STATUS_LABELS } from '@/types'
import { useStore } from '@/store/useStore'
import { communities } from '@/data/mockData'
import CategoryIcon from '@/components/CategoryIcon'
import VerificationDetail from '@/components/VerificationDetail'

const TRANSFER_DEPTS = [
  '环卫中心',
  '物业服务中心',
  '城管执法中队',
  '住建站',
  '供电所',
  '自来水公司',
  '环保所',
  '派出所',
]

type StatusFilter = 'all' | 'pending_verify' | 'verified' | 'pending_feedback' | 'done'

export default function Feedback() {
  const navigate = useNavigate()
  const locationState = useLocation().state as { clueId?: string } | null
  const clueIdFromNav = locationState?.clueId

  const getClueById = useStore((s) => s.getClueById)
  const getCommunityById = useStore((s) => s.getCommunityById)
  const getVerificationByClueId = useStore((s) => s.getVerificationByClueId)
  const getFeedbackByClueId = useStore((s) => s.getFeedbackByClueId)
  const submitFeedback = useStore((s) => s.submitFeedback)
  const generateNotice = useStore((s) => s.generateNotice)
  const clues = useStore((s) => s.clues)

  const [communityFilter, setCommunityFilter] = useState<string>('all')
  const [categoryFilter, setCategoryFilter] = useState<ClueCategory | 'all'>('all')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [showFilters, setShowFilters] = useState(false)

  const [activeClueId, setActiveClueId] = useState<string | null>(clueIdFromNav || null)
  const [result, setResult] = useState('')
  const [transferDept, setTransferDept] = useState('')
  const [transferReason, setTransferReason] = useState('')
  const [showDeptPicker, setShowDeptPicker] = useState(false)
  const [viewingClueId, setViewingClueId] = useState<string | null>(null)

  const allRecords = useMemo(() => {
    return clues.map((clue) => {
      const verification = getVerificationByClueId(clue.id)
      const feedback = getFeedbackByClueId(clue.id)
      const community = getCommunityById(clue.communityId)
      let displayStatus: string
      if (feedback) displayStatus = '已闭环'
      else if (verification) displayStatus = '待反馈'
      else if (clue.status === 'verifying') displayStatus = '核验中'
      else displayStatus = '待核验'

      return { clue, verification, feedback, community, displayStatus }
    })
  }, [clues, getVerificationByClueId, getFeedbackByClueId, getCommunityById])

  const filteredRecords = useMemo(() => {
    return allRecords.filter((r) => {
      if (communityFilter !== 'all' && r.clue.communityId !== communityFilter) return false
      if (categoryFilter !== 'all' && r.clue.category !== categoryFilter) return false
      if (statusFilter !== 'all') {
        if (statusFilter === 'pending_verify' && r.displayStatus !== '待核验') return false
        if (statusFilter === 'verified' && r.displayStatus !== '待反馈' && r.displayStatus !== '已闭环') return false
        if (statusFilter === 'pending_feedback' && r.displayStatus !== '待反馈') return false
        if (statusFilter === 'done' && r.displayStatus !== '已闭环') return false
      }
      return true
    })
  }, [allRecords, communityFilter, categoryFilter, statusFilter])

  const activeClue = activeClueId ? getClueById(activeClueId) : null
  const activeVerification = activeClueId ? getVerificationByClueId(activeClueId) : null
  const activeCommunity = activeClue ? getCommunityById(activeClue.communityId) : undefined

  const viewingClue = viewingClueId ? getClueById(viewingClueId) : null
  const viewingVerification = viewingClueId ? getVerificationByClueId(viewingClueId) : null
  const viewingFeedback = viewingClueId ? getFeedbackByClueId(viewingClueId) : null

  const previewNotice = useMemo(() => {
    if (!activeClue || !activeVerification) return ''
    return generateNotice({
      originalText: activeClue.originalText,
      category: activeClue.category,
      communityName: activeCommunity?.name || '',
      verifyStatus: activeVerification.verifyStatus,
      result,
      transferDept,
      transferReason,
    })
  }, [activeClue, activeVerification, activeCommunity, result, transferDept, transferReason, generateNotice])

  const canSubmit = (result.trim() || (transferDept && transferReason.trim())) && activeVerification

  const handleSubmit = useCallback(() => {
    if (!activeVerification || !activeClueId || !canSubmit) return
    submitFeedback({
      verificationId: activeVerification.id,
      clueId: activeClueId,
      result,
      transferDept,
      transferReason,
    })
    setActiveClueId(null)
    setResult('')
    setTransferDept('')
    setTransferReason('')
  }, [activeVerification, activeClueId, result, transferDept, transferReason, submitFeedback, canSubmit])

  const handleSelectForFeedback = useCallback((clueId: string) => {
    const verification = getVerificationByClueId(clueId)
    if (!verification) return
    setActiveClueId(clueId)
    setResult('')
    setTransferDept('')
    setTransferReason('')
  }, [getVerificationByClueId])

  const handleViewDetail = useCallback((clueId: string) => {
    setViewingClueId(clueId)
  }, [])

  if (activeClue && activeVerification) {
    return (
      <div className="min-h-screen bg-slate-50 pb-32">
        <header className="bg-teal-700 text-white px-5 pt-12 pb-5 rounded-b-3xl">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold">填写反馈</h1>
              <p className="text-teal-200 text-xs mt-0.5">
                {activeCommunity?.name} · {VERIFY_STATUS_LABELS[activeVerification.verifyStatus!]}
              </p>
            </div>
            <button
              onClick={() => setActiveClueId(null)}
              className="text-teal-200 text-xs flex items-center gap-1"
            >
              返回列表
            </button>
          </div>
        </header>

        <div className="px-4 py-4 space-y-5">
          <button
            onClick={() => handleViewDetail(activeClue.id)}
            className="w-full bg-amber-50 border border-amber-100 rounded-xl p-4 text-left flex items-center gap-3 active:bg-amber-100/50 transition-colors"
          >
            <CategoryIcon category={activeClue.category} size="sm" />
            <div className="flex-1 min-w-0">
              <p className="text-sm text-slate-700 line-clamp-2">{activeClue.originalText}</p>
              <div className="flex items-center gap-2 mt-1.5">
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                  activeVerification.verifyStatus === 'confirmed'
                    ? 'bg-emerald-100 text-emerald-700'
                    : activeVerification.verifyStatus === 'partial'
                    ? 'bg-amber-100 text-amber-700'
                    : 'bg-slate-100 text-slate-600'
                }`}>
                  {VERIFY_STATUS_LABELS[activeVerification.verifyStatus!]}
                </span>
                <span className="text-[10px] text-slate-400">
                  {new Date(activeVerification.verifiedAt!).toLocaleString('zh-CN', {
                    month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit',
                  })}
                </span>
              </div>
            </div>
            <Eye size={16} className="text-teal-500" />
          </button>

          <section>
            <h3 className="text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">
              <FileText size={16} className="text-teal-600" />
              处置结果
              <span className="text-xs text-slate-400 font-normal">（转办时可选）</span>
            </h3>
            <textarea
              value={result}
              onChange={(e) => setResult(e.target.value)}
              placeholder="请填写现场处置结果，如已联系物业维修、已安排清运等..."
              rows={3}
              className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-700 placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-400 resize-none"
            />
          </section>

          <section>
            <h3 className="text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">
              <Send size={16} className="text-teal-600" />
              转办信息
              <span className="text-xs text-slate-400 font-normal">（转办需填部门+原因）</span>
            </h3>
            <button
              onClick={() => setShowDeptPicker(!showDeptPicker)}
              className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm text-left flex items-center justify-between"
            >
              <span className={transferDept ? 'text-slate-700' : 'text-slate-300'}>
                {transferDept || '选择转办部门'}
              </span>
              <ChevronRight size={16} className="text-slate-400" />
            </button>

            {showDeptPicker && (
              <div className="mt-2 bg-white border border-slate-200 rounded-xl overflow-hidden animate-fade-in">
                {TRANSFER_DEPTS.map((dept) => (
                  <button
                    key={dept}
                    onClick={() => {
                      setTransferDept(dept)
                      setShowDeptPicker(false)
                    }}
                    className={`w-full px-4 py-2.5 text-sm text-left border-b border-slate-50 last:border-0 transition-colors ${
                      transferDept === dept ? 'bg-teal-50 text-teal-700' : 'text-slate-600'
                    }`}
                  >
                    {dept}
                  </button>
                ))}
              </div>
            )}

            {transferDept && (
              <textarea
                value={transferReason}
                onChange={(e) => setTransferReason(e.target.value)}
                placeholder="* 请填写转办原因（必填）..."
                rows={2}
                className="w-full mt-2 bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-700 placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-400 resize-none"
              />
            )}
          </section>

          {(result || transferDept) && (
            <section className="animate-fade-in">
              <h3 className="text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">
                <ClipboardCopy size={16} className="text-teal-600" />
                社区群说明预览
              </h3>
              <div className="bg-teal-50 border border-teal-200 rounded-xl p-4">
                <p className="text-sm text-teal-800 leading-relaxed">{previewNotice}</p>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(previewNotice).catch(() => {})
                  }}
                  className="mt-3 flex items-center gap-1.5 text-xs text-teal-600 font-medium"
                >
                  <ClipboardCopy size={14} />
                  一键复制
                </button>
              </div>
            </section>
          )}
        </div>

        <div className="fixed bottom-16 left-0 right-0 px-4 py-3 bg-white/80 backdrop-blur-lg border-t border-slate-100">
          <button
            onClick={handleSubmit}
            disabled={!canSubmit}
            className={`w-full rounded-xl py-3.5 text-sm font-medium transition-all ${
              canSubmit
                ? 'bg-teal-600 text-white active:bg-teal-700 shadow-lg shadow-teal-600/20'
                : 'bg-slate-100 text-slate-400'
            }`}
          >
            提交反馈
          </button>
        </div>

        {viewingClue && viewingVerification && (
          <VerificationDetail
            verification={{ ...viewingVerification, clue: viewingClue }}
            feedback={viewingFeedback || undefined}
            onClose={() => setViewingClueId(null)}
          />
        )}
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-24">
      <header className="bg-teal-700 text-white px-5 pt-12 pb-5 rounded-b-3xl">
        <div className="flex items-center justify-between mb-1">
          <div>
            <h1 className="text-xl font-bold">反馈记录台账</h1>
            <p className="text-teal-200 text-xs mt-0.5">
              共 {allRecords.length} 条 · 待反馈 {allRecords.filter(r => r.displayStatus === '待反馈').length} 条
            </p>
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`w-9 h-9 rounded-lg flex items-center justify-center transition-colors ${
              showFilters ? 'bg-teal-500' : 'bg-teal-600/60'
            }`}
          >
            <Filter size={16} />
          </button>
        </div>

        {showFilters && (
          <div className="mt-3 space-y-3 animate-fade-in">
            <div>
              <span className="text-xs text-teal-200 mb-1.5 block">小区</span>
              <div className="flex flex-wrap gap-1.5">
                <button
                  onClick={() => setCommunityFilter('all')}
                  className={`text-xs px-2.5 py-1 rounded-full transition-colors ${
                    communityFilter === 'all' ? 'bg-white text-teal-700' : 'bg-teal-500/40 text-teal-100'
                  }`}
                >
                  全部
                </button>
                {communities.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => setCommunityFilter(c.id)}
                    className={`text-xs px-2.5 py-1 rounded-full transition-colors ${
                      communityFilter === c.id ? 'bg-white text-teal-700' : 'bg-teal-500/40 text-teal-100'
                    }`}
                  >
                    {c.name}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <span className="text-xs text-teal-200 mb-1.5 block">诉求类别</span>
              <div className="flex flex-wrap gap-1.5">
                <button
                  onClick={() => setCategoryFilter('all')}
                  className={`text-xs px-2.5 py-1 rounded-full transition-colors ${
                    categoryFilter === 'all' ? 'bg-white text-teal-700' : 'bg-teal-500/40 text-teal-100'
                  }`}
                >
                  全部
                </button>
                {(Object.entries(CATEGORY_LABELS) as [ClueCategory, string][]).map(([key, label]) => (
                  <button
                    key={key}
                    onClick={() => setCategoryFilter(key)}
                    className={`text-xs px-2.5 py-1 rounded-full transition-colors ${
                      categoryFilter === key ? 'bg-white text-teal-700' : 'bg-teal-500/40 text-teal-100'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <span className="text-xs text-teal-200 mb-1.5 block">处理状态</span>
              <div className="flex flex-wrap gap-1.5">
                {([
                  { value: 'all', label: '全部' },
                  { value: 'pending_verify', label: '待核验' },
                  { value: 'pending_feedback', label: '待反馈' },
                  { value: 'done', label: '已闭环' },
                ] as { value: StatusFilter; label: string }[]).map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setStatusFilter(opt.value)}
                    className={`text-xs px-2.5 py-1 rounded-full transition-colors ${
                      statusFilter === opt.value ? 'bg-white text-teal-700' : 'bg-teal-500/40 text-teal-100'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </header>

      <div className="px-4 py-4 space-y-2.5">
        {filteredRecords.length === 0 && (
          <div className="text-center py-20">
            <FileText size={40} className="mx-auto text-slate-300 mb-3" />
            <p className="text-sm text-slate-400">暂无匹配记录</p>
            <p className="text-xs text-slate-300 mt-1">试试调整筛选条件</p>
          </div>
        )}

        {filteredRecords.map((r) => {
          const statusColor = r.displayStatus === '已闭环'
            ? 'bg-green-500'
            : r.displayStatus === '待反馈'
            ? 'bg-blue-500'
            : r.displayStatus === '核验中'
            ? 'bg-amber-500'
            : 'bg-teal-500'

          return (
            <div
              key={r.clue.id}
              className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 relative overflow-hidden"
            >
              <div className={`absolute left-0 top-0 bottom-0 w-1 ${statusColor}`} />
              <div className="pl-2">
                <div className="flex items-start gap-3">
                  <CategoryIcon category={r.clue.category} size="sm" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-slate-700 line-clamp-2">{r.clue.originalText}</p>
                    <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                      <span className="text-[10px] text-slate-400">{r.community?.name}</span>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                        r.displayStatus === '已闭环'
                          ? 'bg-green-50 text-green-700'
                          : r.displayStatus === '待反馈'
                          ? 'bg-blue-50 text-blue-700'
                          : r.displayStatus === '核验中'
                          ? 'bg-amber-50 text-amber-700'
                          : 'bg-teal-50 text-teal-700'
                      }`}>
                        {r.displayStatus}
                      </span>
                      {r.verification?.verifiedAt && (
                        <span className="text-[10px] text-slate-300">
                          {new Date(r.verification.verifiedAt).toLocaleDateString('zh-CN')}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    {r.verification && (
                      <button
                        onClick={() => handleViewDetail(r.clue.id)}
                        className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center"
                        title="查看详情"
                      >
                        <Eye size={14} className="text-teal-500" />
                      </button>
                    )}
                    {r.displayStatus === '待反馈' && (
                      <button
                        onClick={() => handleSelectForFeedback(r.clue.id)}
                        className="w-8 h-8 rounded-lg bg-teal-50 flex items-center justify-center"
                        title="填写反馈"
                      >
                        <Edit3 size={14} className="text-teal-500" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {viewingClue && viewingVerification && (
        <VerificationDetail
          verification={{ ...viewingVerification, clue: viewingClue }}
          feedback={viewingFeedback || undefined}
          onClose={() => setViewingClueId(null)}
          onVerify={() => {
            setViewingClueId(null)
            navigate('/verify', { state: { clueId: viewingClue.id } })
          }}
          onFeedback={() => {
            setViewingClueId(null)
            handleSelectForFeedback(viewingClue.id)
          }}
        />
      )}
    </div>
  )
}
