import { X, Users, ChevronRight, MessageSquare } from 'lucide-react'
import type { Clue, ClueSource } from '@/types'
import { CATEGORY_LABELS, SOURCE_LABELS } from '@/types'
import { useStore } from '@/store/useStore'
import CategoryIcon from './CategoryIcon'

const sourceStyles: Record<ClueSource, string> = {
  wechat: 'bg-green-50 text-green-700 border-green-200',
  bulletin: 'bg-blue-50 text-blue-700 border-blue-200',
  video: 'bg-purple-50 text-purple-700 border-purple-200',
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 60) return `${mins}分钟前`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}小时前`
  return `${Math.floor(hours / 24)}天前`
}

interface Props {
  clue: Clue
  onClose: () => void
  onVerify: (clueId: string) => void
}

export default function ClueDetail({ clue, onClose, onVerify }: Props) {
  const getCommunityById = useStore((s) => s.getCommunityById)
  const community = getCommunityById(clue.communityId)

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-t-3xl max-h-[85vh] flex flex-col animate-slide-up">
        <div className="flex items-center justify-between px-5 pt-5 pb-3">
          <h3 className="text-lg font-semibold text-slate-800">线索详情</h3>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center"
          >
            <X size={16} className="text-slate-500" />
          </button>
        </div>

        <div className="overflow-y-auto px-5 pb-5 flex-1">
          <div className="flex items-center gap-3 mb-4">
            <CategoryIcon category={clue.category} />
            <div>
              <div className="flex items-center gap-2">
                <span className="font-medium text-slate-800">{community?.name}</span>
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full border ${sourceStyles[clue.source]}`}>
                  {SOURCE_LABELS[clue.source]}
                </span>
              </div>
              <span className="text-xs text-slate-400">{CATEGORY_LABELS[clue.category]}</span>
            </div>
          </div>

          <div className="bg-slate-50 rounded-xl p-4 mb-4">
            <p className="text-sm text-slate-700 leading-relaxed">{clue.originalText}</p>
            <div className="flex items-center gap-4 mt-3 text-xs text-slate-400">
              <span className="flex items-center gap-1">
                <Users size={12} />
                <span className="font-medium text-orange-500">{clue.similarCount}</span>
                人反映
              </span>
              <span>最近：{timeAgo(clue.lastAppearedAt)}</span>
            </div>
          </div>

          {clue.similarTexts.length > 0 && (
            <div className="mb-4">
              <h4 className="text-sm font-medium text-slate-600 mb-2 flex items-center gap-1">
                <MessageSquare size={14} />
                相似表述
              </h4>
              <div className="space-y-2">
                {clue.similarTexts.map((text, i) => (
                  <div
                    key={i}
                    className="bg-white border border-slate-100 rounded-lg px-3 py-2 text-xs text-slate-500"
                  >
                    {text}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {clue.status === 'pending' && (
          <div className="px-5 pb-6 pt-3 border-t border-slate-100">
            <button
              onClick={() => onVerify(clue.id)}
              className="w-full bg-teal-600 text-white rounded-xl py-3.5 text-sm font-medium flex items-center justify-center gap-2 active:bg-teal-700 transition-colors"
            >
              前往核验
              <ChevronRight size={16} />
            </button>
          </div>
        )}

        {clue.status !== 'pending' && (
          <div className="px-5 pb-6 pt-3 border-t border-slate-100">
            <div className="text-center text-sm text-slate-400">
              {clue.status === 'verifying' && '该线索正在核验中'}
              {clue.status === 'verified' && '该线索已核验，请填写反馈'}
              {clue.status === 'feedback_done' && '该线索已完成闭环'}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
