import { useState, useMemo } from 'react'
import { format } from 'date-fns'
import { ChevronDown, ChevronRight } from 'lucide-react'
import { useTaskStore } from '@/stores/taskStore'
import { useUIStore } from '@/stores/uiStore'
import { getDepartmentById, TASK_STATUSES } from '@/lib/constants'
import { StatusChip } from '@/components/common/StatusChip'
import { ProgressBar } from '@/components/common/ProgressBar'
import type { Task } from '@/lib/types'

function DepartmentRoles({ taskId }: { taskId: string }) {
  const getTaskDepartments = useTaskStore((s) => s.getTaskDepartments)
  const roles = getTaskDepartments(taskId)

  if (roles.length === 0) {
    return (
      <p className="py-2 text-xs text-text-tertiary italic">No department roles assigned.</p>
    )
  }

  return (
    <div className="mt-2 flex flex-col gap-1.5">
      {roles.map((role) => {
        const dept = getDepartmentById(role.departmentId)
        return (
          <div key={role.id} className="flex items-start gap-2 text-xs">
            <span
              className="mt-0.5 h-2.5 w-2.5 shrink-0 rounded-full"
              style={{ backgroundColor: dept?.color ?? '#9CA3AF' }}
            />
            <span className="font-medium text-text-primary" style={{ color: dept?.color ?? '#9CA3AF' }}>
              {dept?.abbreviation ?? '??'}
            </span>
            <span className="text-text-secondary">{role.roleDescription}</span>
          </div>
        )
      })}
    </div>
  )
}

interface TaskRowProps {
  task: Task
  isExpanded: boolean
  onToggleExpand: (id: string) => void
}

function IDTaskRow({ task, isExpanded, onToggleExpand }: TaskRowProps) {
  const openTaskDetail = useUIStore((s) => s.openTaskDetail)
  const getChecklistProgress = useTaskStore((s) => s.getChecklistProgress)
  const progress = getChecklistProgress(task.id)
  const statusConfig = TASK_STATUSES.find((s) => s.value === task.status)

  return (
    <div className="rounded-lg border border-border-subtle bg-surface-1 overflow-hidden">
      {/* Main row */}
      <div className="flex items-center gap-3 px-4 py-3">
        <button
          onClick={() => onToggleExpand(task.id)}
          className="shrink-0 text-text-tertiary hover:text-text-secondary transition-colors"
          aria-label={isExpanded ? 'Collapse roles' : 'Expand roles'}
        >
          {isExpanded ? (
            <ChevronDown className="h-4 w-4" />
          ) : (
            <ChevronRight className="h-4 w-4" />
          )}
        </button>

        {/* Task code */}
        <span className="font-mono text-xs font-semibold text-text-tertiary w-16 shrink-0">
          {task.taskCode}
        </span>

        {/* Title — clickable */}
        <button
          className="flex-1 text-left text-sm font-medium text-text-primary hover:text-accent transition-colors"
          onClick={() => openTaskDetail(task.id)}
        >
          {task.title}
        </button>

        <div className="flex items-center gap-3 shrink-0">
          {/* Status */}
          <StatusChip status={task.status} />

          {/* Due date */}
          {task.dueDate && (
            <span className="text-xs text-text-tertiary tabular-nums">
              {format(new Date(task.dueDate), 'MMM d')}
            </span>
          )}

          {/* Checklist progress */}
          {progress.total > 0 && (
            <ProgressBar completed={progress.completed} total={progress.total} />
          )}
        </div>
      </div>

      {/* Expanded department roles */}
      {isExpanded && (
        <div className="border-t border-border-subtle bg-surface-2 px-4 pb-3 pt-2">
          <p
            className="mb-1.5 text-[11px] font-semibold uppercase tracking-wider"
            style={{ color: statusConfig?.color ?? '#9CA3AF' }}
          >
            Department Roles
          </p>
          <DepartmentRoles taskId={task.id} />
        </div>
      )}
    </div>
  )
}

export function InterDepartmentView() {
  const allTasks = useTaskStore((s) => s.tasks)
  const tasks = useMemo(() => allTasks.filter((t) => t.category === 'inter_department'), [allTasks])
  const [expandedTaskId, setExpandedTaskId] = useState<string | null>(null)

  function handleToggleExpand(id: string) {
    setExpandedTaskId((prev) => (prev === id ? null : id))
  }

  const notStarted = tasks.filter((t) => t.status === 'not_started').length
  const inProgress = tasks.filter((t) => t.status === 'in_progress').length
  const completed = tasks.filter((t) => t.status === 'completed').length

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Summary stats */}
      <div className="flex gap-4">
        <div className="rounded-lg border border-border-subtle bg-surface-1 px-4 py-3 text-center">
          <p className="text-2xl font-semibold text-text-primary">{tasks.length}</p>
          <p className="text-xs text-text-tertiary">Total</p>
        </div>
        <div className="rounded-lg border border-border-subtle bg-surface-1 px-4 py-3 text-center">
          <p className="text-2xl font-semibold" style={{ color: '#3B82F6' }}>{inProgress}</p>
          <p className="text-xs text-text-tertiary">In Progress</p>
        </div>
        <div className="rounded-lg border border-border-subtle bg-surface-1 px-4 py-3 text-center">
          <p className="text-2xl font-semibold" style={{ color: '#9CA3AF' }}>{notStarted}</p>
          <p className="text-xs text-text-tertiary">Not Started</p>
        </div>
        <div className="rounded-lg border border-border-subtle bg-surface-1 px-4 py-3 text-center">
          <p className="text-2xl font-semibold" style={{ color: '#10B981' }}>{completed}</p>
          <p className="text-xs text-text-tertiary">Completed</p>
        </div>
      </div>

      {/* Task list */}
      {tasks.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-text-tertiary">
          <p className="text-sm">No inter-department tasks found.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {tasks
            .sort((a, b) => a.sortOrder - b.sortOrder)
            .map((task) => (
              <IDTaskRow
                key={task.id}
                task={task}
                isExpanded={expandedTaskId === task.id}
                onToggleExpand={handleToggleExpand}
              />
            ))}
        </div>
      )}
    </div>
  )
}
