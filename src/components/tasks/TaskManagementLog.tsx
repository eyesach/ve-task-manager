import { useMemo } from 'react'
import { useParams } from 'react-router-dom'
import { format } from 'date-fns'
import { ClipboardList } from 'lucide-react'
import { useTaskStore } from '@/stores/taskStore'
import { useFilterStore } from '@/stores/filterStore'
import { useUIStore } from '@/stores/uiStore'
import { DEPARTMENTS, getDepartmentByAbbr } from '@/lib/constants'
import { StatusChip } from '@/components/common/StatusChip'
import type { Task } from '@/lib/types'

interface TaskManagementLogProps {
  viewOverride?: string
}

function getTasksForView(
  activeView: string,
  getTasksByDepartment: (id: string) => Task[],
  getTasksByCategory: (cat: string) => Task[],
  allTasks: Task[]
): Task[] {
  const dept = DEPARTMENTS.find((d) => d.id === activeView)
  if (dept) return getTasksByDepartment(dept.id)

  if (activeView === 'inter_department') return getTasksByCategory('inter_department')
  if (activeView === 'trade_show') return getTasksByCategory('trade_show')
  if (activeView === 'competition') return getTasksByCategory('competition')
  if (activeView === 'dashboard') return allTasks

  return []
}

function formatDate(dateStr: string | undefined | null): string {
  if (!dateStr) return '—'
  try {
    return format(new Date(dateStr), 'MMM d, yyyy')
  } catch {
    return '—'
  }
}

export function TaskManagementLog({ viewOverride }: TaskManagementLogProps) {
  const { tasks, getTasksByDepartment, getTasksByCategory, assignees, profiles, getChecklistProgress } =
    useTaskStore()
  const { abbr } = useParams<{ abbr: string }>()
  const { statusFilter, priorityFilter, assigneeFilter, searchQuery } = useFilterStore()
  const { openTaskDetail } = useUIStore()

  const activeView = viewOverride ?? (abbr ? getDepartmentByAbbr(abbr)?.id ?? '' : 'dashboard')

  const filteredTasks = useMemo(() => {
    let result = getTasksForView(activeView, getTasksByDepartment, getTasksByCategory, tasks)

    if (statusFilter) {
      result = result.filter((t) => t.status === statusFilter)
    }
    if (priorityFilter) {
      result = result.filter((t) => t.priority === priorityFilter)
    }
    if (assigneeFilter) {
      const assigneeTaskIds = assignees
        .filter((a) => a.profileId === assigneeFilter)
        .map((a) => a.taskId)
      result = result.filter((t) => assigneeTaskIds.includes(t.id))
    }
    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      result = result.filter(
        (t) =>
          t.title.toLowerCase().includes(q) ||
          t.taskCode.toLowerCase().includes(q) ||
          (t.description?.toLowerCase().includes(q) ?? false)
      )
    }

    return result.sort((a, b) => a.sortOrder - b.sortOrder)
  }, [
    activeView,
    tasks,
    assignees,
    statusFilter,
    priorityFilter,
    assigneeFilter,
    searchQuery,
    getTasksByDepartment,
    getTasksByCategory,
  ])

  if (filteredTasks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-text-tertiary">
        <ClipboardList size={40} strokeWidth={1.2} className="mb-3 opacity-40" />
        <p className="text-sm font-medium">No tasks found</p>
        <p className="mt-1 text-xs">Try adjusting your filters or select a department.</p>
      </div>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[900px] border-collapse text-sm">
        <thead>
          <tr className="border-b border-border-default bg-surface-1/50">
            <th className="px-4 py-2.5 text-left text-[10px] font-medium uppercase tracking-wider text-text-tertiary">
              Task Code
            </th>
            <th className="px-4 py-2.5 text-left text-[10px] font-medium uppercase tracking-wider text-text-tertiary">
              Title
            </th>
            <th className="px-4 py-2.5 text-left text-[10px] font-medium uppercase tracking-wider text-text-tertiary">
              Checklist
            </th>
            <th className="px-4 py-2.5 text-left text-[10px] font-medium uppercase tracking-wider text-text-tertiary">
              Status
            </th>
            <th className="px-4 py-2.5 text-left text-[10px] font-medium uppercase tracking-wider text-text-tertiary">
              Assignees
            </th>
            <th className="px-4 py-2.5 text-left text-[10px] font-medium uppercase tracking-wider text-text-tertiary">
              Due Date
            </th>
            <th className="px-4 py-2.5 text-left text-[10px] font-medium uppercase tracking-wider text-text-tertiary">
              Planned
            </th>
            <th className="px-4 py-2.5 text-left text-[10px] font-medium uppercase tracking-wider text-text-tertiary">
              Actual
            </th>
          </tr>
        </thead>
        <tbody>
          {filteredTasks.map((task) => {
            const { completed, total } = getChecklistProgress(task.id)
            const taskAssigneeProfiles = assignees
              .filter((a) => a.taskId === task.id)
              .map((a) => profiles.find((p) => p.id === a.profileId))
              .filter(Boolean)
            const assigneeNames = taskAssigneeProfiles
              .map((p) => p?.fullName)
              .filter(Boolean)
              .join(', ')

            return (
              <tr
                key={task.id}
                onClick={() => openTaskDetail(task.id)}
                className="cursor-pointer border-b border-border-subtle transition-colors hover:bg-surface-2"
              >
                {/* Task Code */}
                <td className="px-4 py-3">
                  <span className="font-mono text-xs font-semibold text-text-secondary">
                    {task.taskCode}
                  </span>
                </td>

                {/* Title */}
                <td className="px-4 py-3">
                  <span className="font-medium text-text-primary">{task.title}</span>
                  {task.isHighPriority && (
                    <span className="ml-2 rounded bg-red-100 px-1 py-0.5 text-[10px] font-semibold uppercase text-red-600 dark:bg-red-950 dark:text-red-400">
                      High Priority
                    </span>
                  )}
                </td>

                {/* Checklist progress */}
                <td className="px-4 py-3">
                  {total > 0 ? (
                    <span
                      className={`font-mono text-xs font-medium ${
                        completed === total ? 'text-emerald-600' : 'text-text-secondary'
                      }`}
                    >
                      {completed}/{total}
                    </span>
                  ) : (
                    <span className="text-xs text-text-tertiary">—</span>
                  )}
                </td>

                {/* Status */}
                <td className="px-4 py-3">
                  <StatusChip status={task.status} />
                </td>

                {/* Assignees */}
                <td className="px-4 py-3">
                  <span className="text-xs text-text-secondary">
                    {assigneeNames || <span className="text-text-tertiary">—</span>}
                  </span>
                </td>

                {/* Due Date */}
                <td className="px-4 py-3">
                  <span className="text-xs text-text-secondary">{formatDate(task.dueDate)}</span>
                </td>

                {/* Planned */}
                <td className="px-4 py-3">
                  <span className="text-xs text-text-secondary">
                    {formatDate(task.plannedCompletion)}
                  </span>
                </td>

                {/* Actual */}
                <td className="px-4 py-3">
                  <span className="text-xs text-text-secondary">
                    {task.actualCompletion ? formatDate(task.actualCompletion) : '—'}
                  </span>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
