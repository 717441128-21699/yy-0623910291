import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Clock,
  AlertTriangle,
  PhoneCall,
  MessageSquare,
  ChevronRight,
  Filter,
  X,
  Plus,
  Send,
  ClipboardCopy,
  RefreshCw,
  Calendar,
  User,
} from 'lucide-react'
import { useStore } from '@/store/useStore'
import { communities } from '@/data/mockData'
import { URGE_METHOD_LABELS, URGE_METHOD_ICONS, CATEGORY_LABELS } from '@/types'
import type { UrgeMethod, TransferProgress, Clue } from '@/types'
import CategoryIcon from '@/components/CategoryIcon'

const DEPTS = ['物业中心', '环卫中心', '交警大队', '城管执法', '供水公司', '供电所']

const TRANSFER_DEPT_COLORS: Record<string, { bg: string; text: string }> = {
  物业中心: { bg: 'bg-blue-100', text: 'text-blue-700' },
  环卫中心: { bg: 'bg-green-100', text: 'text-green-700' },
  交警大队: { bg: 'bg-slate-100', text: 'text-slate-700' },
  城管执法: { bg: 'bg-orange-100', text: 'text-orange-700' },
  供水公司: { bg: 'bg-cyan-100', text: 'text-cyan-700' },
  供电所: { bg: 'bg-amber-100', text: 'text-amber-700' },
}

function TransferCard({
  progress,
  clue,
  transferDept,
  onClick,
}: {
  progress: TransferProgress
  clue: Clue | undefined
  transferDept: string
  onClick: () => void
}) {
  const navigate = useNavigate()
  const color = TRANSFER_DEPT_COLORS[transferDept] || { bg: 'bg-slate-100', text: 'text-slate-700' }

  return (
    <div
      onClick={onClick}
      className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 active:scale-[0.98] transition-transform cursor-pointer"
    >
      <div className="flex items-start gap-3">
        {clue && <CategoryIcon category={clue.category} size="sm" />}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            <span className={`text-[10px] px-2 py-0.5 rounded-full ${color.bg} ${color.text} font-medium`}>
              {transferDept}
            </span>
            {progress.isOverdue && (
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-100 text-red-600 font-medium flex items-center gap-0.5">
                <AlertTriangle size={10} />
                超时{progress.overdueDays}天
              </span>
            )}
            {!progress.isOverdue && (
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-600 font-medium">
                办理中
              </span>
            )}
            {progress.urgeRecords.length > 0 && (
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-100 text-purple-600 font-medium flex items-center gap-0.5">
                <RefreshCw size={10} />
                已催办{progress.urgeRecords.length}次
              </span>
            )}
          </div>

          <p className="text-sm text-slate-700 leading-relaxed line-clamp-2 mb-2">
            {clue?.originalText}
          </p>

          <div className="flex items-center gap-3 text-xs text-slate-500 flex-wrap">
            <span className="flex items-center gap-1">
              <User size={10} className="text-slate-400" />
              {progress.handlerName || '待确认承办人'}
            </span>
            <span className="flex items-center gap-1">
              <Calendar size={10} className="text-slate-400" />
              {progress.transferAt ? new Date(progress.transferAt).toLocaleDateString('zh-CN') : '-'}
            </span>
            <span className="flex items-center gap-1">
              <Clock size={10} className="text-slate-400" />
              截止 {progress.expectedFinishAt ? new Date(progress.expectedFinishAt).toLocaleDateString('zh-CN') : '-'}
            </span>
          </div>

          {progress.latestFollowUp && (
            <div className="mt-2 bg-purple-50 rounded-xl p-2.5">
              <div className="flex items-center gap-1 mb-1">
                <MessageSquare size={10} className="text-purple-500" />
                <span className="text-[10px] text-purple-600 font-medium">最近回访</span>
                <span className="text-[10px] text-purple-400 ml-auto">
                  {new Date(progress.latestFollowUp.createdAt).toLocaleDateString('zh-CN')}
                </span>
              </div>
              <p className="text-[11px] text-purple-700 leading-relaxed line-clamp-2">
                {progress.latestFollowUp.additionalNotes || '无补充说明'}
              </p>
            </div>
          )}

          <div className="flex items-center mt-2">
            <span className="text-xs text-slate-500">{progress.currentProgress}</span>
            <ChevronRight size={14} className="text-slate-300 ml-auto" />
          </div>
        </div>
      </div>
    </div>
  )
}

function UrgeModal({
  progress,
  transferDept,
  clue,
  onClose,
  onSubmit,
}: {
  progress: TransferProgress
  transferDept: string
  clue: Clue | undefined
  onClose: () => void
  onSubmit: (data: {
    urgeContent: string
    urgeMethod: UrgeMethod
    handlerName: string
    responseContent: string
  }) => void
}) {
  const [urgeMethod, setUrgeMethod] = useState<UrgeMethod>('phone')
  const [handlerName, setHandlerName] = useState(progress.handlerName)
  const [urgeContent, setUrgeContent] = useState('')
  const [responseContent, setResponseContent] = useState('')

  const handleSubmit = () => {
    if (!urgeContent.trim() || !responseContent.trim()) return
    onSubmit({
      urgeContent: urgeContent.trim(),
      urgeMethod,
      handlerName: handlerName.trim(),
      responseContent: responseContent.trim(),
    })
  }

  const getFeedback = useStore((s) => s.getFeedbackByClueId)
  const feedback = getFeedback(progress.clueId)
  const generateUrgeNotice = useStore((s) => s.generateUrgeNotice)

  const preview = useMemo(() => {
    if (!clue || !feedback) return ''
    return generateUrgeNotice({
      communityName: '',
      categoryLabel: CATEGORY_LABELS[clue.category],
      urgeContent,
      urgeMethod,
      handlerName: handlerName || '对方',
      responseContent,
      prevNotice: feedback.generatedNotice,
    })
  }, [clue, feedback, urgeContent, urgeMethod, handlerName, responseContent, generateUrgeNotice])

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-t-3xl max-h-[90vh] flex flex-col animate-slide-up">
        <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-slate-100">
          <h3 className="text-lg font-semibold text-slate-800">追加催办记录</h3>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center"
          >
            <X size={16} className="text-slate-500" />
          </button>
        </div>

        <div className="overflow-y-auto px-5 pb-5 flex-1 space-y-4">
          <div className="bg-orange-50 rounded-xl p-3">
            <p className="text-xs text-orange-700">{clue?.originalText}</p>
            <p className="text-[10px] text-orange-500 mt-1">转办至：{transferDept}</p>
          </div>

          <div>
            <label className="text-sm font-medium text-slate-700 mb-2 block">催办方式</label>
            <div className="grid grid-cols-4 gap-2">
              {(['phone', 'wechat', 'onsite', 'meeting'] as UrgeMethod[]).map((m) => (
                <button
                  key={m}
                  onClick={() => setUrgeMethod(m)}
                  className={`py-2 px-2 rounded-xl text-xs flex flex-col items-center gap-0.5 transition-colors ${
                    urgeMethod === m
                      ? 'bg-teal-100 text-teal-700 border-2 border-teal-300'
                      : 'bg-slate-50 text-slate-600 border-2 border-transparent'
                  }`}
                >
                  <span className="text-base">{URGE_METHOD_ICONS[m]}</span>
                  {URGE_METHOD_LABELS[m]}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-slate-700 mb-2 block">承办人姓名</label>
            <input
              type="text"
              value={handlerName}
              onChange={(e) => setHandlerName(e.target.value)}
              placeholder="请输入承办人姓名"
              className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-700 focus:outline-none focus:border-teal-400 focus:ring-2 focus:ring-teal-100"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-slate-700 mb-2 block">催办内容</label>
            <textarea
              value={urgeContent}
              onChange={(e) => setUrgeContent(e.target.value)}
              placeholder="例如：询问电梯维修进度，居民反映多次仍未解决"
              rows={2}
              className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-700 focus:outline-none focus:border-teal-400 focus:ring-2 focus:ring-teal-100 resize-none"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-slate-700 mb-2 block">对方回复</label>
            <textarea
              value={responseContent}
              onChange={(e) => setResponseContent(e.target.value)}
              placeholder="例如：已联系维保单位，明天上午上门更换配件"
              rows={2}
              className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-700 focus:outline-none focus:border-teal-400 focus:ring-2 focus:ring-teal-100 resize-none"
            />
          </div>

          {urgeContent && responseContent && (
            <div>
              <label className="text-sm font-medium text-slate-700 mb-2 block">群回复预览</label>
              <div className="bg-teal-50 border border-teal-200 rounded-xl p-3">
                <p className="text-xs text-teal-800 leading-relaxed whitespace-pre-line">{preview}</p>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(preview).catch(() => {})
                  }}
                  className="mt-2 flex items-center gap-1 text-[11px] text-teal-600 font-medium"
                >
                  <ClipboardCopy size={12} />
                  一键复制
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="px-5 py-4 border-t border-slate-100 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 bg-slate-100 text-slate-700 rounded-xl py-3 text-sm font-medium active:bg-slate-200"
          >
            取消
          </button>
          <button
            onClick={handleSubmit}
            disabled={!urgeContent.trim() || !responseContent.trim()}
            className="flex-1 bg-orange-500 text-white rounded-xl py-3 text-sm font-medium active:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1.5"
          >
            <Send size={14} />
            提交催办
          </button>
        </div>
      </div>
    </div>
  )
}

function TransferDetail({
  progress,
  onClose,
  onAddUrge,
  onAddFollowUp,
}: {
  progress: TransferProgress
  onClose: () => void
  onAddUrge: () => void
  onAddFollowUp: () => void
}) {
  const navigate = useNavigate()
  const getClueById = useStore((s) => s.getClueById)
  const getFeedbackByClueId = useStore((s) => s.getFeedbackByClueId)
  const getVerificationByClueId = useStore((s) => s.getVerificationByClueId)

  const clue = getClueById(progress.clueId)
  const feedback = getFeedbackByClueId(progress.clueId)
  const verification = getVerificationByClueId(progress.clueId)
  const transferDept = feedback?.transferDept || ''

  const handleViewVerification = () => {
    navigate('/feedback', { state: { clueId: progress.clueId } })
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-t-3xl max-h-[90vh] flex flex-col animate-slide-up">
        <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-slate-100">
          <h3 className="text-lg font-semibold text-slate-800">转办详情</h3>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center"
          >
            <X size={16} className="text-slate-500" />
          </button>
        </div>

        <div className="overflow-y-auto px-5 pb-5 flex-1 space-y-4">
          <div className="py-3 border-b border-slate-100">
            <div className="flex items-start gap-3">
              {clue && <CategoryIcon category={clue.category} size="md" />}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2 flex-wrap">
                  <span className={`text-[10px] px-2 py-0.5 rounded-full ${TRANSFER_DEPT_COLORS[transferDept]?.bg || 'bg-slate-100'} ${TRANSFER_DEPT_COLORS[transferDept]?.text || 'text-slate-700'} font-medium`}>
                    {transferDept}
                  </span>
                  {progress.isOverdue ? (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-100 text-red-600 font-medium flex items-center gap-0.5">
                      <AlertTriangle size={10} />
                      已超时{progress.overdueDays}天
                    </span>
                  ) : (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-600 font-medium">
                      办理中
                    </span>
                  )}
                </div>
                <p className="text-sm text-slate-700 leading-relaxed">{clue?.originalText}</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="bg-slate-50 rounded-xl p-3">
              <p className="text-[10px] text-slate-500 mb-1">承办人</p>
              <p className="text-sm font-medium text-slate-700">{progress.handlerName || '-'}</p>
            </div>
            <div className="bg-slate-50 rounded-xl p-3">
              <p className="text-[10px] text-slate-500 mb-1">转办时间</p>
              <p className="text-sm font-medium text-slate-700">
                {progress.transferAt ? new Date(progress.transferAt).toLocaleDateString('zh-CN') : '-'}
              </p>
            </div>
            <div className="bg-slate-50 rounded-xl p-3">
              <p className="text-[10px] text-slate-500 mb-1">截止日期</p>
              <p className="text-sm font-medium text-slate-700">
                {progress.expectedFinishAt ? new Date(progress.expectedFinishAt).toLocaleDateString('zh-CN') : '-'}
              </p>
            </div>
            <div className="bg-slate-50 rounded-xl p-3">
              <p className="text-[10px] text-slate-500 mb-1">当前进度</p>
              <p className="text-sm font-medium text-slate-700">{progress.currentProgress}</p>
            </div>
          </div>

          {verification && (
            <button
              onClick={handleViewVerification}
              className="w-full bg-teal-50 border border-teal-200 rounded-xl p-3 flex items-center justify-between"
            >
              <span className="text-sm text-teal-700 font-medium">查看取证包和群回复</span>
              <ChevronRight size={16} className="text-teal-500" />
            </button>
          )}

          {progress.urgeRecords.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
                <RefreshCw size={14} className="text-purple-600" />
                催办记录
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-purple-100 text-purple-600 font-normal">
                  {progress.urgeRecords.length}条
                </span>
              </h4>
              <div className="space-y-2.5">
                {progress.urgeRecords.map((urge, idx) => (
                  <div key={urge.id} className="bg-purple-50 border border-purple-100 rounded-xl p-3">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-[10px] bg-white px-1.5 py-0.5 rounded-full text-slate-500">
                        第{idx + 1}次催办
                      </span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-purple-100 text-purple-700 flex items-center gap-0.5">
                        {URGE_METHOD_ICONS[urge.urgeMethod]}
                        {URGE_METHOD_LABELS[urge.urgeMethod]}
                      </span>
                      <span className="text-[10px] text-slate-400 ml-auto">
                        {new Date(urge.createdAt).toLocaleString('zh-CN', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-600 mb-1">
                      <span className="text-slate-400">催办：</span>
                      {urge.urgeContent}
                    </p>
                    <p className="text-[11px] text-slate-600">
                      <span className="text-slate-400">回复：</span>
                      {urge.responseContent}
                    </p>
                    {urge.handlerName && (
                      <p className="text-[10px] text-slate-400 mt-1">
                        联系：{urge.handlerName}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {progress.latestFollowUp && (
            <div>
              <h4 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
                <MessageSquare size={14} className="text-teal-600" />
                最近回访
              </h4>
              <div className="bg-teal-50 border border-teal-200 rounded-xl p-3">
                <p className="text-[11px] text-teal-700 leading-relaxed">
                  {progress.latestFollowUp.additionalNotes || '无补充说明'}
                </p>
                <p className="text-[10px] text-teal-500 mt-1.5">
                  {new Date(progress.latestFollowUp.createdAt).toLocaleDateString('zh-CN')}
                </p>
              </div>
            </div>
          )}
        </div>

        <div className="px-5 py-4 border-t border-slate-100 flex gap-3">
          <button
            onClick={onAddFollowUp}
            className="flex-1 bg-teal-600 text-white rounded-xl py-3 text-sm font-medium active:bg-teal-700 flex items-center justify-center gap-1.5"
          >
            <MessageSquare size={14} />
            回访补充
          </button>
          <button
            onClick={onAddUrge}
            className="flex-1 bg-orange-500 text-white rounded-xl py-3 text-sm font-medium active:bg-orange-600 flex items-center justify-center gap-1.5"
          >
            <Plus size={14} />
            追加催办
          </button>
        </div>
      </div>
    </div>
  )
}

export default function Supervise() {
  const navigate = useNavigate()
  const getTransferProgressList = useStore((s) => s.getTransferProgressList)
  const getClueById = useStore((s) => s.getClueById)
  const getFeedbackByClueId = useStore((s) => s.getFeedbackByClueId)
  const addUrgeRecord = useStore((s) => s.addUrgeRecord)

  const [showFilters, setShowFilters] = useState(false)
  const [selectedDept, setSelectedDept] = useState<string>('')
  const [selectedCommunity, setSelectedCommunity] = useState<string>('')
  const [onlyOverdue, setOnlyOverdue] = useState(false)
  const [viewingProgressId, setViewingProgressId] = useState<string | null>(null)
  const [showUrgeModal, setShowUrgeModal] = useState(false)

  const transferProgressList = useMemo(() => {
    return getTransferProgressList({
      dept: selectedDept || undefined,
      isOverdue: onlyOverdue ? true : undefined,
      communityId: selectedCommunity || undefined,
    })
  }, [getTransferProgressList, selectedDept, selectedCommunity, onlyOverdue])

  const viewingProgress = viewingProgressId
    ? transferProgressList.find((p) => p.feedbackId === viewingProgressId)
    : null

  const viewingClue = viewingProgress ? getClueById(viewingProgress.clueId) : undefined
  const viewingFeedback = viewingProgress ? getFeedbackByClueId(viewingProgress.clueId) : undefined

  const overdueCount = transferProgressList.filter((p) => p.isOverdue).length
  const totalCount = transferProgressList.length
  const urgeCount = transferProgressList.reduce((sum, p) => sum + p.urgeRecords.length, 0)

  const handleAddUrge = (data: {
    urgeContent: string
    urgeMethod: UrgeMethod
    handlerName: string
    responseContent: string
  }) => {
    if (!viewingProgress) return
    addUrgeRecord({
      feedbackId: viewingProgress.feedbackId,
      clueId: viewingProgress.clueId,
      ...data,
    })
    setShowUrgeModal(false)
  }

  const handleAddFollowUp = () => {
    if (!viewingProgress) return
    navigate('/feedback', { state: { clueId: viewingProgress.clueId, showFollowUp: true } })
  }

  const today = new Date()
  const dateStr = `${today.getMonth() + 1}月${today.getDate()}日`
  const weekdays = ['日', '一', '二', '三', '四', '五', '六']
  const weekday = weekdays[today.getDay()]

  return (
    <div className="min-h-screen bg-slate-50 pb-24">
      <header className="bg-purple-600 text-white px-5 pt-12 pb-5 rounded-b-3xl">
        <div className="flex items-center justify-between mb-1">
          <div>
            <h1 className="text-xl font-bold">转办督办</h1>
            <p className="text-purple-200 text-xs mt-0.5">
              {dateStr} 星期{weekday}
            </p>
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`w-9 h-9 rounded-lg flex items-center justify-center transition-colors ${
              showFilters ? 'bg-white/30' : 'bg-white/10'
            }`}
          >
            <Filter size={18} />
          </button>
        </div>

        <div className="flex gap-2 mt-3">
          <div className="flex-1 bg-white/10 rounded-xl p-3">
            <p className="text-2xl font-bold text-white">{totalCount}</p>
            <p className="text-[10px] text-purple-200 mt-0.5">转办中</p>
          </div>
          <div className="flex-1 bg-white/10 rounded-xl p-3">
            <p className="text-2xl font-bold text-white">{overdueCount}</p>
            <p className="text-[10px] text-purple-200 mt-0.5">已超时</p>
          </div>
          <div className="flex-1 bg-white/10 rounded-xl p-3">
            <p className="text-2xl font-bold text-white">{urgeCount}</p>
            <p className="text-[10px] text-purple-200 mt-0.5">催办次数</p>
          </div>
        </div>
      </header>

      {showFilters && (
        <div className="bg-white border-b border-slate-100 px-4 py-3 space-y-3">
          <div>
            <label className="text-xs font-medium text-slate-600 mb-1.5 block">转办部门</label>
            <div className="flex gap-1.5 flex-wrap">
              <button
                onClick={() => setSelectedDept('')}
                className={`px-3 py-1.5 rounded-full text-xs transition-colors ${
                  !selectedDept
                    ? 'bg-purple-600 text-white'
                    : 'bg-slate-100 text-slate-600'
                }`}
              >
                全部
              </button>
              {DEPTS.map((dept) => (
                <button
                  key={dept}
                  onClick={() => setSelectedDept(dept)}
                  className={`px-3 py-1.5 rounded-full text-xs transition-colors ${
                    selectedDept === dept
                      ? 'bg-purple-600 text-white'
                      : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {dept}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-slate-600 mb-1.5 block">所属小区</label>
            <div className="flex gap-1.5 flex-wrap">
              <button
                onClick={() => setSelectedCommunity('')}
                className={`px-3 py-1.5 rounded-full text-xs transition-colors ${
                  !selectedCommunity
                    ? 'bg-purple-600 text-white'
                    : 'bg-slate-100 text-slate-600'
                }`}
              >
                全部
              </button>
              {communities.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setSelectedCommunity(c.id)}
                  className={`px-3 py-1.5 rounded-full text-xs transition-colors ${
                    selectedCommunity === c.id
                      ? 'bg-purple-600 text-white'
                      : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {c.name}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setOnlyOverdue(!onlyOverdue)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs transition-colors ${
                onlyOverdue
                  ? 'bg-red-100 text-red-600 border border-red-200'
                  : 'bg-slate-100 text-slate-600 border border-transparent'
              }`}
            >
              <AlertTriangle size={12} />
              只看超时
            </button>
            <button
              onClick={() => {
                setSelectedDept('')
                setSelectedCommunity('')
                setOnlyOverdue(false)
              }}
              className="text-xs text-slate-400 ml-auto"
            >
              重置筛选
            </button>
          </div>
        </div>
      )}

      <div className="px-4 py-4 space-y-2.5">
        {transferProgressList.length === 0 ? (
          <div className="text-center py-16">
            <PhoneCall size={48} className="mx-auto text-slate-300 mb-4" />
            <h2 className="text-lg font-medium text-slate-500 mb-2">暂无转办记录</h2>
            <p className="text-sm text-slate-400">反馈记录转办后会在这里显示</p>
          </div>
        ) : (
          transferProgressList.map((progress) => {
            const clue = getClueById(progress.clueId)
            const feedback = getFeedbackByClueId(progress.clueId)
            return (
              <TransferCard
                key={progress.feedbackId}
                progress={progress}
                clue={clue}
                transferDept={feedback?.transferDept || ''}
                onClick={() => setViewingProgressId(progress.feedbackId)}
              />
            )
          })
        )}
      </div>

      {viewingProgress && viewingFeedback && (
        <TransferDetail
          progress={viewingProgress}
          onClose={() => setViewingProgressId(null)}
          onAddUrge={() => setShowUrgeModal(true)}
          onAddFollowUp={handleAddFollowUp}
        />
      )}

      {viewingProgress && viewingClue && viewingFeedback && showUrgeModal && (
        <UrgeModal
          progress={viewingProgress}
          transferDept={viewingFeedback.transferDept}
          clue={viewingClue}
          onClose={() => setShowUrgeModal(false)}
          onSubmit={handleAddUrge}
        />
      )}
    </div>
  )
}
