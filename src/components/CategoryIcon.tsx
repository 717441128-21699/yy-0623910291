import { Trash2, Lightbulb, Volume2, Car, Droplets, HelpCircle } from 'lucide-react'
import type { ClueCategory } from '@/types'

const iconMap: Record<ClueCategory, React.ReactNode> = {
  garbage: <Trash2 size={18} />,
  lighting: <Lightbulb size={18} />,
  noise: <Volume2 size={18} />,
  parking: <Car size={18} />,
  water: <Droplets size={18} />,
  other: <HelpCircle size={18} />,
}

const bgMap: Record<ClueCategory, string> = {
  garbage: 'bg-orange-100 text-orange-600',
  lighting: 'bg-yellow-100 text-yellow-600',
  noise: 'bg-red-100 text-red-600',
  parking: 'bg-blue-100 text-blue-600',
  water: 'bg-cyan-100 text-cyan-600',
  other: 'bg-gray-100 text-gray-600',
}

interface Props {
  category: ClueCategory
  size?: 'sm' | 'md'
}

export default function CategoryIcon({ category, size = 'md' }: Props) {
  const containerClass = size === 'sm' ? 'w-8 h-8' : 'w-10 h-10'
  return (
    <div className={`${containerClass} rounded-xl flex items-center justify-center ${bgMap[category]}`}>
      {iconMap[category]}
    </div>
  )
}
