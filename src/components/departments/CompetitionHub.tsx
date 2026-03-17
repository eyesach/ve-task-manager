import { differenceInCalendarDays, format, isPast } from 'date-fns'
import { CalendarDays, Clock, Trophy } from 'lucide-react'
import { useTaskStore } from '@/stores/taskStore'
import { useCalendarStore } from '@/stores/calendarStore'
import { useUIStore } from '@/stores/uiStore'
import { StatusChip } from '@/components/common/StatusChip'
import { ProgressBar } from '@/components/common/ProgressBar'
import type { CalendarEvent, Task } from '@/lib/types'

interface CountdownBadgeProps {
  startDate: string
}

function CountdownBadge({ startDate }: CountdownBadgeProps) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const eventDate = new Date(startDate)
  eventDate.setHours(0, 0, 0, 0)

  const daysLeft = differenceInCalendarDays(eventDate, today)
  const past = isPast(eventDate) && daysLeft < 0

  if (past) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium bg-surface-4 text-text-tertiary">
        <Clock className="h-3 w-3" />
        Past event
      </span>
    )
  }

  if (daysLeft === 0) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold bg-red-500/10 text-red-500">
        <Clock className="h-3 w-3" />
        Today!
      </span>
    )
  }

  const color = daysLeft <= 7 ? '#EF4444' : daysLeft <= 14 ? '#F59E0B' : '#10B981'

  return (
    <span
      className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold"
      style={{ backgroundColor: `${color}18`, color }}
    >
      <Clock className="h-3 w-3" />
      {daysLeft} day{daysLeft !== 1 ? 's' : ''} away
    </span>
  )
}

interface CompetitionGroupProps {
  event: CalendarEvent
  tasks: Task[]
}

function CompetitionGroup({ event, tasks }: CompetitionGroupProps) {
  const openTaskDetail = useUIStore((s) => s.openTaskDetail)
  const getChecklistProgress = useTaskStore((s) => s.getChecklistProgress)

  // Aggregate checklist progress across all tasks in this group
  let totalChecklistCompleted = 0
  let totalChecklistItems = 0
  for (const task of tasks) {
    const p = getChecklistProgress(task.id)
    totalChecklistCompleted += p.completed
    totalChecklistItems += p.total
  }

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
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium bg-purple-500/10 text-purple-500">
                <Trophy className="h-3 w-3" />
                Competition
              </span>
              <CountdownBadge startDate={event.startDate} />
            </div>
            <h2 className="text-base font-semibold text-text-primary">{event.title}</h2>
            {event.description && (
              <p className="text-xs text-text-secondary">{event.description}</p>
            )}
          </div>

          <div className="flex flex-col items-end gap-2 shrink-0">
            <div className="flex items-center gap-1.5 text-xs text-text-secondary">
              <CalendarDays className="h-3.5 w-3.5" />
              {dateLabel}
            </div>

            {/* Overall task completion */}
            {tasks.length > 0 && (
              <div className="flex flex-col items-end gap-1">
                <div className="flex items-center gap-2">
                  <div className="h-1.5 w-28 overflow-hidden rounded-full bg-surface-4">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${overallPct}%`,
                        backgroundColor: overallPct === 100 ? '#10B981' : '#8B5CF6',
                      }}
                    />
                  </div>
                  <span className="font-mono text-[11px] text-text-tertiary tabular-nums">
                    {overallPct}%
                  </span>
                </div>

                {totalChecklistItems > 0 && (
                  <span className="text-[11px] text-text-tertiary">
                    {totalChecklistCompleted}/{totalChecklistItems} checklist items
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Tasks */}
      {tasks.length === 0 ? (
        <div className="px-5 py-6 text-sm text-text-tertiary italic">
          No tasks linked to this competition.
        </div>
      ) : (
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
                  {task.isHighPriority && (
                    <span className="rounded px-1.5 py-0.5 text-[10px] font-semibold bg-red-500/10 text-red-500 uppercase tracking-wide">
                      High Priority
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
        <h2 className="text-sm font-semibold text-text-secondary">Other Competition Tasks</h2>
        <p className="mt-0.5 text-xs text-text-tertiary">Not linked to a specific competition event</p>
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

export function CompetitionHub() {
  const allTasks = useTaskStore((s) => s.getTasksByCategory('competition'))
  const events = useCalendarStore((s) => s.events).filter((e) => e.eventType === 'competition')

  const linkedTaskIds = new Set<string>()

  const groupedEvents = events.map((event) => {
    // Direct link via event.relatedTaskId
    const directTasks = allTasks.filter((t) => t.id === event.relatedTaskId)

    // Tasks with due dates within the event window
    const windowTasks = allTasks.filter((t) => {
      if (directTasks.some((dt) => dt.id === t.id)) return false
      if (!t.dueDate) return false
      const due = new Date(t.dueDate)
      const start = new Date(event.startDate)
      const end = event.endDate ? new Date(event.endDate) : start
      return due >= start && due <= end
    })

    const tasks = [...directTasks, ...windowTasks]
    tasks.forEach((t) => linkedTaskIds.add(t.id))
    return { event, tasks }
  })

  const unlinkedTasks = allTasks.filter((t) => !linkedTaskIds.has(t.id))

  const totalTasks = allTasks.length
  const completedCount = allTasks.filter((t) => t.status === 'completed').length
  const upcomingEvents = events.filter((e) => {
    const d = differenceInCalendarDays(new Date(e.startDate), new Date())
    return d >= 0
  }).length

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-semibold text-text-primary">Competition Hub</h1>
        <p className="mt-0.5 text-sm text-text-secondary">
          Competition preparation tasks with countdown to submission deadlines.
        </p>
      </div>

      {/* Summary stats */}
      <div className="flex gap-4">
        <div className="rounded-lg border border-border-subtle bg-surface-1 px-4 py-3 text-center">
          <p className="text-2xl font-semibold text-text-primary">{events.length}</p>
          <p className="text-xs text-text-tertiary">Competitions</p>
        </div>
        <div className="rounded-lg border border-border-subtle bg-surface-1 px-4 py-3 text-center">
          <p className="text-2xl font-semibold" style={{ color: '#8B5CF6' }}>{upcomingEvents}</p>
          <p className="text-xs text-text-tertiary">Upcoming</p>
        </div>
        <div className="rounded-lg border border-border-subtle bg-surface-1 px-4 py-3 text-center">
          <p className="text-2xl font-semibold text-text-primary">{totalTasks}</p>
          <p className="text-xs text-text-tertiary">Total Tasks</p>
        </div>
        <div className="rounded-lg border border-border-subtle bg-surface-1 px-4 py-3 text-center">
          <p className="text-2xl font-semibold" style={{ color: '#10B981' }}>{completedCount}</p>
          <p className="text-xs text-text-tertiary">Completed</p>
        </div>
      </div>

      {/* Competition groups */}
      {groupedEvents.length === 0 && allTasks.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-text-tertiary">
          <p className="text-sm">No competition events or tasks found.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {groupedEvents
            .sort((a, b) => a.event.startDate.localeCompare(b.event.startDate))
            .map(({ event, tasks }) => (
              <CompetitionGroup key={event.id} event={event} tasks={tasks} />
            ))}
          <UnlinkedTasks tasks={unlinkedTasks} />
        </div>
      )}
    </div>
  )
}
