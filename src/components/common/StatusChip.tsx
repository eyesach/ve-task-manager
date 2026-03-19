import type { TaskStatus } from '@/lib/types'
import { getStatusConfig, TASK_STATUSES } from '@/lib/constants'

interface StatusChipProps {
  status: TaskStatus
  editable?: boolean
  onChange?: (status: TaskStatus) => void
}

export function StatusChip({ status, editable, onChange }: StatusChipProps) {
  const config = getStatusConfig(status)

  if (editable && onChange) {
    return (
      <div className="relative inline-block">
        <select
          value={status}
          onChange={(e) => onChange(e.target.value as TaskStatus)}
          className="h-6 cursor-pointer appearance-none rounded-full border-0 bg-transparent py-0 pl-2.5 pr-6 text-[11px] font-medium outline-none"
          style={{
            color: config.color,
            backgroundColor: `${config.color}18`,
          }}
        >
          {TASK_STATUSES.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>
        <svg
          className="pointer-events-none absolute right-1.5 top-1/2 -translate-y-1/2"
          width="10"
          height="10"
          viewBox="0 0 10 10"
          fill="none"
        >
          <path d="M2.5 4L5 6.5L7.5 4" stroke={config.color} strokeWidth="1.2" strokeLinecap="round" />
        </svg>
      </div>
    )
  }

  return (
    <span
      className="inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-medium"
      style={{
        color: config.color,
        backgroundColor: `${config.color}18`,
      }}
    >
      <span className="mr-1.5 h-1.5 w-1.5 rounded-full" style={{ backgroundColor: config.color }} />
      {config.label}
    </span>
  )
}
