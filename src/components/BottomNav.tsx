import { useLocation, useNavigate } from 'react-router-dom'
import { Search, ClipboardCheck, FileText, ListTodo } from 'lucide-react'

const tabs = [
  { path: '/', label: '今日线索', icon: Search },
  { path: '/tasks', label: '跟进任务', icon: ListTodo },
  { path: '/verify', label: '现场核验', icon: ClipboardCheck },
  { path: '/feedback', label: '反馈记录', icon: FileText },
]

export default function BottomNav() {
  const location = useLocation()
  const navigate = useNavigate()

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-100 z-40 safe-area-bottom">
      <div className="flex items-center justify-around h-16 max-w-lg mx-auto">
        {tabs.map((tab) => {
          const isActive = location.pathname === tab.path ||
            (tab.path === '/' && location.pathname === '/')
          const Icon = tab.icon
          return (
            <button
              key={tab.path}
              onClick={() => navigate(tab.path)}
              className={`flex flex-col items-center justify-center gap-0.5 w-16 h-full transition-colors ${
                isActive ? 'text-teal-600' : 'text-slate-400'
              }`}
            >
              <Icon size={20} strokeWidth={isActive ? 2.5 : 1.5} />
              <span className={`text-[10px] ${isActive ? 'font-semibold' : 'font-normal'}`}>
                {tab.label}
              </span>
              {isActive && (
                <div className="w-4 h-0.5 bg-teal-600 rounded-full -mt-0.5" />
              )}
            </button>
          )
        })}
      </div>
    </nav>
  )
}
