import { useState } from 'react'
import { Search, List, LayoutGrid, Plus, Table2, Menu } from 'lucide-react'
import { useLocation } from 'react-router-dom'
import { useUIStore } from '@/stores/uiStore'
import { useFilterStore } from '@/stores/filterStore'
import { useTaskStore } from '@/stores/taskStore'
import { usePeriodStore } from '@/stores/periodStore'
import { DEPARTMENTS, TASK_STATUSES, TASK_PRIORITIES } from '@/lib/constants'
import type { TaskStatus, TaskPriority } from '@/lib/types'
import { TaskCreateModal } from '@/components/tasks/TaskCreateModal'
import { ShortcutsOverlay } from '@/components/common/ShortcutsOverlay'
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts'
import { usePermissions } from '@/hooks/usePermissions'

/** Routes where task filters, period, search, and new-task button should show */
const TASK_ROUTES = new Set(['/inter-department', '/trade-shows', '/competitions'])

function useViewContext() {
  const { pathname } = useLocation()

  // Parse department abbreviation from URL since TopBar is outside <Routes>
  const deptMatch = pathname.match(/^\/department\/([A-Za-z]+)$/)
  const abbr = deptMatch?.[1]

  let title = 'Tasks'
  let subtitle: string | undefined
  let color: string | undefined
  let departmentId: string | undefined
  let isTaskPage = false
  let hasViewToggle = false

  if (abbr) {
    const dept = DEPARTMENTS.find((d) => d.abbreviation === abbr)
    if (dept) {
      title = dept.name
      subtitle = dept.abbreviation
      color = dept.color
      departmentId = dept.id
      isTaskPage = true
      hasViewToggle = true // only department pages use list/board/log
    }
  } else if (TASK_ROUTES.has(pathname)) {
    isTaskPage = true
    hasViewToggle = false // these have custom views, toggle does nothing
    const routeTitles: Record<string, string> = {
      '/inter-department': 'Inter-Department',
      '/trade-shows': 'Trade Shows',
      '/competitions': 'Competitions',
    }
    title = routeTitles[pathname] ?? 'Tasks'
  } else {
    const routeTitles: Record<string, string> = {
      '/': 'Dashboard',
      '/calendar': 'Calendar',
      '/print-requests': 'Print Requests',
      '/settings': 'Settings',
    }
    title = routeTitles[pathname] ?? 'Tasks'
  }

  return { title, subtitle, color, departmentId, isTaskPage, hasViewToggle }
}

export function TopBar({ onMenuToggle }: { onMenuToggle?: () => void }) {
  const { viewMode, setViewMode } = useUIStore()
  const {
    statusFilter,
    priorityFilter,
    assigneeFilter,
    setStatusFilter,
    setPriorityFilter,
    setAssigneeFilter,
    searchQuery,
    setSearchQuery,
  } = useFilterStore()
  const { profiles } = useTaskStore()
  const { periods, activePeriodId, setActivePeriod } = usePeriodStore()
  const { title, subtitle, color, departmentId, isTaskPage, hasViewToggle } = useViewContext()
  const { canCreateTask } = usePermissions()
  const showNewTaskButton = canCreateTask(departmentId)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showShortcuts, setShowShortcuts] = useState(false)

  useKeyboardShortcuts({
    onHelp: () => setShowShortcuts(true),
    onNewTask: showNewTaskButton ? () => setShowCreateModal(true) : undefined,
  })

  return (
    <>
    <header className="shrink-0 border-b border-border-subtle bg-surface-1">
      {/* Row 1: Title + New button + period selector + view toggle */}
      <div className="flex h-12 items-center gap-3 px-4 sm:px-6">
        {onMenuToggle && (
          <button
            onClick={onMenuToggle}
            className="mr-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-text-secondary hover:bg-surface-3 md:hidden"
            aria-label="Open menu"
          >
            <Menu size={18} />
          </button>
        )}
        {color && (
          <span className="h-3 w-3 shrink-0 rounded-full" style={{ backgroundColor: color }} />
        )}
        <h2 className="truncate text-base font-semibold text-text-primary">{title}</h2>
        {subtitle && (
          <span className="shrink-0 rounded bg-surface-4 px-1.5 py-0.5 font-mono text-[11px] font-medium text-text-tertiary">
            {subtitle}
          </span>
        )}

        {isTaskPage && (
          <div className="ml-auto flex shrink-0 items-center gap-2">
            {/* New Task button */}
            {showNewTaskButton && (
              <button
                onClick={() => setShowCreateModal(true)}
                className="flex shrink-0 items-center gap-1.5 rounded-lg bg-accent px-3 py-1.5 text-xs font-medium text-white hover:bg-accent-hover"
              >
                <Plus size={14} />
                <span>New</span>
              </button>
            )}

            {/* Period selector */}
            <div className="h-5 w-px shrink-0 bg-border-subtle" />
            <select
              value={activePeriodId}
              onChange={(e) => setActivePeriod(e.target.value)}
              className="h-8 rounded-md border border-border-subtle bg-surface-2 px-2 text-xs font-medium text-text-primary outline-none transition-colors focus:border-border-strong"
            >
              {periods.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>

            {/* View mode toggle — only on department pages */}
            {hasViewToggle && (
              <>
                <div className="h-5 w-px shrink-0 bg-border-subtle" />
                <div className="flex rounded-md border border-border-subtle">
                  <button
                    onClick={() => setViewMode('list')}
                    title="List view"
                    className={`flex h-7 w-8 items-center justify-center transition-colors ${
                      viewMode === 'list'
                        ? 'bg-surface-3 text-text-primary'
                        : 'text-text-tertiary hover:text-text-secondary'
                    }`}
                  >
                    <List size={14} />
                  </button>
                  <button
                    onClick={() => setViewMode('board')}
                    title="Board view"
                    className={`flex h-7 w-8 items-center justify-center border-l border-border-subtle transition-colors ${
                      viewMode === 'board'
                        ? 'bg-surface-3 text-text-primary'
                        : 'text-text-tertiary hover:text-text-secondary'
                    }`}
                  >
                    <LayoutGrid size={14} />
                  </button>
                  <button
                    onClick={() => setViewMode('log')}
                    title="Log view"
                    className={`flex h-7 w-8 items-center justify-center border-l border-border-subtle transition-colors ${
                      viewMode === 'log'
                        ? 'bg-surface-3 text-text-primary'
                        : 'text-text-tertiary hover:text-text-secondary'
                    }`}
                  >
                    <Table2 size={14} />
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* Row 2: Filters + search (only on task pages) */}
      {isTaskPage && (
        <div className="flex h-10 items-center gap-2 border-t border-border-subtle px-4 sm:px-6">
          {/* Status filter */}
          <select
            value={statusFilter ?? ''}
            onChange={(e) => setStatusFilter((e.target.value || null) as TaskStatus | null)}
            className="h-7 rounded-md border border-border-subtle bg-surface-2 px-2 text-xs text-text-secondary outline-none transition-colors focus:border-border-strong"
          >
            <option value="">All Statuses</option>
            {TASK_STATUSES.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>

          {/* Priority filter */}
          <select
            value={priorityFilter ?? ''}
            onChange={(e) => setPriorityFilter((e.target.value || null) as TaskPriority | null)}
            className="h-7 rounded-md border border-border-subtle bg-surface-2 px-2 text-xs text-text-secondary outline-none transition-colors focus:border-border-strong"
          >
            <option value="">All Priorities</option>
            {TASK_PRIORITIES.map((p) => (
              <option key={p.value} value={p.value}>
                {p.label}
              </option>
            ))}
          </select>

          {/* Assignee filter */}
          <select
            value={assigneeFilter ?? ''}
            onChange={(e) => setAssigneeFilter(e.target.value || null)}
            className="h-7 rounded-md border border-border-subtle bg-surface-2 px-2 text-xs text-text-secondary outline-none transition-colors focus:border-border-strong"
          >
            <option value="">All Assignees</option>
            {profiles.map((p) => (
              <option key={p.id} value={p.id}>
                {p.fullName}
              </option>
            ))}
          </select>

          {/* Search — pushed right */}
          <div className="relative ml-auto">
            <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-text-tertiary" />
            <input
              type="text"
              placeholder="Search tasks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-7 w-40 rounded-md border border-border-subtle bg-surface-2 pl-8 pr-3 text-xs text-text-primary outline-none placeholder:text-text-tertiary focus:border-border-strong"
            />
          </div>
        </div>
      )}
    </header>
    <TaskCreateModal open={showCreateModal} onClose={() => setShowCreateModal(false)} />
    <ShortcutsOverlay open={showShortcuts} onClose={() => setShowShortcuts(false)} />
    </>
  )
}
