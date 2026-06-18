import { useState, useMemo, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import {
  ClipboardCheck,
  FileText,
  PhoneCall,
  AlertCircle,
  Calendar,
  ChevronRight,
  Users,
  RefreshCw,
  AlertTriangle,
  Filter,
  X,
  CheckCircle2,
  Check,
} from 'lucide-react'
import {
  TASK_TYPE_LABELS,
  TASK_GROUP_LABELS,
  CATEGORY_LABELS,
} from '@/types'
import type { TaskGroup, TaskItem, TaskType, ClueCategory } from '@/types'
import { useStore } from '@/store/useStore'
import { communities } from '@/data/mockData'
import CategoryIcon from '@/components/CategoryIcon'

const DEPTS = ['物业中心', '环卫中心', '交警大队', '城管执法', '供水公司', '供电所', '环保所', '派出所']

const taskIcons: Record<TaskItem['type'], React.ElementType> = {
  verify: ClipboardCheck,
  feedback: FileText,
  transfer_followup: PhoneCall,
}

const taskColors: Record<TaskItem['type'], { bg: string; text: string; border: string }> = {
  verify: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
  feedback: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
  transfer_followup: { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200' },
}

function TaskCheckbox({
  checked,
  onChange,
}: {
  checked: boolean
  onChange: () => void
}) {
  return (
    <button
      onClick={(e) => {
        e.stopPropagation()
        onChange()
      }}
      className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${
        checked
          ? 'bg-teal-500 border-teal-500'
          : 'border-slate-300 hover:border-teal-400'
      }`}
    >
      {checked && <Check size={12} className="text-white" strokeWidth={3} />}
    </button>
  )
}

function TaskCard({
  task,
  onClick,
}: {
  task: TaskItem
  onClick: () => void
}) {
  const Icon = taskIcons[task.type]
  const colors = taskColors[task.type]

  return (
    <div
      onClick={onClick}
      className="bg-white rounded-2xl p-3.5 shadow-sm border border-slate-100 active:scale-[0.99] transition-transform cursor-pointer hover:shadow-md"
    >
      <div className="flex items-start gap-3">
        <TaskCheckbox
          checked={false}
          onChange={onClick}
        />

        <div className={`w-9 h-9 rounded-xl ${colors.bg} ${colors.border} border flex items-center justify-center flex-shrink-0`}>
          <Icon size={16} className={colors.text} />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-1 flex-wrap">
            <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${colors.bg} ${colors.text} ${colors.border} border font-medium`}>
              {TASK_TYPE_LABELS[task.type]}
            </span>
            <span className="text-[10px] text-slate-400">{task.communityName}</span>
            <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${TASK_GROUP_LABELS[task.group].bg} ${TASK_GROUP_LABELS[task.group].color} font-medium`}>
              {task.daysRemaining < 0 ? `逾期${-task.daysRemaining}天` : task.daysRemaining === 0 ? '今天' : `剩${task.daysRemaining}天`}
            </span>
            {task.type === 'transfer_followup' && task.feedback?.transferDept && (
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-purple-100 text-purple-700 flex items-center gap-0.5 font-medium">
                <RefreshCw size={8} />
                转{task.feedback.transferDept}
              </span>
            )}
          </div>

          <div className="flex items-center gap-1.5 mb-1.5">
            <CategoryIcon category={task.clue.category} size="xs" />
            <span className="text-[11px] text-slate-500">
              {CATEGORY_LABELS[task.clue.category]}
            </span>
          </div>

          <p className="text-sm text-slate-700 leading-relaxed line-clamp-1 mb-2">
            {task.clue.originalText}
          </p>

          <div className="flex items-center gap-1.5 flex-wrap">
            {task.missingActions.map((action, i) => (
              <span key={i} className="text-[9px] px-1.5 py-0.5 rounded-full bg-orange-50 text-orange-600 border border-orange-200 flex items-center gap-0.5">
                <AlertCircle size={7} />
                {action}
              </span>
            ))}
            <span className="flex items-center gap-0.5 text-[10px] text-slate-400 ml-auto">
              <Users size={9} className="text-orange-500" />
              {task.clue.similarCount}人
            </span>
          </div>
        </div>

        <ChevronRight size={14} className="text-slate-300 flex-shrink-0 self-center" />
      </div>
    </div>
  )
}

function TaskSection({
  title,
  groupKey,
  tasks,
  onTaskClick,
}: {
  title: string
  groupKey: TaskGroup
  tasks: TaskItem[]
  onTaskClick: (task: TaskItem) => void
}) {
  if (tasks.length === 0) return null

  const style = TASK_GROUP_LABELS[groupKey]

  return (
    <section className="mb-5">
      <div className="flex items-center gap-2 mb-2.5 px-0.5">
        <div className={`w-5 h-5 rounded-md ${style.bg} flex items-center justify-center`}>
          {groupKey === 'overdue' ? (
            <AlertTriangle size={12} className={style.color} />
          ) : (
            <Calendar size={12} className={style.color} />
          )}
        </div>
        <h2 className="text-sm font-semibold text-slate-700">{title}</h2>
        <span className={`text-[10px] ${style.bg} ${style.color} px-1.5 py-0.5 rounded-full font-medium`}>
          {tasks.length}条
        </span>
      </div>
      <div className="space-y-2">
        {tasks.map((task) => (
          <TaskCard key={task.id} task={task} onClick={() => onTaskClick(task)} />
        ))}
      </div>
    </section>
  )
}

export default function Tasks() {
  const navigate = useNavigate()
  const location = useLocation()
  const getTasks = useStore((s) => s.getTasks)
  const startVerify = useStore((s) => s.startVerify)
  const getFeedbackByClueId = useStore((s) => s.getFeedbackByClueId)

  const [showFilters, setShowFilters] = useState(false)
  const [selectedType, setSelectedType] = useState<TaskType | ''>('')
  const [selectedDistrict, setSelectedDistrict] = useState<string>('')
  const [selectedCommunity, setSelectedCommunity] = useState<string>('')
  const [selectedDept, setSelectedDept] = useState<string>('')
  const [selectedUrgency, setSelectedUrgency] = useState<TaskGroup | ''>('')
  const [onlyToday, setOnlyToday] = useState(false)

  const allTasks = useMemo(() => getTasks(), [getTasks, location.key])

  const districts = useMemo(() => {
    const set = new Set(communities.map(c => c.district))
    return Array.from(set)
  }, [])

  const filteredTasks = useMemo(() => {
    const result = { ...allTasks }

    if (onlyToday) {
      result.overdue = []
      result.tomorrow = []
      result.future = []
    }

    const filterFn = (task: TaskItem) => {
      if (onlyToday && task.type !== 'transfer_followup') return false
      if (selectedType && task.type !== selectedType) return false
      if (selectedDistrict) {
        const community = communities.find(c => c.id === task.clue.communityId)
        if (community?.district !== selectedDistrict) return false
      }
      if (selectedCommunity && task.clue.communityId !== selectedCommunity) return false
      if (selectedUrgency && task.group !== selectedUrgency) return false
      if (selectedDept && task.type === 'transfer_followup') {
        const feedback = getFeedbackByClueId(task.clue.id)
        if (feedback?.transferDept !== selectedDept) return false
      }
      return true
    }

    result.overdue = result.overdue.filter(filterFn)
    result.today = result.today.filter(filterFn)
    result.tomorrow = result.tomorrow.filter(filterFn)
    result.future = result.future.filter(filterFn)

    return result
  }, [allTasks, selectedType, selectedDistrict, selectedCommunity, selectedDept, selectedUrgency, onlyToday, getFeedbackByClueId])

  const totalCount = filteredTasks.overdue.length + filteredTasks.today.length + filteredTasks.tomorrow.length + filteredTasks.future.length
  const overdueCount = filteredTasks.overdue.length
  const todayCount = filteredTasks.today.length
  const transferCount = useMemo(() => {
    return [...allTasks.overdue, ...allTasks.today, ...allTasks.tomorrow, ...allTasks.future]
      .filter(t => t.type === 'transfer_followup').length
  }, [allTasks])

  const handleTaskClick = (task: TaskItem) => {
    if (task.type === 'verify') {
      startVerify(task.clue.id)
      navigate(`/verify/${task.clue.id}`)
    } else if (task.type === 'feedback') {
      navigate('/feedback', { state: { clueId: task.clue.id } })
    } else if (task.type === 'transfer_followup') {
      navigate('/feedback', { state: { clueId: task.clue.id, showFollowUp: true } })
    }
  }

  const today = new Date()
  const dateStr = `${today.getMonth() + 1}月${today.getDate()}日`
  const weekdays = ['日', '一', '二', '三', '四', '五', '六']
  const weekday = weekdays[today.getDay()]

  const hasActiveFilters = selectedType || selectedDistrict || selectedCommunity || selectedDept || selectedUrgency || onlyToday

  return (
    <div className="min-h-screen bg-slate-50 pb-24">
      <header className="bg-orange-500 text-white px-5 pt-12 pb-5 rounded-b-3xl">
        <div className="flex items-center justify-between mb-1">
          <div>
            <h1 className="text-xl font-bold">跟进任务</h1>
            <p className="text-orange-200 text-xs mt-0.5">
              {dateStr} 星期{weekday}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {overdueCount > 0 && (
              <div className="bg-red-500/30 rounded-lg px-2.5 py-1 text-xs">
                <span className="text-red-100">已逾期</span>
                <span className="ml-1 font-bold text-white">{overdueCount}</span>
              </div>
            )}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`w-9 h-9 rounded-lg flex items-center justify-center transition-colors relative ${
                showFilters || hasActiveFilters ? 'bg-white/30' : 'bg-white/10'
              }`}
            >
              <Filter size={18} />
              {hasActiveFilters && (
                <span className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-red-500 rounded-full border-2 border-orange-500" />
              )}
            </button>
          </div>
        </div>

        <div className="flex gap-2 mt-3">
          <div className="flex-1 bg-white/10 rounded-xl p-2.5">
            <p className="text-xl font-bold text-white">{todayCount}</p>
            <p className="text-[10px] text-orange-200 mt-0.5">今日需处理</p>
          </div>
          <div className="flex-1 bg-white/10 rounded-xl p-2.5">
            <p className="text-xl font-bold text-white">{filteredTasks.tomorrow.length}</p>
            <p className="text-[10px] text-orange-200 mt-0.5">明日到期</p>
          </div>
          <div className="flex-1 bg-white/10 rounded-xl p-2.5">
            <p className="text-xl font-bold text-white">{filteredTasks.today.filter(t => t.type === 'verify').length}</p>
            <p className="text-[10px] text-orange-200 mt-0.5">待核验</p>
          </div>
          <div className="flex-1 bg-white/10 rounded-xl p-2.5">
            <p className="text-xl font-bold text-white">{transferCount}</p>
            <p className="text-[10px] text-orange-200 mt-0.5">待回访</p>
          </div>
        </div>
      </header>

      {showFilters && (
        <div className="bg-white border-b border-slate-100 px-4 py-3 space-y-3">
          <div>
            <label className="text-xs font-medium text-slate-600 mb-1.5 block">任务类型</label>
            <div className="flex gap-1.5 flex-wrap">
              <button
                onClick={() => setSelectedType('')}
                className={`px-3 py-1.5 rounded-full text-xs transition-colors ${
                  !selectedType
                    ? 'bg-orange-500 text-white'
                    : 'bg-slate-100 text-slate-600'
                }`}
              >
                全部
              </button>
              {(['verify', 'feedback', 'transfer_followup'] as TaskType[]).map((type) => (
                <button
                  key={type}
                  onClick={() => setSelectedType(type)}
                  className={`px-3 py-1.5 rounded-full text-xs transition-colors ${
                    selectedType === type
                      ? 'bg-orange-500 text-white'
                      : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {TASK_TYPE_LABELS[type]}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-slate-600 mb-1.5 block">所属网格</label>
            <div className="flex gap-1.5 flex-wrap">
              <button
                onClick={() => setSelectedDistrict('')}
                className={`px-3 py-1.5 rounded-full text-xs transition-colors ${
                  !selectedDistrict
                    ? 'bg-orange-500 text-white'
                    : 'bg-slate-100 text-slate-600'
                }`}
              >
                全部
              </button>
              {districts.map((d) => (
                <button
                  key={d}
                  onClick={() => setSelectedDistrict(d)}
                  className={`px-3 py-1.5 rounded-full text-xs transition-colors ${
                    selectedDistrict === d
                      ? 'bg-orange-500 text-white'
                      : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {d}
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
                    ? 'bg-orange-500 text-white'
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
                      ? 'bg-orange-500 text-white'
                      : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {c.name}
                </button>
              ))}
            </div>
          </div>

          {selectedType === 'transfer_followup' && (
            <div>
              <label className="text-xs font-medium text-slate-600 mb-1.5 block">转办部门</label>
              <div className="flex gap-1.5 flex-wrap">
                <button
                  onClick={() => setSelectedDept('')}
                  className={`px-3 py-1.5 rounded-full text-xs transition-colors ${
                    !selectedDept
                      ? 'bg-orange-500 text-white'
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
                        ? 'bg-orange-500 text-white'
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {dept}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div>
            <label className="text-xs font-medium text-slate-600 mb-1.5 block">逾期程度</label>
            <div className="flex gap-1.5 flex-wrap">
              <button
                onClick={() => setSelectedUrgency('')}
                className={`px-3 py-1.5 rounded-full text-xs transition-colors ${
                  !selectedUrgency
                    ? 'bg-orange-500 text-white'
                    : 'bg-slate-100 text-slate-600'
                }`}
              >
                全部
              </button>
              {(['overdue', 'today', 'tomorrow', 'future'] as TaskGroup[]).map((g) => (
                <button
                  key={g}
                  onClick={() => setSelectedUrgency(g)}
                  className={`px-3 py-1.5 rounded-full text-xs transition-colors ${
                    selectedUrgency === g
                      ? 'bg-orange-500 text-white'
                      : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {TASK_GROUP_LABELS[g].label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2 pt-1">
            <button
              onClick={() => setOnlyToday(!onlyToday)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs transition-colors ${
                onlyToday
                  ? 'bg-red-100 text-red-600 border border-red-200'
                  : 'bg-slate-100 text-slate-600 border border-transparent'
              }`}
            >
              <CheckCircle2 size={12} />
              只看今天必须处理
            </button>
            {hasActiveFilters && (
              <button
                onClick={() => {
                  setSelectedType('')
                  setSelectedCommunity('')
                  setSelectedDept('')
                  setSelectedUrgency('')
                  setOnlyToday(false)
                }}
                className="text-xs text-slate-400 ml-auto flex items-center gap-1"
              >
                <X size={12} />
                清除筛选
              </button>
            )}
          </div>
        </div>
      )}

      <div className="px-4 py-4 space-y-1">
        {totalCount === 0 && (
          <div className="text-center py-16">
            <Calendar size={48} className="mx-auto text-slate-300 mb-4" />
            <h2 className="text-lg font-medium text-slate-500 mb-2">暂无待处理任务</h2>
            <p className="text-sm text-slate-400">所有线索都已跟进完毕，真棒！</p>
          </div>
        )}

        {hasActiveFilters && totalCount > 0 && (
          <div className="flex items-center justify-between px-1 mb-3">
            <p className="text-xs text-slate-500">
              筛选结果：<span className="font-medium text-slate-700">{totalCount}</span> 条
            </p>
          </div>
        )}

        <TaskSection
          title="已逾期"
          groupKey="overdue"
          tasks={filteredTasks.overdue}
          onTaskClick={handleTaskClick}
        />
        <TaskSection
          title="今日需处理"
          groupKey="today"
          tasks={filteredTasks.today}
          onTaskClick={handleTaskClick}
        />
        <TaskSection
          title="明日到期"
          groupKey="tomorrow"
          tasks={filteredTasks.tomorrow}
          onTaskClick={handleTaskClick}
        />
        <TaskSection
          title="稍后处理"
          groupKey="future"
          tasks={filteredTasks.future}
          onTaskClick={handleTaskClick}
        />
      </div>
    </div>
  )
}
