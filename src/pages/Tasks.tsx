import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
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
} from 'lucide-react'
import {
  TASK_TYPE_LABELS,
  TASK_GROUP_LABELS,
} from '@/types'
import type { TaskGroup, TaskItem } from '@/types'
import { useStore } from '@/store/useStore'
import CategoryIcon from '@/components/CategoryIcon'

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

function TaskCard({ task, onClick }: { task: TaskItem; onClick: () => void }) {
  const Icon = taskIcons[task.type]
  const colors = taskColors[task.type]

  return (
    <div
      onClick={onClick}
      className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 active:scale-[0.98] transition-transform cursor-pointer relative overflow-hidden"
    >
      <div className={`absolute left-0 top-0 bottom-0 w-1 ${TASK_GROUP_LABELS[task.group].bg.replace('bg-', 'bg-').replace('-50', '-500')}`} />

      <div className="flex gap-3 pl-2">
        <div className={`w-10 h-10 rounded-xl ${colors.bg} ${colors.border} border flex items-center justify-center flex-shrink-0`}>
          <Icon size={18} className={colors.text} />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${colors.bg} ${colors.text} ${colors.border} border`}>
              {TASK_TYPE_LABELS[task.type]}
            </span>
            <span className="text-xs text-slate-400">{task.communityName}</span>
            <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${TASK_GROUP_LABELS[task.group].bg} ${TASK_GROUP_LABELS[task.group].color}`}>
              {task.daysRemaining < 0 ? `逾期${-task.daysRemaining}天` : `剩${task.daysRemaining}天`}
            </span>
            {task.type === 'transfer_followup' && task.feedback?.transferDept && (
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-purple-100 text-purple-700 flex items-center gap-0.5">
                <RefreshCw size={8} />
                转{task.feedback.transferDept}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 mb-1.5">
            <CategoryIcon category={task.clue.category} size="xs" />
            <p className="text-sm text-slate-800 leading-relaxed line-clamp-2 flex-1">
              {task.clue.originalText}
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {task.missingActions.map((action, i) => (
              <span key={i} className="text-[10px] px-1.5 py-0.5 rounded-full bg-orange-50 text-orange-600 border border-orange-200 flex items-center gap-0.5">
                <AlertCircle size={8} />
                {action}
              </span>
            ))}
            <span className="flex items-center gap-1 text-xs text-slate-400 ml-auto">
              <Users size={10} className="text-orange-500" />
              {task.clue.similarCount}人
            </span>
          </div>
        </div>

        <ChevronRight size={16} className="text-slate-300 flex-shrink-0 self-center" />
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
    <section className="mb-4">
      <div className="flex items-center gap-2 mb-3 px-1">
        <div className={`w-6 h-6 rounded-lg ${style.bg} flex items-center justify-center`}>
          {groupKey === 'overdue' ? (
            <AlertTriangle size={14} className={style.color} />
          ) : (
            <Calendar size={14} className={style.color} />
          )}
        </div>
        <h2 className="text-sm font-semibold text-slate-700">{title}</h2>
        <span className={`text-[10px] ${style.bg} ${style.color} px-1.5 py-0.5 rounded-full`}>
          {tasks.length}条
        </span>
      </div>
      <div className="space-y-2.5">
        {tasks.map((task) => (
          <TaskCard key={task.id} task={task} onClick={() => onTaskClick(task)} />
        ))}
      </div>
    </section>
  )
}

export default function Tasks() {
  const navigate = useNavigate()
  const getTasks = useStore((s) => s.getTasks)
  const startVerify = useStore((s) => s.startVerify)

  const tasks = useMemo(() => getTasks(), [getTasks])

  const totalCount = tasks.overdue.length + tasks.today.length + tasks.tomorrow.length + tasks.future.length
  const overdueCount = tasks.overdue.length
  const todayCount = tasks.today.length

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

  return (
    <div className="min-h-screen bg-slate-50 pb-24">
      <header className="bg-orange-500 text-white px-5 pt-12 pb-5 rounded-b-3xl">
        <div className="flex items-center justify-between mb-1">
          <div>
            <h1 className="text-xl font-bold">跟进任务</h1>
            <p className="text-orange-100 text-xs mt-0.5">
              {dateStr} 星期{weekday}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {overdueCount > 0 && (
              <div className="bg-red-500/20 rounded-lg px-2.5 py-1 text-xs">
                <span className="text-red-100">已逾期</span>
                <span className="ml-1 font-bold text-white">{overdueCount}</span>
              </div>
            )}
            <div className="bg-orange-400/40 rounded-lg px-2.5 py-1 text-xs">
              <span className="text-orange-100">待处理</span>
              <span className="ml-1 font-bold text-white">{totalCount}</span>
            </div>
          </div>
        </div>

        <div className="flex gap-2 mt-3">
          <div className="flex-1 bg-white/10 rounded-xl p-3">
            <p className="text-2xl font-bold text-white">{todayCount}</p>
            <p className="text-[10px] text-orange-100 mt-0.5">今日需处理</p>
          </div>
          <div className="flex-1 bg-white/10 rounded-xl p-3">
            <p className="text-2xl font-bold text-white">{tasks.tomorrow.length}</p>
            <p className="text-[10px] text-orange-100 mt-0.5">明日到期</p>
          </div>
          <div className="flex-1 bg-white/10 rounded-xl p-3">
            <p className="text-2xl font-bold text-white">{tasks.today.filter(t => t.type === 'verify').length}</p>
            <p className="text-[10px] text-orange-100 mt-0.5">待核验</p>
          </div>
        </div>
      </header>

      <div className="px-4 py-4 space-y-3">
        {totalCount === 0 && (
          <div className="text-center py-16">
            <Calendar size={48} className="mx-auto text-slate-300 mb-4" />
            <h2 className="text-lg font-medium text-slate-500 mb-2">暂无待处理任务</h2>
            <p className="text-sm text-slate-400">所有线索都已跟进完毕，真棒！</p>
          </div>
        )}

        <TaskSection
          title="已逾期"
          groupKey="overdue"
          tasks={tasks.overdue}
          onTaskClick={handleTaskClick}
        />
        <TaskSection
          title="今日需处理"
          groupKey="today"
          tasks={tasks.today}
          onTaskClick={handleTaskClick}
        />
        <TaskSection
          title="明日到期"
          groupKey="tomorrow"
          tasks={tasks.tomorrow}
          onTaskClick={handleTaskClick}
        />
        <TaskSection
          title="稍后处理"
          groupKey="future"
          tasks={tasks.future}
          onTaskClick={handleTaskClick}
        />
      </div>
    </div>
  )
}
