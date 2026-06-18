import { Clock, Users, AlertTriangle } from 'lucide-react'
import type { Clue, ClueSource, AlertType } from '@/types'
import { CATEGORY_LABELS, SOURCE_LABELS } from '@/types'
import { useStore } from '@/store/useStore'
import CategoryIcon from './CategoryIcon'

const sourceStyles: Record<ClueSource, string> = {
  wechat: 'bg-green-50 text-green-700 border-green-200',
  bulletin: 'bg-blue-50 text-blue-700 border-blue-200',
  video: 'bg-purple-50 text-purple-700 border-purple-200',
}

const alertStyles: Record<string, string> = {
  '重点关注': 'bg-red-500',
  '投诉突增': 'bg-orange-500',
  '同类聚集': 'bg-amber-500',
  '持续多日': 'bg-rose-500',
  '转办后仍投诉': 'bg-purple-500',
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
  alertLabel?: string
  alertTypes?: AlertType[]
  onClick: () => void
}

export default function ClueCard({ clue, alertLabel, onClick }: Props) {
  const getCommunityById = useStore((s) => s.getCommunityById)
  const community = getCommunityById(clue.communityId)

  const statusColors: Record<string, string> = {
    pending: 'bg-teal-500',
    verifying: 'bg-amber-500',
    verified: 'bg-blue-500',
    feedback_done: 'bg-green-500',
  }

  const statusLabels: Record<string, string> = {
    pending: '待核验',
    verifying: '核验中',
    verified: '已核验',
    feedback_done: '已闭环',
  }

  return (
    <div
      onClick={onClick}
      className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 active:scale-[0.98] transition-transform cursor-pointer relative overflow-hidden"
    >
      <div className={`absolute left-0 top-0 bottom-0 w-1 ${
        alertLabel ? alertStyles[alertLabel] : statusColors[clue.status]
      }`} />

      <div className="flex gap-3 pl-2">
        <div className="flex-shrink-0 mt-0.5">
          <CategoryIcon category={clue.category} size="sm" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            <span className="text-xs text-slate-400">{community?.name}</span>
            <span className={`text-[10px] px-1.5 py-0.5 rounded-full border ${sourceStyles[clue.source]}`}>
              {SOURCE_LABELS[clue.source]}
            </span>
            {alertLabel && (
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full text-white flex items-center gap-0.5 ${alertStyles[alertLabel]}`}>
                <AlertTriangle size={10} />
                {alertLabel}
              </span>
            )}
            <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${statusColors[clue.status]} text-white ml-auto`}>
              {statusLabels[clue.status]}
            </span>
          </div>

          <p className="text-sm text-slate-800 leading-relaxed line-clamp-2 mb-2">
            {clue.originalText}
          </p>

          <div className="flex items-center gap-4 text-xs text-slate-400">
            <span className="flex items-center gap-1">
              <Users size={12} />
              <span className="font-medium text-orange-500">{clue.similarCount}</span>
              人相似
            </span>
            <span className="flex items-center gap-1">
              <Clock size={12} />
              {timeAgo(clue.lastAppearedAt)}
            </span>
            <span className="ml-auto text-[10px] text-slate-300">
              {CATEGORY_LABELS[clue.category]}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
