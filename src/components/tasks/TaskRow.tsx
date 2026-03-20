import { format, isPast, isToday } from 'date-fns'
import { CalendarDays } from 'lucide-react'
import type { Task } from '@/lib/types'
import { useTaskStore } from '@/stores/taskStore'
import { useUIStore } from '@/stores/uiStore'
import { getDepartmentById } from '@/lib/constants'
import { StatusChip } from '@/components/common/StatusChip'
import { PriorityBadge } from '@/components/common/PriorityBadge'
import { AvatarGroup } from '@/components/common/AvatarGroup'
import { ProgressBar } from '@/components/common/ProgressBar'
import { usePermissions } from '@/hooks/usePermissions'

export function TaskRow({ task }: { task: Task }) {
  const { getAssigneesForTask, getChecklistProgress, updateTaskStatus } = useTaskStore()
  const { openTaskDetail, selectedTaskId } = useUIStore()
  const { canUpdateTaskStatus } = usePermissions()
  const assignees = getAssigneesForTask(task.id)
  const progress = getChecklistProgress(task.id)
  const dept = task.departmentId ? getDepartmentById(task.departmentId) : null
  const isSelected = selectedTaskId === task.id
  const assigneeIds = assignees.map((a) => a.id)
  const canChangeStatus = canUpdateTaskStatus(task, assigneeIds)

  const overdue =
    task.dueDate &&
    task.status !== 'completed' &&
    isPast(new Date(task.dueDate)) &&
    !isToday(new Date(task.dueDate))

  return (
    <button
      onClick={() => openTaskDetail(task.id)}
      className={`
        group flex w-full items-center gap-4 border-b border-border-subtle px-5 py-3
        text-left transition-colors
        ${isSelected ? 'bg-accent/8' : 'hover:bg-surface-2/60'}
      `}
    >
      {/* Task code + department color bar */}
      <div className="flex w-20 shrink-0 items-center gap-2">
        {dept && (
          <span className="h-5 w-0.5 rounded-full" style={{ backgroundColor: dept.color }} />
        )}
        <span className="font-mono text-xs font-semibold text-text-secondary">
          {task.taskCode}
        </span>
      </div>

      {/* Title + badges */}
      <div className="flex min-w-0 flex-1 items-center gap-2">
        <span className="min-w-0 shrink truncate text-sm text-text-primary group-hover:text-white">
          {task.title}
        </span>
        <div className="flex shrink-0 items-center gap-1.5">
          <PriorityBadge priority={task.priority} />
          {task.isHighPriority && task.priority !== 'critical' && task.priority !== 'high' && (
            <span className="rounded bg-amber-500/15 px-1.5 py-0.5 text-[10px] font-semibold text-amber-400">
              HP
            </span>
          )}
          {task.carriedFromPeriod && (
            <span className="rounded bg-red-500/15 px-1.5 py-0.5 text-[10px] font-semibold text-red-400">
              CARRIED
            </span>
          )}
        </div>
      </div>

      {/* Assignees */}
      <div className="w-24 shrink-0">
        {assignees.length > 0 ? (
          <AvatarGroup profiles={assignees} max={3} />
        ) : (
          <span className="text-xs text-text-tertiary">—</span>
        )}
      </div>

      {/* Status */}
      <div className="w-28 shrink-0" onClick={(e) => e.stopPropagation()}>
        <StatusChip status={task.status} editable={canChangeStatus} onChange={(s) => updateTaskStatus(task.id, s)} />
      </div>

      {/* Due date */}
      <div className="flex w-28 shrink-0 items-center gap-1.5">
        {task.dueDate ? (
          <>
            <CalendarDays size={12} className={overdue ? 'text-red-400' : 'text-text-tertiary'} />
            <span
              className={`text-xs ${
                overdue ? 'font-medium text-red-400' : 'text-text-secondary'
              }`}
            >
              {format(new Date(task.dueDate), 'MMM d')}
            </span>
          </>
        ) : (
          <span className="text-xs text-text-tertiary">No date</span>
        )}
      </div>

      {/* Checklist progress */}
      <div className="w-24 shrink-0">
        <ProgressBar completed={progress.completed} total={progress.total} />
      </div>
    </button>
  )
}
