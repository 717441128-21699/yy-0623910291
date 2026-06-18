import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Filter, ChevronDown, ChevronUp, Search, AlertTriangle, TrendingUp, Users, Clock, RefreshCw, UserX } from 'lucide-react'
import type { ClueCategory, ClueSource } from '@/types'
import { CATEGORY_LABELS, SOURCE_LABELS } from '@/types'
import { useStore } from '@/store/useStore'
import { communities } from '@/data/mockData'
import ClueCard from '@/components/ClueCard'
import ClueDetail from '@/components/ClueDetail'

export default function Clues() {
  const navigate = useNavigate()
  const clues = useStore((s) => s.clues)
  const selectClue = useStore((s) => s.selectClue)
  const selectedClueId = useStore((s) => s.selectedClueId)
  const startVerify = useStore((s) => s.startVerify)
  const getCluesWithAlerts = useStore((s) => s.getCluesWithAlerts)
  const getVerificationByClueId = useStore((s) => s.getVerificationByClueId)
  const getFeedbackByClueId = useStore((s) => s.getFeedbackByClueId)

  const [categoryFilter, setCategoryFilter] = useState<ClueCategory | 'all'>('all')
  const [sourceFilter, setSourceFilter] = useState<ClueSource | 'all'>('all')
  const [showFilters, setShowFilters] = useState(false)
  const [expandedCommunity, setExpandedCommunity] = useState<string | null>(null)

  const cluesWithAlerts = useMemo(() => getCluesWithAlerts(), [getCluesWithAlerts])

  const priorityClues = useMemo(
    () => cluesWithAlerts.filter((c) => c.alertTypes.length > 0),
    [cluesWithAlerts]
  )

  const filtered = clues.filter((c) => {
    if (categoryFilter !== 'all' && c.category !== categoryFilter) return false
    if (sourceFilter !== 'all' && c.source !== sourceFilter) return false
    return true
  })

  const grouped = communities
    .map((comm) => ({
      ...comm,
      clues: filtered
        .filter((c) => c.communityId === comm.id)
        .sort((a, b) => b.similarCount - a.similarCount),
    }))
    .filter((g) => g.clues.length > 0)
    .sort((a, b) => {
      const aMax = a.clues[0]?.similarCount ?? 0
      const bMax = b.clues[0]?.similarCount ?? 0
      return bMax - aMax
    })

  const selectedClue = clues.find((c) => c.id === selectedClueId)

  const today = new Date()
  const dateStr = `${today.getMonth() + 1}月${today.getDate()}日`
  const weekdays = ['日', '一', '二', '三', '四', '五', '六']
  const weekday = weekdays[today.getDay()]

  const pendingCount = clues.filter((c) => c.status === 'pending').length

  const getAlertInfo = (clueId: string) => {
    return cluesWithAlerts.find((c) => c.id === clueId)
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-teal-700 text-white px-5 pt-12 pb-5 rounded-b-3xl">
        <div className="flex items-center justify-between mb-1">
          <div>
            <h1 className="text-xl font-bold">今日线索</h1>
            <p className="text-teal-200 text-xs mt-0.5">
              {dateStr} 星期{weekday}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="bg-teal-600/60 rounded-lg px-2.5 py-1 text-xs">
              <span className="text-teal-200">待核验</span>
              <span className="ml-1 font-bold text-orange-300">{pendingCount}</span>
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
        </div>

        {showFilters && (
          <div className="mt-3 bg-teal-600/40 rounded-xl p-3 animate-fade-in">
            <div className="mb-2">
              <span className="text-xs text-teal-200 mb-1.5 block">诉求类别</span>
              <div className="flex flex-wrap gap-1.5">
                <button
                  onClick={() => setCategoryFilter('all')}
                  className={`text-xs px-2.5 py-1 rounded-full transition-colors ${
                    categoryFilter === 'all'
                      ? 'bg-white text-teal-700'
                      : 'bg-teal-500/40 text-teal-100'
                  }`}
                >
                  全部
                </button>
                {(Object.entries(CATEGORY_LABELS) as [ClueCategory, string][]).map(
                  ([key, label]) => (
                    <button
                      key={key}
                      onClick={() => setCategoryFilter(key)}
                      className={`text-xs px-2.5 py-1 rounded-full transition-colors ${
                        categoryFilter === key
                          ? 'bg-white text-teal-700'
                          : 'bg-teal-500/40 text-teal-100'
                      }`}
                    >
                      {label}
                    </button>
                  )
                )}
              </div>
            </div>
            <div>
              <span className="text-xs text-teal-200 mb-1.5 block">来源渠道</span>
              <div className="flex flex-wrap gap-1.5">
                <button
                  onClick={() => setSourceFilter('all')}
                  className={`text-xs px-2.5 py-1 rounded-full transition-colors ${
                    sourceFilter === 'all'
                      ? 'bg-white text-teal-700'
                      : 'bg-teal-500/40 text-teal-100'
                  }`}
                >
                  全部
                </button>
                {(Object.entries(SOURCE_LABELS) as [ClueSource, string][]).map(
                  ([key, label]) => (
                    <button
                      key={key}
                      onClick={() => setSourceFilter(key)}
                      className={`text-xs px-2.5 py-1 rounded-full transition-colors ${
                        sourceFilter === key
                          ? 'bg-white text-teal-700'
                          : 'bg-teal-500/40 text-teal-100'
                      }`}
                    >
                      {label}
                    </button>
                  )
                )}
              </div>
            </div>
          </div>
        )}
      </header>

      <div className="px-4 py-4 space-y-3 pb-24">
        {priorityClues.length > 0 && (
          <section className="mb-2">
            <div className="flex items-center gap-2 mb-3 px-1">
              <div className="w-6 h-6 rounded-lg bg-red-50 flex items-center justify-center">
                <AlertTriangle size={14} className="text-red-500" />
              </div>
              <h2 className="text-sm font-semibold text-slate-700">今日重点提醒</h2>
              <span className="text-[10px] bg-red-50 text-red-600 px-1.5 py-0.5 rounded-full">
                {priorityClues.length}条
              </span>
            </div>
            <div className="space-y-2.5">
              {priorityClues.map((clue) => (
                <ClueCard
                  key={clue.id}
                  clue={clue}
                  alertLabel={clue.alertLabel}
                  alertTypes={clue.alertTypes}
                  transferDept={clue.transferDept}
                  transferSimilarCount={clue.transferSimilarCount}
                  onClick={() => selectClue(clue.id)}
                />
              ))}
            </div>
            <div className="flex flex-wrap items-center gap-3 px-2 mt-3 text-xs text-slate-400">
              <span className="flex items-center gap-1">
                <TrendingUp size={10} className="text-orange-500" />
                投诉突增 = 相似人数≥10
              </span>
              <span className="flex items-center gap-1">
                <Users size={10} className="text-amber-500" />
                同类聚集 = 同小区同类别≥2条
              </span>
              <span className="flex items-center gap-1">
                <Clock size={10} className="text-rose-500" />
                持续多日 = 出现≥3天
              </span>
              <span className="flex items-center gap-1">
                <RefreshCw size={10} className="text-purple-500" />
                转办后仍投诉 = 转办后仍有新增
              </span>
            </div>
          </section>
        )}

        <section>
          <div className="flex items-center gap-2 mb-3 px-1">
            <div className="w-6 h-6 rounded-lg bg-teal-50 flex items-center justify-center">
              <Search size={14} className="text-teal-600" />
            </div>
            <h2 className="text-sm font-semibold text-slate-700">全部线索</h2>
            <span className="text-[10px] bg-teal-50 text-teal-700 px-1.5 py-0.5 rounded-full">
              {filtered.length}条
            </span>
          </div>

          {grouped.length === 0 && (
            <div className="text-center py-16">
              <Search size={40} className="mx-auto text-slate-300 mb-3" />
              <p className="text-sm text-slate-400">暂无匹配的线索</p>
            </div>
          )}

          {grouped.map((group) => {
            const isExpanded = expandedCommunity === group.id || group.clues.length <= 2
            return (
              <div key={group.id} className="mb-2">
                <button
                  onClick={() =>
                    setExpandedCommunity(isExpanded && group.clues.length > 2 ? null : group.id)
                  }
                  className="w-full flex items-center justify-between px-2 py-2"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-slate-700">{group.name}</span>
                    <span className="text-[10px] bg-teal-50 text-teal-700 px-1.5 py-0.5 rounded-full font-medium">
                      {group.clues.length}条
                    </span>
                  </div>
                  {group.clues.length > 2 && (
                    <span className="text-slate-400">
                      {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </span>
                  )}
                </button>

                <div className="space-y-2.5">
                  {(isExpanded ? group.clues : group.clues.slice(0, 2)).map((clue) => {
                    const alertInfo = getAlertInfo(clue.id)
                    return (
                      <ClueCard
                        key={clue.id}
                        clue={clue}
                        alertLabel={alertInfo?.alertLabel}
                        alertTypes={alertInfo?.alertTypes}
                        transferDept={alertInfo?.transferDept}
                        transferSimilarCount={alertInfo?.transferSimilarCount}
                        onClick={() => selectClue(clue.id)}
                      />
                    )
                  })}
                </div>
              </div>
            )
          })}
        </section>
      </div>

      {selectedClue && (
        <ClueDetail
          clue={selectedClue}
          onClose={() => selectClue(null)}
          onVerify={(id) => {
            selectClue(null)
            const verification = getVerificationByClueId(id)
            const feedback = getFeedbackByClueId(id)
            if (verification && !feedback) {
              navigate('/feedback', { state: { clueId: id } })
            } else if (feedback) {
              navigate('/feedback', { state: { clueId: id } })
            } else {
              startVerify(id)
              navigate(`/verify/${id}`)
            }
          }}
        />
      )}
    </div>
  )
}
