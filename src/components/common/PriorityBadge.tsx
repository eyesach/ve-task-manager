import { AlertTriangle, ArrowUp, ArrowDown, Minus } from 'lucide-react'
import type { TaskPriority } from '@/lib/types'
import { getPriorityConfig } from '@/lib/constants'

const PRIORITY_ICONS: Record<TaskPriority, React.ReactNode> = {
  low: <ArrowDown size={10} />,
  normal: <Minus size={10} />,
  high: <ArrowUp size={10} />,
  critical: <AlertTriangle size={10} />,
}

export function PriorityBadge({ priority }: { priority: TaskPriority }) {
  const config = getPriorityConfig(priority)
  if (priority === 'normal') return null

  return (
    <span
      className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide"
      style={{
        color: config.color,
        backgroundColor: `${config.color}15`,
      }}
    >
      {PRIORITY_ICONS[priority]}
      {config.label}
    </span>
  )
}
