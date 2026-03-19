import { useState } from 'react'
import { Modal } from '@/components/common/Modal'
import { useCalendarStore } from '@/stores/calendarStore'
import { useTaskStore } from '@/stores/taskStore'
import { useToastStore } from '@/stores/toastStore'
import { COMPANY_ID } from '@/lib/ids'
import { EVENT_TYPES } from '@/lib/constants'
import type { CalendarEvent } from '@/lib/types'

interface EventCreateModalProps {
  open: boolean
  onClose: () => void
  defaultDate?: string
}

export function EventCreateModal({ open, onClose, defaultDate }: EventCreateModalProps) {
  const addEvent = useCalendarStore((s) => s.addEvent)
  const tasks = useTaskStore((s) => s.tasks)
  const addToast = useToastStore((s) => s.addToast)

  const [title, setTitle] = useState('')
  const [eventType, setEventType] = useState<CalendarEvent['eventType']>('meeting')
  const [startDate, setStartDate] = useState(defaultDate ?? '')
  const [endDate, setEndDate] = useState('')
  const [description, setDescription] = useState('')
  const [relatedTaskId, setRelatedTaskId] = useState('')

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim() || !startDate) return

    addEvent({
      id: crypto.randomUUID(),
      companyId: COMPANY_ID,
      title: title.trim(),
      eventType,
      startDate,
      endDate: endDate || undefined,
      description: description || undefined,
      relatedTaskId: relatedTaskId || undefined,
    })

    addToast('success', 'Event created')
    setTitle('')
    setEventType('meeting')
    setStartDate('')
    setEndDate('')
    setDescription('')
    setRelatedTaskId('')
    onClose()
  }

  return (
    <Modal open={open} onClose={onClose} title="Add Calendar Event" width="md">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="mb-1 block text-xs font-medium text-text-secondary">Title</label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Event title"
            required
            className="h-9 w-full rounded-lg border border-border-subtle bg-surface-2 px-3 text-sm text-text-primary outline-none focus:border-border-strong"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-text-secondary">Event Type</label>
            <select
              value={eventType}
              onChange={(e) => setEventType(e.target.value as CalendarEvent['eventType'])}
              className="h-9 w-full rounded-lg border border-border-subtle bg-surface-2 px-3 text-sm text-text-secondary outline-none focus:border-border-strong"
            >
              {EVENT_TYPES.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-text-secondary">Related Task</label>
            <select
              value={relatedTaskId}
              onChange={(e) => setRelatedTaskId(e.target.value)}
              className="h-9 w-full rounded-lg border border-border-subtle bg-surface-2 px-3 text-sm text-text-secondary outline-none focus:border-border-strong"
            >
              <option value="">None</option>
              {tasks.map((t) => (
                <option key={t.id} value={t.id}>{t.taskCode} — {t.title}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-text-secondary">Start Date</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              required
              className="h-9 w-full rounded-lg border border-border-subtle bg-surface-2 px-3 text-sm text-text-secondary outline-none focus:border-border-strong"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-text-secondary">End Date</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="h-9 w-full rounded-lg border border-border-subtle bg-surface-2 px-3 text-sm text-text-secondary outline-none focus:border-border-strong"
            />
          </div>
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-text-secondary">Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            placeholder="Optional description..."
            className="w-full rounded-lg border border-border-subtle bg-surface-2 px-3 py-2 text-sm text-text-primary outline-none focus:border-border-strong"
          />
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <button type="button" onClick={onClose} className="rounded-lg px-4 py-2 text-xs font-medium text-text-secondary hover:bg-surface-3">
            Cancel
          </button>
          <button type="submit" className="rounded-lg bg-accent px-4 py-2 text-xs font-medium text-white hover:bg-accent-hover">
            Add Event
          </button>
        </div>
      </form>
    </Modal>
  )
}
