import { useState } from 'react'
import { Search, List, LayoutGrid, Plus, Table2, Menu } from 'lucide-react'
import { useLocation, useParams } from 'react-router-dom'
import { useUIStore } from '@/stores/uiStore'
import { useFilterStore } from '@/stores/filterStore'
import { useTaskStore } from '@/stores/taskStore'
import { usePeriodStore } from '@/stores/periodStore'
import { DEPARTMENTS, TASK_STATUSES, TASK_PRIORITIES } from '@/lib/constants'
import type { TaskStatus, TaskPriority } from '@/lib/types'
import { TaskCreateModal } from '@/components/tasks/TaskCreateModal'
import { ShortcutsOverlay } from '@/components/common/ShortcutsOverlay'
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts'

function useViewTitle(): { title: string; subtitle?: string; color?: string } {
  const { pathname } = useLocation()
  const { abbr } = useParams<{ abbr: string }>()

  if (abbr) {
    const dept = DEPARTMENTS.find((d) => d.abbreviation === abbr)
    if (dept) return { title: dept.name, subtitle: dept.abbreviation, color: dept.color }
  }

  const routeTitles: Record<string, string> = {
    '/': 'Dashboard',
    '/inter-department': 'Inter-Department Tasks',
    '/trade-shows': 'Trade Shows',
    '/competitions': 'Competitions',
    '/calendar': 'Calendar',
    '/print-requests': 'Print Requests',
    '/settings': 'Settings',
  }
  return { title: routeTitles[pathname] ?? 'Tasks' }
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
  const { title, subtitle, color } = useViewTitle()
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showShortcuts, setShowShortcuts] = useState(false)

  useKeyboardShortcuts({
    onHelp: () => setShowShortcuts(true),
    onNewTask: () => setShowCreateModal(true),
  })

  return (
    <>
    <header className="flex h-14 shrink-0 items-center justify-between border-b border-border-subtle bg-surface-1 px-6">
      {/* Left: hamburger (mobile) + View title */}
      <div className="flex items-center gap-3">
        {onMenuToggle && (
          <button
            onClick={onMenuToggle}
            className="mr-2 flex h-8 w-8 items-center justify-center rounded-lg text-text-secondary hover:bg-surface-3 md:hidden"
            aria-label="Open menu"
          >
            <Menu size={18} />
          </button>
        )}
        {color && (
          <span className="h-3 w-3 rounded-full" style={{ backgroundColor: color }} />
        )}
        <h2 className="text-base font-semibold text-text-primary">{title}</h2>
        {subtitle && (
          <span className="rounded bg-surface-4 px-1.5 py-0.5 font-mono text-[11px] font-medium text-text-tertiary">
            {subtitle}
          </span>
        )}
      </div>

      {/* Right: New Task + Filters + Search + View toggle */}
      <div className="flex items-center gap-2">
        {/* New Task button */}
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-1.5 rounded-lg bg-accent px-3 py-1.5 text-xs font-medium text-white hover:bg-accent-hover"
        >
          <Plus size={14} />
          New Task
        </button>

        {/* Period selector */}
        <select
          value={activePeriodId}
          onChange={(e) => setActivePeriod(e.target.value)}
          className="h-8 rounded-md border border-border-subtle bg-surface-2 px-2 text-xs font-medium text-text-primary outline-none transition-colors focus:border-border-strong"
        >
          {periods.map((p) => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>

        {/* Separator */}
        <div className="mx-1 h-5 w-px bg-border-subtle" />
        {/* Status filter */}
        <select
          value={statusFilter ?? ''}
          onChange={(e) => setStatusFilter((e.target.value || null) as TaskStatus | null)}
          className="h-8 rounded-md border border-border-subtle bg-surface-2 px-2 text-xs text-text-secondary outline-none transition-colors focus:border-border-strong"
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
          className="h-8 rounded-md border border-border-subtle bg-surface-2 px-2 text-xs text-text-secondary outline-none transition-colors focus:border-border-strong"
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
          className="h-8 rounded-md border border-border-subtle bg-surface-2 px-2 text-xs text-text-secondary outline-none transition-colors focus:border-border-strong"
        >
          <option value="">All Assignees</option>
          {profiles.map((p) => (
            <option key={p.id} value={p.id}>
              {p.fullName}
            </option>
          ))}
        </select>

        {/* Separator */}
        <div className="mx-1 h-5 w-px bg-border-subtle" />

        {/* Search */}
        <div className="relative">
          <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-text-tertiary" />
          <input
            type="text"
            placeholder="Search tasks..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-8 w-48 rounded-md border border-border-subtle bg-surface-2 pl-8 pr-3 text-xs text-text-primary outline-none transition-all placeholder:text-text-tertiary focus:w-64 focus:border-border-strong"
          />
        </div>

        {/* Separator */}
        <div className="mx-1 h-5 w-px bg-border-subtle" />

        {/* View mode toggle */}
        <div className="flex rounded-md border border-border-subtle">
          <button
            onClick={() => setViewMode('list')}
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
            className={`flex h-7 w-8 items-center justify-center border-l border-border-subtle transition-colors ${
              viewMode === 'log'
                ? 'bg-surface-3 text-text-primary'
                : 'text-text-tertiary hover:text-text-secondary'
            }`}
          >
            <Table2 size={14} />
          </button>
        </div>
      </div>
    </header>
    <TaskCreateModal open={showCreateModal} onClose={() => setShowCreateModal(false)} />
    <ShortcutsOverlay open={showShortcuts} onClose={() => setShowShortcuts(false)} />
    </>
  )
}
