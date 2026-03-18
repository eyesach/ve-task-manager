import { useState, useRef, KeyboardEvent } from 'react'
import {
  Check,
  ExternalLink,
  Eye,
  FileText,
  Calendar,
  Plus,
  ChevronUp,
  ChevronDown,
  X,
} from 'lucide-react'
import type { ChecklistItem, EvidenceType } from '@/lib/types'
import { useTaskStore } from '@/stores/taskStore'
import { EVIDENCE_TYPES } from '@/lib/constants'

// ─── Evidence icons ──────────────────────────────────────────────────────────

const EVIDENCE_ICONS: Record<EvidenceType, React.ReactNode> = {
  text: <FileText size={12} />,
  link: <ExternalLink size={12} />,
  date: <Calendar size={12} />,
  teacher_observation: <Eye size={12} />,
  file: <FileText size={12} />,
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatObservationStamp(): string {
  const now = new Date()
  return `Observed: ${now.toLocaleDateString('en-US', { year: 'numeric', month: '2-digit', day: '2-digit' })} ${now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`
}

// ─── Add-item form ────────────────────────────────────────────────────────────

interface AddItemFormProps {
  taskId: string
  nextSortOrder: number
  onAdd: () => void
}

function AddItemForm({ taskId, nextSortOrder, onAdd }: AddItemFormProps) {
  const { addChecklistItem } = useTaskStore()
  const [label, setLabel] = useState('')
  const [evidenceType, setEvidenceType] = useState<EvidenceType>('text')
  const [requiredEvidence, setRequiredEvidence] = useState('')
  const labelRef = useRef<HTMLInputElement>(null)

  function handleSubmit() {
    const trimmed = label.trim()
    if (!trimmed) return

    addChecklistItem({
      id: crypto.randomUUID(),
      taskId,
      label: trimmed,
      evidenceType,
      requiredEvidence: requiredEvidence.trim() || undefined,
      isCompleted: false,
      sortOrder: nextSortOrder,
    })

    setLabel('')
    setRequiredEvidence('')
    setEvidenceType('text')
    labelRef.current?.focus()
    onAdd()
  }

  function handleLabelKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') handleSubmit()
  }

  return (
    <div className="mt-3 rounded-lg border border-border-subtle bg-surface-3 p-3">
      <p className="mb-2 text-[11px] font-medium uppercase tracking-wide text-text-tertiary">
        Add checklist item
      </p>

      {/* Row 1: label input */}
      <input
        ref={labelRef}
        type="text"
        value={label}
        onChange={(e) => setLabel(e.target.value)}
        onKeyDown={handleLabelKeyDown}
        placeholder="Add checklist item..."
        className="w-full rounded-md border border-border-subtle bg-surface-2 px-3 py-1.5 text-sm text-text-primary placeholder:text-text-tertiary focus:border-accent focus:outline-none"
      />

      {/* Row 2: evidence type + description + add button */}
      <div className="mt-2 flex gap-2">
        <select
          value={evidenceType}
          onChange={(e) => setEvidenceType(e.target.value as EvidenceType)}
          className="shrink-0 rounded-md border border-border-subtle bg-surface-2 px-2 py-1.5 text-xs text-text-secondary focus:border-accent focus:outline-none"
        >
          {EVIDENCE_TYPES.map((et) => (
            <option key={et.value} value={et.value}>
              {et.label}
            </option>
          ))}
        </select>

        <input
          type="text"
          value={requiredEvidence}
          onChange={(e) => setRequiredEvidence(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') handleSubmit() }}
          placeholder="Evidence required..."
          className="min-w-0 flex-1 rounded-md border border-border-subtle bg-surface-2 px-3 py-1.5 text-xs text-text-primary placeholder:text-text-tertiary focus:border-accent focus:outline-none"
        />

        <button
          onClick={handleSubmit}
          disabled={!label.trim()}
          className="flex shrink-0 items-center gap-1 rounded-md bg-accent px-3 py-1.5 text-xs font-medium text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <Plus size={12} />
          Add
        </button>
      </div>
    </div>
  )
}

// ─── Evidence editor ──────────────────────────────────────────────────────────

interface EvidenceEditorProps {
  item: ChecklistItem
  onSave: (value: string) => void
  onCancel: () => void
}

function EvidenceEditor({ item, onSave, onCancel }: EvidenceEditorProps) {
  const [value, setValue] = useState(item.evidenceValue ?? '')

  function commitSave() {
    onSave(value)
  }

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') commitSave()
    if (e.key === 'Escape') onCancel()
  }

  if (item.evidenceType === 'teacher_observation') {
    return (
      <button
        onClick={() => onSave(formatObservationStamp())}
        className="mt-1.5 flex items-center gap-1.5 rounded-md bg-amber-500/10 px-2.5 py-1.5 text-xs font-medium text-amber-400 transition-colors hover:bg-amber-500/20"
      >
        <Eye size={11} />
        Stamp Observation
      </button>
    )
  }

  const inputType =
    item.evidenceType === 'link' ? 'url'
    : item.evidenceType === 'date' ? 'date'
    : 'text'

  return (
    <input
      autoFocus
      type={inputType}
      value={value}
      onChange={(e) => setValue(e.target.value)}
      onBlur={commitSave}
      onKeyDown={handleKeyDown}
      placeholder={
        item.evidenceType === 'link' ? 'https://drive.google.com/...'
        : item.evidenceType === 'date' ? 'Select date'
        : 'Enter note...'
      }
      className="mt-1.5 w-full rounded-md border border-accent bg-surface-2 px-2.5 py-1.5 text-xs text-text-primary placeholder:text-text-tertiary focus:outline-none"
    />
  )
}

// ─── Checklist row ────────────────────────────────────────────────────────────

interface ChecklistRowProps {
  item: ChecklistItem
  isFirst: boolean
  isLast: boolean
  onToggle: () => void
  onDelete: () => void
  onReorderUp: () => void
  onReorderDown: () => void
  onUpdateItem: (updates: Partial<ChecklistItem>) => void
}

function ChecklistRow({
  item,
  isFirst,
  isLast,
  onToggle,
  onDelete,
  onReorderUp,
  onReorderDown,
  onUpdateItem,
}: ChecklistRowProps) {
  const [editingLabel, setEditingLabel] = useState(false)
  const [labelDraft, setLabelDraft] = useState(item.label)
  const [editingEvidence, setEditingEvidence] = useState(false)

  function commitLabel() {
    const trimmed = labelDraft.trim()
    if (trimmed && trimmed !== item.label) {
      onUpdateItem({ label: trimmed })
    } else {
      setLabelDraft(item.label)
    }
    setEditingLabel(false)
  }

  function handleLabelKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') commitLabel()
    if (e.key === 'Escape') {
      setLabelDraft(item.label)
      setEditingLabel(false)
    }
  }

  function handleEvidenceSave(value: string) {
    onUpdateItem({ evidenceValue: value || undefined })
    setEditingEvidence(false)
  }

  return (
    <div
      className={`group flex items-start gap-3 rounded-lg px-3 py-2.5 transition-colors hover:bg-surface-3 ${
        item.isCompleted ? 'opacity-60' : ''
      }`}
    >
      {/* Checkbox */}
      <button
        onClick={onToggle}
        className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-all ${
          item.isCompleted
            ? 'border-emerald-500 bg-emerald-500 text-white'
            : 'border-border-strong hover:border-accent'
        }`}
      >
        {item.isCompleted && <Check size={10} strokeWidth={3} />}
      </button>

      {/* Content */}
      <div className="min-w-0 flex-1">
        {/* Label — inline edit on click */}
        {editingLabel ? (
          <input
            autoFocus
            type="text"
            value={labelDraft}
            onChange={(e) => setLabelDraft(e.target.value)}
            onBlur={commitLabel}
            onKeyDown={handleLabelKeyDown}
            className="w-full rounded border border-accent bg-surface-2 px-1.5 py-0.5 text-sm text-text-primary focus:outline-none"
          />
        ) : (
          <p
            role="button"
            tabIndex={0}
            onClick={() => { setLabelDraft(item.label); setEditingLabel(true) }}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { setLabelDraft(item.label); setEditingLabel(true) } }}
            className={`cursor-text text-sm ${
              item.isCompleted ? 'text-text-tertiary line-through' : 'text-text-primary'
            }`}
          >
            {item.label}
          </p>
        )}

        {/* Evidence requirement label */}
        {item.requiredEvidence && (
          <div className="mt-1 flex items-center gap-1.5">
            <span className="text-text-tertiary">{EVIDENCE_ICONS[item.evidenceType]}</span>
            <span className="text-[11px] text-text-tertiary">{item.requiredEvidence}</span>
          </div>
        )}

        {/* Evidence value or editor */}
        {editingEvidence ? (
          <EvidenceEditor
            item={item}
            onSave={handleEvidenceSave}
            onCancel={() => setEditingEvidence(false)}
          />
        ) : item.evidenceValue ? (
          <div
            role="button"
            tabIndex={0}
            onClick={() => setEditingEvidence(true)}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setEditingEvidence(true) }}
            className="mt-1.5 cursor-pointer rounded-md bg-surface-4 px-2.5 py-1.5 transition-colors hover:bg-surface-3"
          >
            {item.evidenceType === 'link' ? (
              <a
                href={item.evidenceValue}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="flex items-center gap-1.5 text-xs text-accent hover:text-accent-hover"
              >
                <ExternalLink size={10} />
                {item.evidenceValue.length > 50
                  ? item.evidenceValue.slice(0, 50) + '...'
                  : item.evidenceValue}
              </a>
            ) : item.evidenceType === 'teacher_observation' ? (
              <div className="flex items-center gap-1.5">
                <Eye size={10} className="text-amber-400" />
                <span className="text-xs text-amber-400">Teacher Observed</span>
                {item.evidenceValue && (
                  <span className="text-[11px] text-text-tertiary">— {item.evidenceValue}</span>
                )}
              </div>
            ) : (
              <span className="text-xs text-text-secondary">{item.evidenceValue}</span>
            )}
          </div>
        ) : (
          <button
            onClick={() => setEditingEvidence(true)}
            className="mt-1 text-[11px] text-text-tertiary opacity-0 transition-opacity group-hover:opacity-100 hover:text-text-secondary"
          >
            + Add evidence
          </button>
        )}
      </div>

      {/* Row actions — visible on hover */}
      <div className="flex shrink-0 items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
        <button
          onClick={onReorderUp}
          disabled={isFirst}
          title="Move up"
          className="flex h-6 w-6 items-center justify-center rounded text-text-tertiary transition-colors hover:bg-surface-4 hover:text-text-secondary disabled:cursor-not-allowed disabled:opacity-30"
        >
          <ChevronUp size={13} />
        </button>
        <button
          onClick={onReorderDown}
          disabled={isLast}
          title="Move down"
          className="flex h-6 w-6 items-center justify-center rounded text-text-tertiary transition-colors hover:bg-surface-4 hover:text-text-secondary disabled:cursor-not-allowed disabled:opacity-30"
        >
          <ChevronDown size={13} />
        </button>
        <button
          onClick={onDelete}
          title="Delete item"
          className="flex h-6 w-6 items-center justify-center rounded text-text-tertiary transition-colors hover:bg-red-500/10 hover:text-red-400"
        >
          <X size={13} />
        </button>
      </div>
    </div>
  )
}

// ─── Main export ──────────────────────────────────────────────────────────────

export function TaskChecklist({ taskId, readOnly = false }: { taskId: string; readOnly?: boolean }) {
  const {
    getChecklistForTask,
    toggleChecklistItem,
    getChecklistProgress,
    addChecklistItem: _add,
    updateChecklistItem,
    deleteChecklistItem,
    reorderChecklistItem,
  } = useTaskStore()

  // Suppress unused warning — _add is passed down via AddItemForm which calls
  // addChecklistItem directly from the store; we suppress the lint warning here.
  void _add

  const items = getChecklistForTask(taskId)
  const progress = getChecklistProgress(taskId)

  return (
    <div>
      {/* Progress header */}
      <div className="mb-3 flex items-center justify-between">
        <span className="text-xs font-medium text-text-secondary">Evidence Checklist</span>
        <span className="font-mono text-xs text-text-tertiary">
          {progress.completed}/{progress.total} complete
        </span>
      </div>

      {/* Progress bar */}
      <div className="mb-4 h-1 overflow-hidden rounded-full bg-surface-4">
        <div
          className="h-full rounded-full transition-all duration-500 ease-out"
          style={{
            width: progress.total > 0 ? `${(progress.completed / progress.total) * 100}%` : '0%',
            backgroundColor:
              progress.total > 0 && progress.completed === progress.total ? '#10B981' : '#3B82F6',
          }}
        />
      </div>

      {/* Items */}
      {items.length === 0 ? (
        <p className="py-4 text-center text-xs text-text-tertiary">No checklist items yet.</p>
      ) : (
        <div className={`space-y-1 ${readOnly ? 'pointer-events-none opacity-60' : ''}`}>
          {items.map((item, index) => (
            <ChecklistRow
              key={item.id}
              item={item}
              isFirst={index === 0}
              isLast={index === items.length - 1}
              onToggle={() => toggleChecklistItem(item.id)}
              onDelete={() => deleteChecklistItem(item.id)}
              onReorderUp={() => reorderChecklistItem(item.id, 'up')}
              onReorderDown={() => reorderChecklistItem(item.id, 'down')}
              onUpdateItem={(updates) => updateChecklistItem(item.id, updates)}
            />
          ))}
        </div>
      )}

      {/* Add-item form */}
      {!readOnly && (
        <AddItemForm
          taskId={taskId}
          nextSortOrder={items.length}
          onAdd={() => { /* future: scroll to new item */ }}
        />
      )}
    </div>
  )
}
