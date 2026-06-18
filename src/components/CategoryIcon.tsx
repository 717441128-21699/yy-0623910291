import { Trash2, Lightbulb, Volume2, Car, Droplets, HelpCircle } from 'lucide-react'
import type { ClueCategory } from '@/types'

const iconMap: Record<ClueCategory, { sm: React.ReactNode; md: React.ReactNode; xs: React.ReactNode }> = {
  garbage: { xs: <Trash2 size={12} />, sm: <Trash2 size={14} />, md: <Trash2 size={18} /> },
  lighting: { xs: <Lightbulb size={12} />, sm: <Lightbulb size={14} />, md: <Lightbulb size={18} /> },
  noise: { xs: <Volume2 size={12} />, sm: <Volume2 size={14} />, md: <Volume2 size={18} /> },
  parking: { xs: <Car size={12} />, sm: <Car size={14} />, md: <Car size={18} /> },
  water: { xs: <Droplets size={12} />, sm: <Droplets size={14} />, md: <Droplets size={18} /> },
  other: { xs: <HelpCircle size={12} />, sm: <HelpCircle size={14} />, md: <HelpCircle size={18} /> },
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
  size?: 'xs' | 'sm' | 'md'
}

export default function CategoryIcon({ category, size = 'md' }: Props) {
  const containerClass = size === 'xs' ? 'w-6 h-6' : size === 'sm' ? 'w-8 h-8' : 'w-10 h-10'
  return (
    <div className={`${containerClass} rounded-xl flex items-center justify-center ${bgMap[category]}`}>
      {iconMap[category][size]}
    </div>
  )
}
