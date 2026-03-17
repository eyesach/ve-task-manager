import { useEffect, useRef, useState } from 'react'
import {
  X,
  CalendarDays,
  Users,
  Flag,
  Bookmark,
  Clock,
  Pencil,
  Eye,
  Trash2,
  Star,
} from 'lucide-react'
import { format } from 'date-fns'
import { useUIStore } from '@/stores/uiStore'
import { useTaskStore } from '@/stores/taskStore'
import { useToastStore } from '@/stores/toastStore'
import {
  getDepartmentById,
  TASK_PRIORITIES,
  TASK_CATEGORIES,
} from '@/lib/constants'
import type { TaskPriority, TaskCategory } from '@/lib/types'
import { StatusChip } from '@/components/common/StatusChip'
import { Avatar } from '@/components/common/AvatarGroup'
import { TaskChecklist } from './TaskChecklist'
import { TaskComments } from './TaskComments'
import { RichTextEditor, RichTextViewer } from '@/components/common/RichTextEditor'
import { ConfirmDialog } from '@/components/common/ConfirmDialog'
import { AssigneeSelect } from './AssigneeSelect'

export function TaskDetail() {
  const { selectedTaskId, closeTaskDetail } = useUIStore()
  const {
    getTaskById,
    getAssigneesForTask,
    updateTaskStatus,
    updateTaskDescription,
    updateTask,
    deleteTask,
    addAssignee,
    removeAssignee,
    togglePrimaryAssignee,
    assignees: allAssignees,
  } = useTaskStore()
  const { addToast } = useToastStore()
  const panelRef = useRef<HTMLDivElement>(null)

  const [editingDescription, setEditingDescription] = useState(false)
  const [editing, setEditing] = useState(false)
  const [editTitle, setEditTitle] = useState('')
  const [editDueDate, setEditDueDate] = useState('')
  const [editResponsibility, setEditResponsibility] = useState('')
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  // Reset edit state when switching tasks
  useEffect(() => {
    setEditingDescription(false)
    setEditing(false)
  }, [selectedTaskId])

  const task = selectedTaskId ? getTaskById(selectedTaskId) : undefined
  const assignees = selectedTaskId ? getAssigneesForTask(selectedTaskId) : []
  const dept = task?.departmentId ? getDepartmentById(task.departmentId) : null

  // Sync local edit state from task when editing mode starts or task changes
  useEffect(() => {
    if (editing && task) {
      setEditTitle(task.title)
      setEditDueDate(task.dueDate ?? '')
      setEditResponsibility(task.responsibilityNote ?? '')
    }
  }, [editing, task?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  // Close on Escape
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') closeTaskDetail()
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [closeTaskDetail])

  // Click outside to close (only when no confirm dialog is open)
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (
        panelRef.current &&
        !panelRef.current.contains(e.target as Node) &&
        !showDeleteConfirm
      ) {
        closeTaskDetail()
      }
    }
    if (selectedTaskId) {
      document.addEventListener('mousedown', handleClick)
    }
    return () => document.removeEventListener('mousedown', handleClick)
  }, [selectedTaskId, closeTaskDetail, showDeleteConfirm])

  function handleDelete() {
    if (!task) return
    deleteTask(task.id)
    addToast('success', 'Task deleted')
    closeTaskDetail()
  }

  function getAssigneeLink(profileId: string) {
    return allAssignees.find(
      (a) => a.taskId === task?.id && a.profileId === profileId
    )
  }

  const inputCls =
    'rounded-lg border border-border-subtle bg-surface-2 px-2 py-1 text-sm text-text-primary outline-none focus:border-border-strong'
  const selectCls =
    'rounded-md border border-border-subtle bg-surface-2 px-2 py-1 text-xs text-text-primary outline-none focus:border-border-strong'

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-40 bg-black/40 backdrop-blur-sm transition-opacity duration-300 ${
          selectedTaskId ? 'opacity-100' : 'pointer-events-none opacity-0'
        }`}
      />

      {/* Panel */}
      <div
        ref={panelRef}
        className={`
          fixed right-0 top-0 z-50 flex h-screen w-[520px] flex-col border-l
          border-border-subtle bg-surface-1 shadow-2xl transition-transform
          duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]
          ${selectedTaskId ? 'translate-x-0' : 'translate-x-full'}
        `}
      >
        {task && (
          <>
            {/* Header */}
            <div className="flex items-start justify-between border-b border-border-subtle p-5">
              <div className="flex-1 min-w-0 pr-2">
                <div className="flex items-center gap-2.5">
                  {dept && (
                    <span
                      className="h-3 w-3 shrink-0 rounded-full"
                      style={{ backgroundColor: dept.color }}
                    />
                  )}
                  <span className="font-mono text-sm font-semibold text-text-secondary">
                    {task.taskCode}
                  </span>
                </div>
                {editing ? (
                  <input
                    className={`mt-2 w-full text-lg font-semibold ${inputCls}`}
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    onBlur={() => {
                      if (editTitle.trim()) {
                        updateTask(task.id, { title: editTitle.trim() })
                      }
                    }}
                    autoFocus
                  />
                ) : (
                  <h2 className="mt-2 text-lg font-semibold text-text-primary">
                    {task.title}
                  </h2>
                )}
              </div>

              {/* Header action buttons */}
              <div className="flex shrink-0 items-center gap-1">
                {/* Edit toggle */}
                <button
                  onClick={() => setEditing(!editing)}
                  title={editing ? 'View mode' : 'Edit task'}
                  className={`flex h-8 w-8 items-center justify-center rounded-md transition-colors hover:bg-surface-3 ${
                    editing ? 'text-accent' : 'text-text-tertiary hover:text-text-primary'
                  }`}
                >
                  {editing ? <Eye size={15} /> : <Pencil size={15} />}
                </button>

                {/* Delete button */}
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  title="Delete task"
                  className="flex h-8 w-8 items-center justify-center rounded-md text-text-tertiary transition-colors hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950"
                >
                  <Trash2 size={15} />
                </button>

                {/* Close */}
                <button
                  onClick={closeTaskDetail}
                  className="flex h-8 w-8 items-center justify-center rounded-md text-text-tertiary transition-colors hover:bg-surface-3 hover:text-text-primary"
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            {/* Body — scrollable */}
            <div className="flex-1 overflow-y-auto">
              {/* Metadata grid */}
              <div className="grid grid-cols-2 gap-4 border-b border-border-subtle p-5">
                {/* Status */}
                <div>
                  <label className="mb-1.5 flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-wider text-text-tertiary">
                    <Flag size={10} /> Status
                  </label>
                  <StatusChip
                    status={task.status}
                    editable
                    onChange={(s) => updateTaskStatus(task.id, s)}
                  />
                </div>

                {/* Due Date */}
                <div>
                  <label className="mb-1.5 flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-wider text-text-tertiary">
                    <CalendarDays size={10} /> Due Date
                  </label>
                  {editing ? (
                    <input
                      type="date"
                      value={editDueDate}
                      onChange={(e) => {
                        setEditDueDate(e.target.value)
                        updateTask(task.id, { dueDate: e.target.value || undefined })
                      }}
                      className={inputCls}
                    />
                  ) : (
                    <span className="text-sm text-text-primary">
                      {task.dueDate ? format(new Date(task.dueDate), 'MMMM d, yyyy') : '—'}
                    </span>
                  )}
                </div>

                {/* Department */}
                <div>
                  <label className="mb-1.5 flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-wider text-text-tertiary">
                    <Bookmark size={10} /> Department
                  </label>
                  {dept ? (
                    <span className="flex items-center gap-1.5 text-sm text-text-primary">
                      <span
                        className="h-2 w-2 rounded-full"
                        style={{ backgroundColor: dept.color }}
                      />
                      {dept.name}
                    </span>
                  ) : (
                    <span className="text-sm text-text-secondary">Cross-Department</span>
                  )}
                </div>

                {/* Category */}
                <div>
                  <label className="mb-1.5 flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-wider text-text-tertiary">
                    <Clock size={10} /> Category
                  </label>
                  {editing ? (
                    <select
                      value={task.category}
                      onChange={(e) =>
                        updateTask(task.id, { category: e.target.value as TaskCategory })
                      }
                      className={selectCls}
                    >
                      {TASK_CATEGORIES.map((c) => (
                        <option key={c.value} value={c.value}>
                          {c.label}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <span className="text-sm capitalize text-text-primary">
                      {task.category.replace('_', '-')}
                    </span>
                  )}
                </div>

                {/* Priority (always editable via select) */}
                <div>
                  <label className="mb-1.5 flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-wider text-text-tertiary">
                    <Flag size={10} /> Priority
                  </label>
                  <select
                    value={task.priority}
                    onChange={(e) =>
                      updateTask(task.id, { priority: e.target.value as TaskPriority })
                    }
                    className={selectCls}
                  >
                    {TASK_PRIORITIES.map((p) => (
                      <option key={p.value} value={p.value}>
                        {p.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Description */}
              <div className="border-b border-border-subtle p-5">
                <div className="mb-2 flex items-center justify-between">
                  <label className="text-[10px] font-medium uppercase tracking-wider text-text-tertiary">
                    Description
                  </label>
                  <button
                    onClick={() => setEditingDescription(!editingDescription)}
                    className="flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-medium text-text-tertiary transition-colors hover:bg-surface-3 hover:text-text-primary"
                    title={editingDescription ? 'View mode' : 'Edit description'}
                  >
                    {editingDescription ? <Eye size={10} /> : <Pencil size={10} />}
                    {editingDescription ? 'View' : 'Edit'}
                  </button>
                </div>
                {editingDescription ? (
                  <RichTextEditor
                    content={task.description ?? ''}
                    onChange={(html) => updateTaskDescription(task.id, html)}
                    placeholder="Add a description..."
                  />
                ) : task.description ? (
                  <RichTextViewer content={task.description} />
                ) : (
                  <p
                    className="cursor-pointer text-sm italic text-text-tertiary hover:text-text-secondary"
                    onClick={() => setEditingDescription(true)}
                  >
                    Click to add a description...
                  </p>
                )}
              </div>

              {/* Responsibility */}
              <div className="border-b border-border-subtle p-5">
                <label className="mb-2 block text-[10px] font-medium uppercase tracking-wider text-text-tertiary">
                  Responsibility
                </label>
                {editing ? (
                  <input
                    type="text"
                    value={editResponsibility}
                    onChange={(e) => setEditResponsibility(e.target.value)}
                    onBlur={() =>
                      updateTask(task.id, {
                        responsibilityNote: editResponsibility.trim() || undefined,
                      })
                    }
                    placeholder="e.g. All Team Members"
                    className={`w-full ${inputCls}`}
                  />
                ) : (
                  <p className="text-sm text-text-secondary">
                    {task.responsibilityNote ?? '—'}
                  </p>
                )}
              </div>

              {/* Assignees */}
              <div className="border-b border-border-subtle p-5">
                <label className="mb-3 flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-wider text-text-tertiary">
                  <Users size={10} /> Assignees
                </label>
                {assignees.length > 0 ? (
                  <div className="mb-3 space-y-2">
                    {assignees.map((p) => {
                      const link = getAssigneeLink(p.id)
                      return (
                        <div key={p.id} className="flex items-center gap-2.5">
                          <Avatar profile={p} size="sm" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-text-primary">{p.fullName}</p>
                            <p className="text-[11px] text-text-tertiary capitalize">
                              {p.role.replace('_', ' ')}
                            </p>
                          </div>
                          {/* Star for primary */}
                          <button
                            onClick={() => togglePrimaryAssignee(task.id, p.id)}
                            title={link?.isPrimary ? 'Remove primary' : 'Set as primary'}
                            className={`flex h-6 w-6 items-center justify-center rounded transition-colors hover:bg-surface-3 ${
                              link?.isPrimary
                                ? 'text-amber-400'
                                : 'text-text-tertiary hover:text-amber-400'
                            }`}
                          >
                            <Star
                              size={13}
                              fill={link?.isPrimary ? 'currentColor' : 'none'}
                            />
                          </button>
                          {/* Remove */}
                          <button
                            onClick={() => removeAssignee(task.id, p.id)}
                            title="Remove assignee"
                            className="flex h-6 w-6 items-center justify-center rounded text-text-tertiary transition-colors hover:bg-surface-3 hover:text-red-500"
                          >
                            <X size={13} />
                          </button>
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <p className="mb-3 text-sm text-text-tertiary">No assignees</p>
                )}
                <AssigneeSelect
                  selectedIds={assignees.map((p) => p.id)}
                  onAdd={(profileId) => addAssignee(task.id, profileId, assignees.length === 0)}
                  onRemove={(profileId) => removeAssignee(task.id, profileId)}
                />
              </div>

              {/* Checklist */}
              <div className="p-5">
                <TaskChecklist taskId={task.id} />
              </div>

              {/* Comments */}
              <div className="border-t border-border-subtle p-5">
                <TaskComments taskId={task.id} />
              </div>
            </div>
          </>
        )}
      </div>

      {/* Delete confirm dialog — rendered outside panel so it's not clipped */}
      <ConfirmDialog
        open={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleDelete}
        title="Delete Task"
        message="Delete this task? This action cannot be undone."
        confirmLabel="Delete"
        destructive
      />
    </>
  )
}
