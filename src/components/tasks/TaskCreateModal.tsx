import { useState, useEffect } from 'react'
import { Modal } from '@/components/common/Modal'
import { RichTextEditor } from '@/components/common/RichTextEditor'
import { AssigneeSelect } from './AssigneeSelect'
import { useTaskStore } from '@/stores/taskStore'
import { usePeriodStore } from '@/stores/periodStore'
import { useToastStore } from '@/stores/toastStore'
import { COMPANY_ID } from '@/lib/ids'
import { DEPARTMENTS, TASK_CATEGORIES, TASK_PRIORITIES } from '@/lib/constants'
import type { Task, TaskCategory, TaskPriority } from '@/lib/types'

interface TaskCreateModalProps {
  open: boolean
  onClose: () => void
}

const PERIOD_NUMBER = 3

export function TaskCreateModal({ open, onClose }: TaskCreateModalProps) {
  const { addTask, addAssignee, getNextTaskCode } = useTaskStore()
  const { activePeriodId } = usePeriodStore()
  const { addToast } = useToastStore()

  const [title, setTitle] = useState('')
  const [taskCode, setTaskCode] = useState('')
  const [departmentId, setDepartmentId] = useState('')
  const [category, setCategory] = useState<TaskCategory>('department')
  const [priority, setPriority] = useState<TaskPriority>('normal')
  const [dueDate, setDueDate] = useState('')
  const [description, setDescription] = useState('')
  const [responsibilityNote, setResponsibilityNote] = useState('')
  const [assigneeIds, setAssigneeIds] = useState<string[]>([])

  // Auto-generate task code when department changes
  useEffect(() => {
    if (departmentId) {
      const dept = DEPARTMENTS.find((d) => d.id === departmentId)
      if (dept) {
        setTaskCode(getNextTaskCode(dept.abbreviation, PERIOD_NUMBER))
      }
    } else {
      setTaskCode(getNextTaskCode('ID', PERIOD_NUMBER))
    }
  }, [departmentId, getNextTaskCode])

  // Reset form when modal opens
  useEffect(() => {
    if (open) {
      setTitle('')
      setTaskCode('')
      setDepartmentId('')
      setCategory('department')
      setPriority('normal')
      setDueDate('')
      setDescription('')
      setResponsibilityNote('')
      setAssigneeIds([])
    }
  }, [open])

  function handleDepartmentChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const val = e.target.value
    setDepartmentId(val)
    if (val === '') {
      setCategory('inter_department')
    } else {
      setCategory('department')
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim()) return

    const now = new Date().toISOString()
    const id = crypto.randomUUID()

    const task: Task = {
      id,
      companyId: COMPANY_ID,
      taskPeriodId: activePeriodId,
      departmentId: departmentId || null,
      taskCode: taskCode.trim(),
      title: title.trim(),
      description: description || undefined,
      category,
      priority,
      status: 'not_started',
      dueDate: dueDate || undefined,
      responsibilityNote: responsibilityNote.trim() || undefined,
      isOptional: false,
      isHighPriority: priority === 'critical' || priority === 'high',
      sortOrder: 0,
      createdAt: now,
      updatedAt: now,
    }

    addTask(task)

    assigneeIds.forEach((profileId, index) => {
      addAssignee(id, profileId, index === 0)
    })

    addToast('success', `Task "${task.title}" created`)
    onClose()
  }

  const inputCls =
    'w-full rounded-lg border border-border-subtle bg-surface-2 px-3 py-2 text-sm text-text-primary outline-none focus:border-border-strong'
  const labelCls = 'text-xs font-medium text-text-secondary mb-1.5 block'

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="New Task"
      width="w-[600px]"
      footer={
        <>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-4 py-2 text-sm text-text-secondary hover:bg-surface-3"
          >
            Cancel
          </button>
          <button
            form="task-create-form"
            type="submit"
            className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent-hover"
          >
            Create Task
          </button>
        </>
      }
    >
      <form id="task-create-form" onSubmit={handleSubmit} className="space-y-4">
        {/* Title */}
        <div>
          <label className={labelCls} htmlFor="tc-title">
            Title <span className="text-red-400">*</span>
          </label>
          <input
            id="tc-title"
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Task title"
            className={inputCls}
          />
        </div>

        {/* Task Code + Department row */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelCls} htmlFor="tc-department">
              Department
            </label>
            <select
              id="tc-department"
              value={departmentId}
              onChange={handleDepartmentChange}
              className={inputCls}
            >
              <option value="">Inter-Department</option>
              {DEPARTMENTS.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className={labelCls} htmlFor="tc-code">
              Task Code
            </label>
            <input
              id="tc-code"
              type="text"
              value={taskCode}
              onChange={(e) => setTaskCode(e.target.value)}
              placeholder="e.g. AD 3.1"
              className={inputCls}
            />
          </div>
        </div>

        {/* Category + Priority row */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelCls} htmlFor="tc-category">
              Category
            </label>
            <select
              id="tc-category"
              value={category}
              onChange={(e) => setCategory(e.target.value as TaskCategory)}
              className={inputCls}
            >
              {TASK_CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className={labelCls} htmlFor="tc-priority">
              Priority
            </label>
            <select
              id="tc-priority"
              value={priority}
              onChange={(e) => setPriority(e.target.value as TaskPriority)}
              className={inputCls}
            >
              {TASK_PRIORITIES.map((p) => (
                <option key={p.value} value={p.value}>
                  {p.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Due Date */}
        <div>
          <label className={labelCls} htmlFor="tc-due-date">
            Due Date
          </label>
          <input
            id="tc-due-date"
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            className={inputCls}
          />
        </div>

        {/* Description */}
        <div>
          <label className={labelCls}>Description</label>
          <RichTextEditor
            content={description}
            onChange={setDescription}
            placeholder="Add a description..."
          />
        </div>

        {/* Responsibility Note */}
        <div>
          <label className={labelCls} htmlFor="tc-responsibility">
            Responsibility Note
          </label>
          <input
            id="tc-responsibility"
            type="text"
            value={responsibilityNote}
            onChange={(e) => setResponsibilityNote(e.target.value)}
            placeholder="e.g. All Team Members, Both Chief Officers"
            className={inputCls}
          />
        </div>

        {/* Assignees */}
        <div>
          <label className={labelCls}>Assignees</label>
          <AssigneeSelect
            selectedIds={assigneeIds}
            onAdd={(id) => setAssigneeIds((prev) => [...prev, id])}
            onRemove={(id) => setAssigneeIds((prev) => prev.filter((x) => x !== id))}
          />
        </div>
      </form>
    </Modal>
  )
}
