import { useMemo } from 'react'
import { useParams } from 'react-router-dom'
import { ClipboardList } from 'lucide-react'
import { useTaskStore } from '@/stores/taskStore'
import { useFilterStore } from '@/stores/filterStore'
import { DEPARTMENTS, getDepartmentByAbbr } from '@/lib/constants'
import { TaskRow } from './TaskRow'
import type { Task } from '@/lib/types'

interface TaskListProps {
  viewOverride?: string
}

function getTasksForView(
  activeView: string,
  getTasksByDepartment: (id: string) => Task[],
  getTasksByCategory: (cat: string) => Task[],
  allTasks: Task[]
): Task[] {
  // Department view
  const dept = DEPARTMENTS.find((d) => d.id === activeView)
  if (dept) return getTasksByDepartment(dept.id)

  // Special category views
  if (activeView === 'inter_department') return getTasksByCategory('inter_department')
  if (activeView === 'trade_show') return getTasksByCategory('trade_show')
  if (activeView === 'competition') return getTasksByCategory('competition')

  // Dashboard — show all
  if (activeView === 'dashboard') return allTasks

  return []
}

export function TaskList({ viewOverride }: TaskListProps) {
  const { tasks, getTasksByDepartment, getTasksByCategory } = useTaskStore()
  const { abbr } = useParams<{ abbr: string }>()
  const { statusFilter, priorityFilter, searchQuery } = useFilterStore()

  const activeView = viewOverride ?? (abbr ? getDepartmentByAbbr(abbr)?.id ?? '' : 'dashboard')

  const filteredTasks = useMemo(() => {
    let result = getTasksForView(activeView, getTasksByDepartment, getTasksByCategory, tasks)

    if (statusFilter) {
      result = result.filter((t) => t.status === statusFilter)
    }
    if (priorityFilter) {
      result = result.filter((t) => t.priority === priorityFilter)
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
  }, [activeView, tasks, statusFilter, priorityFilter, searchQuery, getTasksByDepartment, getTasksByCategory])

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
    <div className="flex flex-col">
      {/* Column headers */}
      <div className="flex items-center gap-4 border-b border-border-default bg-surface-1/50 px-5 py-2">
        <span className="w-20 shrink-0 text-[10px] font-medium uppercase tracking-wider text-text-tertiary">
          Code
        </span>
        <span className="min-w-0 flex-1 text-[10px] font-medium uppercase tracking-wider text-text-tertiary">
          Title
        </span>
        <span className="w-24 shrink-0 text-[10px] font-medium uppercase tracking-wider text-text-tertiary">
          Assignees
        </span>
        <span className="w-28 shrink-0 text-[10px] font-medium uppercase tracking-wider text-text-tertiary">
          Status
        </span>
        <span className="w-28 shrink-0 text-[10px] font-medium uppercase tracking-wider text-text-tertiary">
          Due Date
        </span>
        <span className="w-24 shrink-0 text-[10px] font-medium uppercase tracking-wider text-text-tertiary">
          Checklist
        </span>
      </div>

      {/* Task rows */}
      {filteredTasks.map((task) => (
        <TaskRow key={task.id} task={task} />
      ))}
    </div>
  )
}
