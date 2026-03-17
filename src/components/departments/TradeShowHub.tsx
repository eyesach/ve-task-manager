import { format } from 'date-fns'
import { CalendarDays, ExternalLink } from 'lucide-react'
import { useTaskStore } from '@/stores/taskStore'
import { useCalendarStore } from '@/stores/calendarStore'
import { useUIStore } from '@/stores/uiStore'
import { getDepartmentById } from '@/lib/constants'
import { StatusChip } from '@/components/common/StatusChip'
import { ProgressBar } from '@/components/common/ProgressBar'
import type { CalendarEvent, Task } from '@/lib/types'

interface TradeShowGroupProps {
  event: CalendarEvent
  tasks: Task[]
}

function TradeShowGroup({ event, tasks }: TradeShowGroupProps) {
  const openTaskDetail = useUIStore((s) => s.openTaskDetail)
  const getChecklistProgress = useTaskStore((s) => s.getChecklistProgress)

  const completedTasks = tasks.filter((t) => t.status === 'completed').length
  const overallPct = tasks.length > 0 ? Math.round((completedTasks / tasks.length) * 100) : 0

  const dateLabel = event.endDate
    ? `${format(new Date(event.startDate), 'MMM d')}–${format(new Date(event.endDate), 'MMM d, yyyy')}`
    : format(new Date(event.startDate), 'MMM d, yyyy')

  return (
    <div className="overflow-hidden rounded-xl border border-border-subtle bg-surface-1">
      {/* Event header */}
      <div className="border-b border-border-subtle bg-surface-2 px-5 py-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium bg-amber-500/10 text-amber-500">
                <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                Trade Show
              </span>
            </div>
            <h2 className="text-base font-semibold text-text-primary">{event.title}</h2>
            {event.description && (
              <p className="text-xs text-text-secondary">{event.description}</p>
            )}
          </div>

          <div className="flex flex-col items-end gap-1 shrink-0">
            <div className="flex items-center gap-1.5 text-xs text-text-secondary">
              <CalendarDays className="h-3.5 w-3.5" />
              {dateLabel}
            </div>
            {tasks.length > 0 && (
              <div className="flex items-center gap-2">
                <div className="h-1.5 w-24 overflow-hidden rounded-full bg-surface-4">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${overallPct}%`, backgroundColor: '#F59E0B' }}
                  />
                </div>
                <span className="font-mono text-[11px] text-text-tertiary">
                  {completedTasks}/{tasks.length} tasks
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Tasks */}
      {tasks.length === 0 ? (
        <div className="px-5 py-6 text-sm text-text-tertiary italic">
          No tasks linked to this event.
        </div>
      ) : (
        <div className="divide-y divide-border-subtle">
          {tasks.map((task) => {
            const progress = getChecklistProgress(task.id)
            const dept = task.departmentId ? getDepartmentById(task.departmentId) : null

            return (
              <div key={task.id} className="flex items-center gap-3 px-5 py-3">
                <span className="font-mono text-xs font-semibold text-text-tertiary w-16 shrink-0">
                  {task.taskCode}
                </span>

                <button
                  className="flex-1 text-left text-sm font-medium text-text-primary hover:text-accent transition-colors"
                  onClick={() => openTaskDetail(task.id)}
                >
                  <span className="flex items-center gap-1.5">
                    {task.title}
                    <ExternalLink className="h-3 w-3 text-text-tertiary opacity-0 group-hover:opacity-100" />
                  </span>
                </button>

                <div className="flex items-center gap-3 shrink-0">
                  {dept && (
                    <span
                      className="rounded px-1.5 py-0.5 text-[11px] font-medium"
                      style={{ color: dept.color, backgroundColor: `${dept.color}18` }}
                    >
                      {dept.abbreviation}
                    </span>
                  )}
                  <StatusChip status={task.status} />
                  {progress.total > 0 && (
                    <ProgressBar completed={progress.completed} total={progress.total} />
                  )}
                  {task.dueDate && (
                    <span className="text-xs text-text-tertiary tabular-nums">
                      Due {format(new Date(task.dueDate), 'MMM d')}
                    </span>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

function UnlinkedTasks({ tasks }: { tasks: Task[] }) {
  const openTaskDetail = useUIStore((s) => s.openTaskDetail)
  const getChecklistProgress = useTaskStore((s) => s.getChecklistProgress)

  if (tasks.length === 0) return null

  return (
    <div className="overflow-hidden rounded-xl border border-border-subtle bg-surface-1">
      <div className="border-b border-border-subtle bg-surface-2 px-5 py-4">
        <h2 className="text-sm font-semibold text-text-secondary">Other Trade Show Tasks</h2>
        <p className="mt-0.5 text-xs text-text-tertiary">Not linked to a specific event</p>
      </div>
      <div className="divide-y divide-border-subtle">
        {tasks.map((task) => {
          const progress = getChecklistProgress(task.id)
          return (
            <div key={task.id} className="flex items-center gap-3 px-5 py-3">
              <span className="font-mono text-xs font-semibold text-text-tertiary w-16 shrink-0">
                {task.taskCode}
              </span>
              <button
                className="flex-1 text-left text-sm font-medium text-text-primary hover:text-accent transition-colors"
                onClick={() => openTaskDetail(task.id)}
              >
                {task.title}
              </button>
              <div className="flex items-center gap-3 shrink-0">
                <StatusChip status={task.status} />
                {progress.total > 0 && (
                  <ProgressBar completed={progress.completed} total={progress.total} />
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export function TradeShowHub() {
  const allTasks = useTaskStore((s) => s.getTasksByCategory('trade_show'))
  const events = useCalendarStore((s) => s.events).filter((e) => e.eventType === 'trade_show')

  // Group tasks by event (via relatedTaskId on the event, or task IDs linked from event)
  const linkedTaskIds = new Set<string>()

  const groupedEvents = events.map((event) => {
    const eventTasks = allTasks.filter((t) => {
      // Match if event.relatedTaskId points to this task,
      // or if the task's ID is referenced by the event
      return t.id === event.relatedTaskId
    })
    // Also include tasks that have no explicit link but fall within the event window
    const windowTasks = allTasks.filter((t) => {
      if (eventTasks.some((et) => et.id === t.id)) return false
      if (!t.dueDate) return false
      const due = new Date(t.dueDate)
      const start = new Date(event.startDate)
      const end = event.endDate ? new Date(event.endDate) : start
      return due >= start && due <= end
    })
    const tasks = [...eventTasks, ...windowTasks]
    tasks.forEach((t) => linkedTaskIds.add(t.id))
    return { event, tasks }
  })

  const unlinkedTasks = allTasks.filter((t) => !linkedTaskIds.has(t.id))

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-semibold text-text-primary">Trade Show Hub</h1>
        <p className="mt-0.5 text-sm text-text-secondary">
          All trade show preparation tasks grouped by event.
        </p>
      </div>

      {/* Summary */}
      <div className="flex gap-4">
        <div className="rounded-lg border border-border-subtle bg-surface-1 px-4 py-3 text-center">
          <p className="text-2xl font-semibold text-text-primary">{events.length}</p>
          <p className="text-xs text-text-tertiary">Events</p>
        </div>
        <div className="rounded-lg border border-border-subtle bg-surface-1 px-4 py-3 text-center">
          <p className="text-2xl font-semibold text-text-primary">{allTasks.length}</p>
          <p className="text-xs text-text-tertiary">Total Tasks</p>
        </div>
        <div className="rounded-lg border border-border-subtle bg-surface-1 px-4 py-3 text-center">
          <p className="text-2xl font-semibold" style={{ color: '#10B981' }}>
            {allTasks.filter((t) => t.status === 'completed').length}
          </p>
          <p className="text-xs text-text-tertiary">Completed</p>
        </div>
      </div>

      {/* Event groups */}
      {groupedEvents.length === 0 && allTasks.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-text-tertiary">
          <p className="text-sm">No trade show events or tasks found.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {groupedEvents
            .sort((a, b) => a.event.startDate.localeCompare(b.event.startDate))
            .map(({ event, tasks }) => (
              <TradeShowGroup key={event.id} event={event} tasks={tasks} />
            ))}
          <UnlinkedTasks tasks={unlinkedTasks} />
        </div>
      )}
    </div>
  )
}
