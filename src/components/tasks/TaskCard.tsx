import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { CalendarDays } from 'lucide-react'
import { format, isPast, isToday } from 'date-fns'
import type { Task } from '@/lib/types'
import { useTaskStore } from '@/stores/taskStore'
import { useUIStore } from '@/stores/uiStore'
import { getDepartmentById } from '@/lib/constants'
import { PriorityBadge } from '@/components/common/PriorityBadge'
import { AvatarGroup } from '@/components/common/AvatarGroup'

interface TaskCardProps {
  task: Task
}

export function TaskCard({ task }: TaskCardProps) {
  const { getAssigneesForTask, getChecklistProgress } = useTaskStore()
  const { openTaskDetail, selectedTaskId } = useUIStore()

  const assignees = getAssigneesForTask(task.id)
  const progress = getChecklistProgress(task.id)
  const dept = task.departmentId ? getDepartmentById(task.departmentId) : null
  const isSelected = selectedTaskId === task.id

  const overdue =
    task.dueDate &&
    task.status !== 'completed' &&
    isPast(new Date(task.dueDate)) &&
    !isToday(new Date(task.dueDate))

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={() => openTaskDetail(task.id)}
      className={`
        group cursor-pointer rounded-lg border border-border-default bg-surface-2
        p-3 transition-colors select-none
        ${isSelected ? 'border-accent/50 ring-1 ring-accent/30' : 'hover:border-border-strong hover:bg-surface-3'}
        ${isDragging ? 'shadow-xl ring-1 ring-accent/40' : ''}
      `}
    >
      {/* Department color bar + task code */}
      <div className="mb-2 flex items-center gap-2">
        {dept && (
          <span
            className="h-3 w-0.5 shrink-0 rounded-full"
            style={{ backgroundColor: dept.color }}
          />
        )}
        <span className="font-mono text-[10px] font-bold tracking-wide text-text-tertiary">
          {task.taskCode}
        </span>
        {task.isHighPriority && task.priority !== 'critical' && task.priority !== 'high' && (
          <span className="rounded bg-amber-500/15 px-1 py-0.5 text-[9px] font-semibold text-amber-400">
            HP
          </span>
        )}
        {task.carriedFromPeriod && (
          <span className="rounded bg-red-500/15 px-1 py-0.5 text-[9px] font-semibold text-red-400">
            CO
          </span>
        )}
      </div>

      {/* Title */}
      <p className="mb-3 line-clamp-2 text-sm leading-snug text-text-primary group-hover:text-white">
        {task.title}
      </p>

      {/* Bottom row */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          <PriorityBadge priority={task.priority} />

          {task.dueDate && (
            <span
              className={`inline-flex items-center gap-1 text-[10px] ${
                overdue ? 'text-red-400' : 'text-text-tertiary'
              }`}
            >
              <CalendarDays size={10} />
              {format(new Date(task.dueDate), 'MMM d')}
            </span>
          )}
        </div>

        <div className="flex shrink-0 items-center gap-2">
          {progress.total > 0 && (
            <span className="text-[10px] font-medium tabular-nums text-text-tertiary">
              {progress.completed}/{progress.total}
            </span>
          )}
          {assignees.length > 0 && <AvatarGroup profiles={assignees} max={2} />}
        </div>
      </div>
    </div>
  )
}
