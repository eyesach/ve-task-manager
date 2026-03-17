import { useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import {
  DndContext,
  DragOverlay,
  closestCorners,
  useDroppable,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { ClipboardList } from 'lucide-react'
import { useTaskStore } from '@/stores/taskStore'
import { useFilterStore } from '@/stores/filterStore'
import { usePeriodStore } from '@/stores/periodStore'
import { DEPARTMENTS, TASK_STATUSES, getDepartmentByAbbr } from '@/lib/constants'
import { TaskCard } from './TaskCard'
import type { Task, TaskStatus } from '@/lib/types'

// ─── Helpers ─────────────────────────────────────────────────────────────────

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

// ─── Column ───────────────────────────────────────────────────────────────────

interface ColumnProps {
  statusValue: TaskStatus
  label: string
  color: string
  tasks: Task[]
}

function BoardColumn({ statusValue, label, color, tasks }: ColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id: `column-${statusValue}` })

  return (
    <div className="flex min-w-[220px] flex-1 flex-col">
      {/* Column header */}
      <div className="mb-3 flex items-center gap-2 px-1">
        <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: color }} />
        <span className="text-xs font-semibold uppercase tracking-wider text-text-secondary">
          {label}
        </span>
        <span className="ml-auto rounded-full bg-surface-3 px-2 py-0.5 text-[10px] font-medium text-text-tertiary">
          {tasks.length}
        </span>
      </div>

      {/* Drop zone */}
      <div
        ref={setNodeRef}
        className={`
          flex flex-1 flex-col gap-2 rounded-lg p-2 transition-colors
          ${isOver ? 'bg-accent/8 ring-1 ring-accent/20' : 'bg-surface-1/40'}
        `}
        style={{ minHeight: '120px' }}
      >
        <SortableContext
          items={tasks.map((t) => t.id)}
          strategy={verticalListSortingStrategy}
        >
          {tasks.map((task) => (
            <TaskCard key={task.id} task={task} />
          ))}
        </SortableContext>

        {tasks.length === 0 && (
          <div className="flex flex-1 items-center justify-center py-6">
            <span className="text-xs text-text-tertiary">No tasks</span>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── TaskBoard ────────────────────────────────────────────────────────────────

interface TaskBoardProps {
  viewOverride?: string
}

export function TaskBoard({ viewOverride }: TaskBoardProps) {
  const { tasks, getTasksByDepartment, getTasksByCategory, updateTaskStatus } = useTaskStore()
  const { abbr } = useParams<{ abbr: string }>()
  const { statusFilter, priorityFilter, searchQuery } = useFilterStore()
  const { activePeriodId } = usePeriodStore()

  const [activeTaskId, setActiveTaskId] = useState<string | null>(null)

  const activeView = viewOverride ?? (abbr ? getDepartmentByAbbr(abbr)?.id ?? '' : 'dashboard')

  const filteredTasks = useMemo(() => {
    let result = getTasksForView(activeView, getTasksByDepartment, getTasksByCategory, tasks)

    result = result.filter((t) => t.taskPeriodId === activePeriodId)

    if (statusFilter) result = result.filter((t) => t.status === statusFilter)
    if (priorityFilter) result = result.filter((t) => t.priority === priorityFilter)
    // assigneeFilter wiring: left as a pass-through until assignee lookup is
    // available outside a hook context (requires refactoring store selectors)
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
    statusFilter,
    priorityFilter,
    searchQuery,
    activePeriodId,
    getTasksByDepartment,
    getTasksByCategory,
  ])

  // Group by status
  const tasksByStatus = useMemo(() => {
    const groups: Record<TaskStatus, Task[]> = {
      not_started: [],
      in_progress: [],
      in_review: [],
      completed: [],
      carried_over: [],
    }
    for (const task of filteredTasks) {
      groups[task.status].push(task)
    }
    return groups
  }, [filteredTasks])

  const activeTask = activeTaskId ? tasks.find((t) => t.id === activeTaskId) : null

  function handleDragStart(event: DragStartEvent) {
    setActiveTaskId(String(event.active.id))
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    setActiveTaskId(null)

    if (!over) return

    const overId = String(over.id)
    let targetStatus: TaskStatus | undefined

    if (overId.startsWith('column-')) {
      targetStatus = overId.replace('column-', '') as TaskStatus
    } else {
      // Dropped on another card — find that card's column
      const overTask = tasks.find((t) => t.id === overId)
      if (overTask) targetStatus = overTask.status
    }

    const currentTask = tasks.find((t) => t.id === String(active.id))
    if (targetStatus && currentTask && targetStatus !== currentTask.status) {
      updateTaskStatus(String(active.id), targetStatus)
    }
  }

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
    <DndContext
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="flex gap-4 overflow-x-auto p-4">
        {TASK_STATUSES.map((status) => (
          <BoardColumn
            key={status.value}
            statusValue={status.value}
            label={status.label}
            color={status.color}
            tasks={tasksByStatus[status.value]}
          />
        ))}
      </div>

      <DragOverlay>
        {activeTask ? (
          <div className="rotate-1 scale-105 opacity-90">
            <TaskCard task={activeTask} />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  )
}
