import { useState } from 'react'
import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isToday,
  format,
  addMonths,
  subMonths,
} from 'date-fns'
import { ChevronLeft, ChevronRight, Plus, Calendar as CalendarIcon } from 'lucide-react'
import { useCalendarStore } from '@/stores/calendarStore'
import { useTaskStore } from '@/stores/taskStore'
import { useUIStore } from '@/stores/uiStore'
import { getDepartmentById, EVENT_TYPES } from '@/lib/constants'
import { EventCreateModal } from '@/components/calendar/EventCreateModal'
import { usePermissions } from '@/hooks/usePermissions'
import type { CalendarEvent } from '@/lib/types'
import type { Task } from '@/lib/types'

const DAY_HEADERS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

function getEventTypeConfig(eventType: CalendarEvent['eventType']) {
  return EVENT_TYPES.find((t) => t.value === eventType) ?? EVENT_TYPES[0]!
}

interface DayEvents {
  events: CalendarEvent[]
  tasks: Task[]
}

export function CalendarView() {
  const [currentMonth, setCurrentMonth] = useState(() => new Date(2026, 2, 1)) // March 2026
  const [selectedDay, setSelectedDay] = useState<string | null>(null)
  const [showCreateModal, setShowCreateModal] = useState(false)

  const { canCreateCalendarEvent } = usePermissions()
  const getEventsForDate = useCalendarStore((s) => s.getEventsForDate)
  const allTasks = useTaskStore((s) => s.tasks)
  const openTaskDetail = useUIStore((s) => s.openTaskDetail)

  // Build calendar grid days
  const monthStart = startOfMonth(currentMonth)
  const monthEnd = endOfMonth(currentMonth)
  const gridStart = startOfWeek(monthStart)
  const gridEnd = endOfWeek(monthEnd)
  const gridDays = eachDayOfInterval({ start: gridStart, end: gridEnd })

  function getDayData(date: Date): DayEvents {
    const dateStr = format(date, 'yyyy-MM-dd')
    const events = getEventsForDate(dateStr)
    const tasks = allTasks.filter((t) => t.dueDate === dateStr)
    return { events, tasks }
  }

  function handleDayClick(date: Date) {
    const dateStr = format(date, 'yyyy-MM-dd')
    setSelectedDay((prev) => (prev === dateStr ? null : dateStr))
  }

  const selectedDayEvents = selectedDay ? getEventsForDate(selectedDay) : []
  const selectedDayTasks = selectedDay ? allTasks.filter((t) => t.dueDate === selectedDay) : []

  return (
    <div className="flex h-full min-h-0 flex-col">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border-subtle px-6 py-4">
        <div className="flex items-center gap-3">
          <CalendarIcon className="h-5 w-5 text-text-tertiary" />
          <h1 className="text-base font-semibold text-text-primary">Calendar</h1>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setCurrentMonth((m) => subMonths(m, 1))}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-text-secondary hover:bg-surface-3"
            aria-label="Previous month"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className="min-w-[120px] text-center text-sm font-semibold text-text-primary">
            {format(currentMonth, 'MMMM yyyy')}
          </span>
          <button
            onClick={() => setCurrentMonth((m) => addMonths(m, 1))}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-text-secondary hover:bg-surface-3"
            aria-label="Next month"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
          <button
            onClick={() => setCurrentMonth(new Date())}
            className="ml-1 rounded-lg border border-border-subtle px-3 py-1.5 text-xs font-medium text-text-secondary hover:bg-surface-3"
          >
            Today
          </button>
          {canCreateCalendarEvent && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-1.5 rounded-lg bg-accent px-3 py-1.5 text-xs font-medium text-white hover:bg-accent-hover"
            >
              <Plus className="h-3.5 w-3.5" />
              Add Event
            </button>
          )}
        </div>
      </div>

      {/* Main content: grid + optional side panel */}
      <div className="flex min-h-0 flex-1 overflow-hidden">
        {/* Calendar grid */}
        <div className="flex flex-1 flex-col overflow-auto p-4">
          {/* Day-of-week headers */}
          <div className="mb-1 grid grid-cols-7 gap-1">
            {DAY_HEADERS.map((d) => (
              <div key={d} className="py-1 text-center text-xs font-medium text-text-tertiary">
                {d}
              </div>
            ))}
          </div>

          {/* Grid rows */}
          <div className="grid flex-1 grid-cols-7 gap-1">
            {gridDays.map((date) => {
              const dateStr = format(date, 'yyyy-MM-dd')
              const inMonth = isSameMonth(date, currentMonth)
              const today = isToday(date)
              const isSelected = selectedDay === dateStr
              const { events, tasks } = getDayData(date)
              const totalPills = events.length + tasks.length
              const visibleEvents = events.slice(0, 3)
              const visibleTasks = tasks.slice(0, Math.max(0, 3 - visibleEvents.length))
              const overflow = totalPills - visibleEvents.length - visibleTasks.length

              return (
                <button
                  key={dateStr}
                  onClick={() => handleDayClick(date)}
                  className={[
                    'flex min-h-[80px] flex-col rounded-lg border p-1.5 text-left transition-colors',
                    inMonth ? 'bg-surface-1' : 'bg-surface-2 opacity-50',
                    today
                      ? 'border-accent ring-1 ring-accent'
                      : isSelected
                        ? 'border-border-strong'
                        : 'border-border-subtle hover:border-border-strong',
                    isSelected ? 'bg-surface-3' : '',
                  ]
                    .filter(Boolean)
                    .join(' ')}
                >
                  {/* Day number */}
                  <span
                    className={[
                      'mb-1 inline-flex h-5 w-5 items-center justify-center rounded-full text-xs font-medium',
                      today
                        ? 'bg-accent text-white'
                        : inMonth
                          ? 'text-text-primary'
                          : 'text-text-tertiary',
                    ].join(' ')}
                  >
                    {format(date, 'd')}
                  </span>

                  {/* Event pills */}
                  <div className="flex flex-col gap-0.5">
                    {visibleEvents.map((event) => {
                      const cfg = getEventTypeConfig(event.eventType)
                      return (
                        <span
                          key={event.id}
                          className="truncate rounded px-1 py-0.5 text-[10px] font-medium text-white"
                          style={{ backgroundColor: cfg.color }}
                          title={event.title}
                        >
                          {event.title}
                        </span>
                      )
                    })}

                    {/* Task due date pills */}
                    {visibleTasks.map((task) => {
                      const dept = task.departmentId ? getDepartmentById(task.departmentId) : null
                      return (
                        <span
                          key={task.id}
                          className="flex items-center gap-1 truncate rounded bg-surface-3 px-1 py-0.5 text-[10px] font-medium text-text-secondary"
                          title={task.title}
                        >
                          {dept && (
                            <span
                              className="inline-block h-1.5 w-1.5 shrink-0 rounded-full"
                              style={{ backgroundColor: dept.color }}
                            />
                          )}
                          <span className="truncate">{task.taskCode}</span>
                        </span>
                      )
                    })}

                    {overflow > 0 && (
                      <span className="text-[10px] text-text-tertiary">+{overflow} more</span>
                    )}
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        {/* Side panel */}
        {selectedDay && (
          <aside className="w-72 shrink-0 overflow-y-auto border-l border-border-subtle bg-surface-1 p-4">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-text-primary">
                {format(new Date(selectedDay + 'T00:00:00'), 'EEEE, MMMM d')}
              </h2>
              <button
                onClick={() => setSelectedDay(null)}
                className="text-xs text-text-tertiary hover:text-text-secondary"
                aria-label="Close day panel"
              >
                ✕
              </button>
            </div>

            {selectedDayEvents.length === 0 && selectedDayTasks.length === 0 && (
              <p className="text-xs text-text-tertiary">Nothing scheduled.</p>
            )}

            {/* Events section */}
            {selectedDayEvents.length > 0 && (
              <section className="mb-4">
                <h3 className="mb-2 text-xs font-medium uppercase tracking-wide text-text-tertiary">
                  Events
                </h3>
                <ul className="flex flex-col gap-2">
                  {selectedDayEvents.map((event) => {
                    const cfg = getEventTypeConfig(event.eventType)
                    return (
                      <li key={event.id} className="rounded-lg border border-border-subtle bg-surface-2 p-3">
                        <div className="mb-1 flex items-center gap-2">
                          <span
                            className="rounded px-1.5 py-0.5 text-[10px] font-semibold text-white"
                            style={{ backgroundColor: cfg.color }}
                          >
                            {cfg.label}
                          </span>
                        </div>
                        <p className="text-xs font-medium text-text-primary">{event.title}</p>
                        {event.description && (
                          <p className="mt-1 text-xs text-text-secondary">{event.description}</p>
                        )}
                        {event.endDate && event.endDate !== event.startDate && (
                          <p className="mt-1 text-[10px] text-text-tertiary">
                            Through {format(new Date(event.endDate + 'T00:00:00'), 'MMM d')}
                          </p>
                        )}
                      </li>
                    )
                  })}
                </ul>
              </section>
            )}

            {/* Tasks section */}
            {selectedDayTasks.length > 0 && (
              <section>
                <h3 className="mb-2 text-xs font-medium uppercase tracking-wide text-text-tertiary">
                  Tasks Due
                </h3>
                <ul className="flex flex-col gap-2">
                  {selectedDayTasks.map((task) => {
                    const dept = task.departmentId ? getDepartmentById(task.departmentId) : null
                    return (
                      <li key={task.id}>
                        <button
                          onClick={() => openTaskDetail(task.id)}
                          className="w-full rounded-lg border border-border-subtle bg-surface-2 p-3 text-left hover:border-border-strong hover:bg-surface-3"
                        >
                          <div className="mb-1 flex items-center gap-2">
                            {dept && (
                              <span
                                className="rounded px-1.5 py-0.5 text-[10px] font-semibold text-white"
                                style={{ backgroundColor: dept.color }}
                              >
                                {dept.abbreviation}
                              </span>
                            )}
                            <span className="font-mono text-[10px] text-text-tertiary">
                              {task.taskCode}
                            </span>
                          </div>
                          <p className="text-xs font-medium text-text-primary">{task.title}</p>
                        </button>
                      </li>
                    )
                  })}
                </ul>
              </section>
            )}

            {canCreateCalendarEvent && (
              <button
                onClick={() => setShowCreateModal(true)}
                className="mt-4 flex w-full items-center justify-center gap-1.5 rounded-lg border border-dashed border-border-subtle py-2 text-xs text-text-tertiary hover:border-border-strong hover:text-text-secondary"
              >
                <Plus className="h-3 w-3" />
                Add event on this day
              </button>
            )}
          </aside>
        )}
      </div>

      <EventCreateModal
        open={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        defaultDate={selectedDay ?? undefined}
      />
    </div>
  )
}
