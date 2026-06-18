import { useState, useCallback } from 'react'
import { useLocation } from 'react-router-dom'
import { ClipboardCopy, Check, ChevronRight, Clock, FileText, Send } from 'lucide-react'
import { useStore } from '@/store/useStore'
import { VERIFY_STATUS_LABELS } from '@/types'
import CategoryIcon from '@/components/CategoryIcon'

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

export default function Feedback() {
  const locationState = useLocation().state as { clueId?: string } | null
  const clueIdFromNav = locationState?.clueId

  const getClueById = useStore((s) => s.getClueById)
  const getCommunityById = useStore((s) => s.getCommunityById)
  const getVerificationByClueId = useStore((s) => s.getVerificationByClueId)
  const getPendingFeedbacks = useStore((s) => s.getPendingFeedbacks)
  const getDoneFeedbacks = useStore((s) => s.getDoneFeedbacks)
  const submitFeedback = useStore((s) => s.submitFeedback)

  const pendingFeedbacks = getPendingFeedbacks()
  const doneFeedbacks = getDoneFeedbacks()

  const [activeClueId, setActiveClueId] = useState<string | null>(clueIdFromNav || null)
  const [result, setResult] = useState('')
  const [transferDept, setTransferDept] = useState('')
  const [transferReason, setTransferReason] = useState('')
  const [showDeptPicker, setShowDeptPicker] = useState(false)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [showDone, setShowDone] = useState(false)

  const activeClue = activeClueId ? getClueById(activeClueId) : null
  const activeVerification = activeClueId ? getVerificationByClueId(activeClueId) : null
  const activeCommunity = activeClue ? getCommunityById(activeClue.communityId) : undefined

  const handleSubmit = useCallback(() => {
    if (!activeVerification || !activeClueId) return
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
  }, [activeVerification, activeClueId, result, transferDept, transferReason, submitFeedback])

  const handleCopy = useCallback((text: string, id: string) => {
    navigator.clipboard.writeText(text).catch(() => {})
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }, [])

  const handleSelectPending = useCallback((clueId: string) => {
    setActiveClueId(clueId)
    setResult('')
    setTransferDept('')
    setTransferReason('')
  }, [])

  if (activeClue && activeVerification) {
    return (
      <div className="min-h-screen bg-slate-50 pb-32">
        <header className="bg-teal-700 text-white px-5 pt-12 pb-5 rounded-b-3xl">
          <h1 className="text-xl font-bold">填写反馈</h1>
          <p className="text-teal-200 text-xs mt-0.5">
            {activeCommunity?.name} · {VERIFY_STATUS_LABELS[activeVerification.verifyStatus!]}
          </p>
        </header>

        <div className="px-4 py-4 space-y-5">
          <div className="bg-amber-50 border border-amber-100 rounded-xl p-4">
            <div className="flex items-start gap-3">
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
                      month: 'numeric',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <section>
            <h3 className="text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">
              <FileText size={16} className="text-teal-600" />
              处置结果
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
              <span className="text-xs text-slate-400 font-normal">（可选）</span>
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
                placeholder="请填写转办原因..."
                rows={2}
                className="w-full mt-2 bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-700 placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-400 resize-none"
              />
            )}
          </section>

          {result && (
            <section className="animate-fade-in">
              <h3 className="text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">
                <ClipboardCopy size={16} className="text-teal-600" />
                社区群说明预览
              </h3>
              <div className="bg-teal-50 border border-teal-200 rounded-xl p-4">
                <p className="text-sm text-teal-800 leading-relaxed">
                  {generatePreviewNotice(activeClue.originalText, activeCommunity?.name || '', activeVerification.verifyStatus!, result, transferDept)}
                </p>
                <button
                  onClick={() => handleCopy(
                    generatePreviewNotice(activeClue.originalText, activeCommunity?.name || '', activeVerification.verifyStatus!, result, transferDept),
                    'preview'
                  )}
                  className="mt-3 flex items-center gap-1.5 text-xs text-teal-600 font-medium"
                >
                  {copiedId === 'preview' ? <Check size={14} /> : <ClipboardCopy size={14} />}
                  {copiedId === 'preview' ? '已复制' : '一键复制'}
                </button>
              </div>
            </section>
          )}
        </div>

        <div className="fixed bottom-16 left-0 right-0 px-4 py-3 bg-white/80 backdrop-blur-lg border-t border-slate-100">
          <button
            onClick={handleSubmit}
            disabled={!result.trim()}
            className={`w-full rounded-xl py-3.5 text-sm font-medium transition-all ${
              result.trim()
                ? 'bg-teal-600 text-white active:bg-teal-700 shadow-lg shadow-teal-600/20'
                : 'bg-slate-100 text-slate-400'
            }`}
          >
            提交反馈
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-24">
      <header className="bg-teal-700 text-white px-5 pt-12 pb-5 rounded-b-3xl">
        <h1 className="text-xl font-bold">反馈记录</h1>
        <p className="text-teal-200 text-xs mt-0.5">
          待反馈 {pendingFeedbacks.length} 条 · 已完成 {doneFeedbacks.length} 条
        </p>
      </header>

      <div className="px-4 py-4 space-y-3">
        {pendingFeedbacks.length > 0 && (
          <section>
            <h3 className="text-sm font-semibold text-slate-600 mb-3 flex items-center gap-2">
              <Clock size={14} />
              待反馈
              <span className="text-xs bg-orange-100 text-orange-600 px-1.5 py-0.5 rounded-full">
                {pendingFeedbacks.length}
              </span>
            </h3>
            <div className="space-y-2.5">
              {pendingFeedbacks.map((v) => {
                const community = getCommunityById(v.clue.communityId)
                return (
                  <button
                    key={v.id}
                    onClick={() => handleSelectPending(v.clueId)}
                    className="w-full bg-white rounded-2xl p-4 shadow-sm border border-slate-100 text-left active:scale-[0.98] transition-transform relative overflow-hidden"
                  >
                    <div
                      className={`absolute left-0 top-0 bottom-0 w-1 ${
                        v.verifyStatus === 'confirmed'
                          ? 'bg-emerald-500'
                          : v.verifyStatus === 'partial'
                          ? 'bg-amber-500'
                          : 'bg-slate-400'
                      }`}
                    />
                    <div className="flex items-center gap-3 pl-2">
                      <CategoryIcon category={v.clue.category} size="sm" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-slate-700 line-clamp-1">{v.clue.originalText}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[10px] text-slate-400">{community?.name}</span>
                          <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                            v.verifyStatus === 'confirmed'
                              ? 'bg-emerald-50 text-emerald-700'
                              : v.verifyStatus === 'partial'
                              ? 'bg-amber-50 text-amber-700'
                              : 'bg-slate-50 text-slate-600'
                          }`}>
                            {VERIFY_STATUS_LABELS[v.verifyStatus!]}
                          </span>
                        </div>
                      </div>
                      <ChevronRight size={16} className="text-slate-300" />
                    </div>
                  </button>
                )
              })}
            </div>
          </section>
        )}

        {doneFeedbacks.length > 0 && (
          <section>
            <button
              onClick={() => setShowDone(!showDone)}
              className="w-full flex items-center justify-between py-2"
            >
              <h3 className="text-sm font-semibold text-slate-600 flex items-center gap-2">
                <Check size={14} />
                已完成
                <span className="text-xs bg-green-100 text-green-600 px-1.5 py-0.5 rounded-full">
                  {doneFeedbacks.length}
                </span>
              </h3>
              <ChevronRight
                size={16}
                className={`text-slate-400 transition-transform ${showDone ? 'rotate-90' : ''}`}
              />
            </button>

            {showDone && (
              <div className="space-y-2.5 animate-fade-in">
                {doneFeedbacks.map((f) => {
                  const community = getCommunityById(f.clue.communityId)
                  return (
                    <div
                      key={f.id}
                      className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 relative overflow-hidden"
                    >
                      <div className="absolute left-0 top-0 bottom-0 w-1 bg-green-500" />
                      <div className="pl-2">
                        <div className="flex items-center gap-2 mb-2">
                          <CategoryIcon category={f.clue.category} size="sm" />
                          <span className="text-xs text-slate-400">{community?.name}</span>
                          <span className="text-[10px] text-slate-300 ml-auto">
                            {f.createdAt
                              ? new Date(f.createdAt).toLocaleDateString('zh-CN')
                              : ''}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 line-clamp-1 mb-2">
                          {f.clue.originalText}
                        </p>
                        <div className="bg-teal-50 border border-teal-100 rounded-lg p-3">
                          <p className="text-xs text-teal-700 leading-relaxed">
                            {f.generatedNotice}
                          </p>
                          <button
                            onClick={() => handleCopy(f.generatedNotice, f.id)}
                            className="mt-2 flex items-center gap-1 text-[10px] text-teal-600 font-medium"
                          >
                            {copiedId === f.id ? <Check size={12} /> : <ClipboardCopy size={12} />}
                            {copiedId === f.id ? '已复制' : '复制说明'}
                          </button>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </section>
        )}

        {pendingFeedbacks.length === 0 && doneFeedbacks.length === 0 && (
          <div className="text-center py-20">
            <FileText size={40} className="mx-auto text-slate-300 mb-3" />
            <p className="text-sm text-slate-400">暂无反馈记录</p>
            <p className="text-xs text-slate-300 mt-1">完成核验后可在此填写反馈</p>
          </div>
        )}
      </div>
    </div>
  )
}

function generatePreviewNotice(
  originalText: string,
  communityName: string,
  verifyStatus: string,
  resultText: string,
  dept: string
): string {
  const verifyLabel = verifyStatus === 'confirmed' ? '属实' :
    verifyStatus === 'partial' ? '部分属实' : '待进一步了解'
  const categoryHint = originalText.includes('垃圾') ? '垃圾清运' :
    originalText.includes('灯') || originalText.includes('照明') ? '楼道照明' :
    originalText.includes('噪声') || originalText.includes('吵') || originalText.includes('音') ? '噪声扰民' :
    originalText.includes('停车') || originalText.includes('占道') ? '违停占道' :
    originalText.includes('水') ? '供水问题' : '居民诉求'
  const action = dept ? `已转办至${dept}处理` : resultText
  return `【社区回复】关于${communityName}${categoryHint}问题的反馈：经现场核验，情况${verifyLabel}。${action}感谢居民朋友的关注与反馈，我们将持续跟进处理。`
}
