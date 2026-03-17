import { useEffect, useRef, useState, useCallback } from 'react'
import { Search, FileText, CheckSquare, MessageSquare, X } from 'lucide-react'
import { useTaskStore } from '@/stores/taskStore'
import { useUIStore } from '@/stores/uiStore'

interface SearchOverlayProps {
  open: boolean
  onClose: () => void
}

interface TaskResult {
  kind: 'task'
  id: string
  taskId: string
  primary: string
  subtitle: string
}

interface ChecklistResult {
  kind: 'checklist'
  id: string
  taskId: string
  primary: string
  subtitle: string
}

interface CommentResult {
  kind: 'comment'
  id: string
  taskId: string
  primary: string
  subtitle: string
}

type SearchResult = TaskResult | ChecklistResult | CommentResult

const MAX_PER_GROUP = 5

export function SearchOverlay({ open, onClose }: SearchOverlayProps) {
  const [query, setQuery] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)

  const tasks = useTaskStore((s) => s.tasks)
  const checklists = useTaskStore((s) => s.checklists)
  const comments = useTaskStore((s) => s.comments)
  const openTaskDetail = useUIStore((s) => s.openTaskDetail)

  // Auto-focus input when overlay opens
  useEffect(() => {
    if (open) {
      setQuery('')
      setSelectedIndex(0)
      // Defer focus to allow the DOM to mount
      requestAnimationFrame(() => {
        inputRef.current?.focus()
      })
    }
  }, [open])

  const getResults = useCallback((): {
    taskResults: TaskResult[]
    taskTotal: number
    checklistResults: ChecklistResult[]
    checklistTotal: number
    commentResults: CommentResult[]
    commentTotal: number
  } => {
    if (!query.trim()) {
      return {
        taskResults: [],
        taskTotal: 0,
        checklistResults: [],
        checklistTotal: 0,
        commentResults: [],
        commentTotal: 0,
      }
    }

    const q = query.toLowerCase()

    const matchingTasks = tasks.filter(
      (t) =>
        t.title.toLowerCase().includes(q) ||
        t.taskCode.toLowerCase().includes(q) ||
        (t.description ?? '').toLowerCase().includes(q)
    )

    const matchingChecklists = checklists.filter(
      (c) =>
        c.label.toLowerCase().includes(q) ||
        (c.requiredEvidence ?? '').toLowerCase().includes(q)
    )

    const matchingComments = comments.filter((c) =>
      c.content.toLowerCase().includes(q)
    )

    const taskResults: TaskResult[] = matchingTasks
      .slice(0, MAX_PER_GROUP)
      .map((t) => ({
        kind: 'task' as const,
        id: t.id,
        taskId: t.id,
        primary: t.title,
        subtitle: t.taskCode,
      }))

    const checklistResults: ChecklistResult[] = matchingChecklists
      .slice(0, MAX_PER_GROUP)
      .map((c) => {
        const parentTask = tasks.find((t) => t.id === c.taskId)
        return {
          kind: 'checklist' as const,
          id: c.id,
          taskId: c.taskId,
          primary: c.label,
          subtitle: parentTask ? parentTask.taskCode : c.taskId,
        }
      })

    const commentResults: CommentResult[] = matchingComments
      .slice(0, MAX_PER_GROUP)
      .map((c) => {
        const parentTask = tasks.find((t) => t.id === c.taskId)
        return {
          kind: 'comment' as const,
          id: c.id,
          taskId: c.taskId,
          primary: c.content.length > 80 ? c.content.slice(0, 80) + '…' : c.content,
          subtitle: parentTask ? parentTask.taskCode : c.taskId,
        }
      })

    return {
      taskResults,
      taskTotal: matchingTasks.length,
      checklistResults,
      checklistTotal: matchingChecklists.length,
      commentResults,
      commentTotal: matchingComments.length,
    }
  }, [query, tasks, checklists, comments])

  const {
    taskResults,
    taskTotal,
    checklistResults,
    checklistTotal,
    commentResults,
    commentTotal,
  } = getResults()

  const allResults: SearchResult[] = [
    ...taskResults,
    ...checklistResults,
    ...commentResults,
  ]

  const handleOpen = useCallback(
    (result: SearchResult) => {
      openTaskDetail(result.taskId)
      onClose()
    },
    [openTaskDetail, onClose]
  )

  // Keyboard navigation
  useEffect(() => {
    if (!open) return

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        onClose()
        return
      }
      if (allResults.length === 0) return

      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setSelectedIndex((i) => (i + 1) % allResults.length)
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        setSelectedIndex((i) => (i - 1 + allResults.length) % allResults.length)
      } else if (e.key === 'Enter') {
        e.preventDefault()
        const selected = allResults[selectedIndex]
        if (selected) handleOpen(selected)
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [open, onClose, allResults, selectedIndex, handleOpen])

  // Reset selection when results change
  useEffect(() => {
    setSelectedIndex(0)
  }, [query])

  if (!open) return null

  const hasQuery = query.trim().length > 0
  const hasResults = allResults.length > 0

  // Flat index offset for each group (for keyboard highlight)
  const checklistOffset = taskResults.length
  const commentOffset = taskResults.length + checklistResults.length

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Search container */}
      <div className="relative mx-auto mt-24 w-full max-w-xl rounded-xl border border-border-subtle bg-surface-1 shadow-2xl">
        {/* Input row */}
        <div className="flex items-center gap-3 border-b border-border-subtle px-4">
          <Search size={18} className="shrink-0 text-text-tertiary" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search tasks, checklists, comments…"
            className="h-12 flex-1 bg-transparent text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="flex h-6 w-6 shrink-0 items-center justify-center rounded text-text-tertiary hover:bg-surface-3 hover:text-text-primary"
              aria-label="Clear search"
            >
              <X size={14} />
            </button>
          )}
          <kbd className="shrink-0 rounded border border-border-default bg-surface-3 px-1.5 py-0.5 font-mono text-xs text-text-tertiary">
            Esc
          </kbd>
        </div>

        {/* Results area */}
        <div className="max-h-96 overflow-y-auto py-2">
          {!hasQuery && (
            <p className="px-4 py-8 text-center text-sm text-text-tertiary">
              Type to search…
            </p>
          )}

          {hasQuery && !hasResults && (
            <p className="px-4 py-8 text-center text-sm text-text-tertiary">
              No results for &ldquo;{query}&rdquo;
            </p>
          )}

          {hasQuery && hasResults && (
            <>
              {taskResults.length > 0 && (
                <ResultGroup
                  label="Tasks"
                  icon={<FileText size={13} />}
                  total={taskTotal}
                  results={taskResults}
                  selectedIndex={selectedIndex}
                  indexOffset={0}
                  onOpen={handleOpen}
                />
              )}

              {checklistResults.length > 0 && (
                <ResultGroup
                  label="Checklist Items"
                  icon={<CheckSquare size={13} />}
                  total={checklistTotal}
                  results={checklistResults}
                  selectedIndex={selectedIndex}
                  indexOffset={checklistOffset}
                  onOpen={handleOpen}
                />
              )}

              {commentResults.length > 0 && (
                <ResultGroup
                  label="Comments"
                  icon={<MessageSquare size={13} />}
                  total={commentTotal}
                  results={commentResults}
                  selectedIndex={selectedIndex}
                  indexOffset={commentOffset}
                  onOpen={handleOpen}
                />
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}

interface ResultGroupProps {
  label: string
  icon: React.ReactNode
  total: number
  results: SearchResult[]
  selectedIndex: number
  indexOffset: number
  onOpen: (result: SearchResult) => void
}

function ResultGroup({
  label,
  icon,
  total,
  results,
  selectedIndex,
  indexOffset,
  onOpen,
}: ResultGroupProps) {
  return (
    <div className="mb-1">
      {/* Group header */}
      <div className="flex items-center gap-1.5 px-4 pb-1 pt-2">
        <span className="text-text-tertiary">{icon}</span>
        <span className="text-xs font-medium uppercase tracking-wider text-text-tertiary">
          {label}
        </span>
        {total > MAX_PER_GROUP && (
          <span className="ml-auto text-xs text-text-tertiary">
            {total} results — showing {MAX_PER_GROUP}
          </span>
        )}
      </div>

      {/* Result rows */}
      {results.map((result, i) => {
        const flatIndex = indexOffset + i
        const isSelected = selectedIndex === flatIndex
        return (
          <button
            key={result.id}
            onClick={() => onOpen(result)}
            className={`flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors ${
              isSelected
                ? 'bg-surface-3 text-text-primary'
                : 'text-text-secondary hover:bg-surface-2'
            }`}
          >
            <ResultIcon kind={result.kind} />
            <span className="flex-1 truncate text-sm">{result.primary}</span>
            <span className="shrink-0 font-mono text-xs text-text-tertiary">
              {result.subtitle}
            </span>
          </button>
        )
      })}
    </div>
  )
}

function ResultIcon({ kind }: { kind: SearchResult['kind'] }) {
  const base = 'shrink-0 text-text-tertiary'
  if (kind === 'task') return <FileText size={15} className={base} />
  if (kind === 'checklist') return <CheckSquare size={15} className={base} />
  return <MessageSquare size={15} className={base} />
}
