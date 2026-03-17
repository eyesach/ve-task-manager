import { useState } from 'react'
import { Pencil, Trash2, Plus, Check, X, Radio } from 'lucide-react'
import { usePeriodStore } from '@/stores/periodStore'
import { ConfirmDialog } from '@/components/common/ConfirmDialog'
import { useToastStore } from '@/stores/toastStore'
import type { TaskPeriod } from '@/lib/types'

interface PeriodEditState {
  name: string
  startDate: string
  endDate: string
}

const emptyPeriod = (): PeriodEditState => ({
  name: '',
  startDate: '',
  endDate: '',
})

export function PeriodSettings() {
  const periods = usePeriodStore((s) => s.periods)
  const activePeriodId = usePeriodStore((s) => s.activePeriodId)
  const setActivePeriod = usePeriodStore((s) => s.setActivePeriod)
  const addPeriod = usePeriodStore((s) => s.addPeriod)
  const updatePeriod = usePeriodStore((s) => s.updatePeriod)
  const deletePeriod = usePeriodStore((s) => s.deletePeriod)
  const addToast = useToastStore((s) => s.addToast)

  const [editingId, setEditingId] = useState<string | null>(null)
  const [editState, setEditState] = useState<PeriodEditState>(emptyPeriod())
  const [showAddForm, setShowAddForm] = useState(false)
  const [newPeriod, setNewPeriod] = useState<PeriodEditState>(emptyPeriod())
  const [deleteTarget, setDeleteTarget] = useState<TaskPeriod | null>(null)

  const sortedPeriods = [...periods].sort((a, b) => a.startDate.localeCompare(b.startDate))

  function startEdit(period: TaskPeriod) {
    setEditingId(period.id)
    setEditState({ name: period.name, startDate: period.startDate, endDate: period.endDate })
  }

  function saveEdit(periodId: string) {
    if (!editState.name.trim()) {
      addToast('error', 'Period name is required.')
      return
    }
    updatePeriod(periodId, {
      name: editState.name.trim(),
      startDate: editState.startDate,
      endDate: editState.endDate,
    })
    setEditingId(null)
    addToast('success', 'Period updated.')
  }

  function handleAdd() {
    if (!newPeriod.name.trim()) {
      addToast('error', 'Period name is required.')
      return
    }
    const period: TaskPeriod = {
      id: crypto.randomUUID(),
      companyId: 'siply',
      name: newPeriod.name.trim(),
      startDate: newPeriod.startDate,
      endDate: newPeriod.endDate,
      isActive: false,
    }
    addPeriod(period)
    setNewPeriod(emptyPeriod())
    setShowAddForm(false)
    addToast('success', `${period.name} added.`)
  }

  function handleSetActive(periodId: string) {
    setActivePeriod(periodId)
    const period = periods.find((p) => p.id === periodId)
    addToast('success', `${period?.name ?? 'Period'} set as active.`)
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-text-secondary">{periods.length} periods</p>
        <button
          onClick={() => { setShowAddForm(true); setNewPeriod(emptyPeriod()) }}
          className="flex items-center gap-1.5 rounded-lg bg-accent px-3 py-1.5 text-sm font-medium text-white hover:bg-accent-hover"
        >
          <Plus className="h-4 w-4" />
          Add Period
        </button>
      </div>

      <div className="overflow-hidden rounded-lg border border-border-subtle bg-surface-1">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border-subtle bg-surface-2">
              <th className="px-4 py-2.5 text-left font-medium text-text-secondary">Active</th>
              <th className="px-4 py-2.5 text-left font-medium text-text-secondary">Name</th>
              <th className="px-4 py-2.5 text-left font-medium text-text-secondary">Start Date</th>
              <th className="px-4 py-2.5 text-left font-medium text-text-secondary">End Date</th>
              <th className="px-4 py-2.5 text-right font-medium text-text-secondary">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border-subtle">
            {sortedPeriods.map((period) =>
              editingId === period.id ? (
                <tr key={period.id} className="bg-surface-2">
                  <td className="px-4 py-2 text-center">
                    <button
                      onClick={() => handleSetActive(period.id)}
                      className={`rounded-full p-0.5 ${activePeriodId === period.id ? 'text-accent' : 'text-text-tertiary hover:text-accent'}`}
                      title="Set as active period"
                    >
                      <Radio className="h-4 w-4" />
                    </button>
                  </td>
                  <td className="px-4 py-2">
                    <input
                      className="w-full rounded border border-border-strong bg-surface-1 px-2 py-1 text-sm text-text-primary focus:outline-none focus:ring-1 focus:ring-accent"
                      value={editState.name}
                      onChange={(e) => setEditState((s) => ({ ...s, name: e.target.value }))}
                      autoFocus
                    />
                  </td>
                  <td className="px-4 py-2">
                    <input
                      type="date"
                      className="rounded border border-border-strong bg-surface-1 px-2 py-1 text-sm text-text-primary focus:outline-none focus:ring-1 focus:ring-accent"
                      value={editState.startDate}
                      onChange={(e) => setEditState((s) => ({ ...s, startDate: e.target.value }))}
                    />
                  </td>
                  <td className="px-4 py-2">
                    <input
                      type="date"
                      className="rounded border border-border-strong bg-surface-1 px-2 py-1 text-sm text-text-primary focus:outline-none focus:ring-1 focus:ring-accent"
                      value={editState.endDate}
                      onChange={(e) => setEditState((s) => ({ ...s, endDate: e.target.value }))}
                    />
                  </td>
                  <td className="px-4 py-2">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => saveEdit(period.id)}
                        className="rounded p-1 text-green-600 hover:bg-surface-3"
                        title="Save"
                      >
                        <Check className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => setEditingId(null)}
                        className="rounded p-1 text-text-tertiary hover:bg-surface-3"
                        title="Cancel"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                <tr key={period.id} className={`hover:bg-surface-2 ${activePeriodId === period.id ? 'bg-surface-2' : ''}`}>
                  <td className="px-4 py-3 text-center">
                    <button
                      onClick={() => handleSetActive(period.id)}
                      className={`rounded-full p-0.5 transition-colors ${activePeriodId === period.id ? 'text-accent' : 'text-text-tertiary hover:text-accent'}`}
                      title={activePeriodId === period.id ? 'Active period' : 'Set as active period'}
                    >
                      <Radio className="h-4 w-4" fill={activePeriodId === period.id ? 'currentColor' : 'none'} />
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <span className="font-medium text-text-primary">{period.name}</span>
                    {activePeriodId === period.id && (
                      <span className="ml-2 inline-flex items-center rounded-full bg-accent/10 px-1.5 py-0.5 text-xs font-medium text-accent">
                        Active
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-text-secondary">{period.startDate || '—'}</td>
                  <td className="px-4 py-3 text-text-secondary">{period.endDate || '—'}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => startEdit(period)}
                        className="rounded p-1 text-text-tertiary hover:bg-surface-3 hover:text-text-primary"
                        title="Edit"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => setDeleteTarget(period)}
                        className="rounded p-1 text-text-tertiary hover:bg-surface-3 hover:text-red-500"
                        title="Delete"
                        disabled={activePeriodId === period.id}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              )
            )}

            {showAddForm && (
              <tr className="bg-surface-2">
                <td className="px-4 py-2 text-center">
                  <Radio className="mx-auto h-4 w-4 text-text-tertiary" />
                </td>
                <td className="px-4 py-2">
                  <input
                    className="w-full rounded border border-border-strong bg-surface-1 px-2 py-1 text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-1 focus:ring-accent"
                    placeholder="Period name"
                    value={newPeriod.name}
                    onChange={(e) => setNewPeriod((s) => ({ ...s, name: e.target.value }))}
                    autoFocus
                  />
                </td>
                <td className="px-4 py-2">
                  <input
                    type="date"
                    className="rounded border border-border-strong bg-surface-1 px-2 py-1 text-sm text-text-primary focus:outline-none focus:ring-1 focus:ring-accent"
                    value={newPeriod.startDate}
                    onChange={(e) => setNewPeriod((s) => ({ ...s, startDate: e.target.value }))}
                  />
                </td>
                <td className="px-4 py-2">
                  <input
                    type="date"
                    className="rounded border border-border-strong bg-surface-1 px-2 py-1 text-sm text-text-primary focus:outline-none focus:ring-1 focus:ring-accent"
                    value={newPeriod.endDate}
                    onChange={(e) => setNewPeriod((s) => ({ ...s, endDate: e.target.value }))}
                  />
                </td>
                <td className="px-4 py-2">
                  <div className="flex items-center justify-end gap-1">
                    <button
                      onClick={handleAdd}
                      className="rounded p-1 text-green-600 hover:bg-surface-3"
                      title="Save"
                    >
                      <Check className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => setShowAddForm(false)}
                      className="rounded p-1 text-text-tertiary hover:bg-surface-3"
                      title="Cancel"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <ConfirmDialog
        open={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => {
          if (deleteTarget) {
            deletePeriod(deleteTarget.id)
            addToast('success', `${deleteTarget.name} deleted.`)
            setDeleteTarget(null)
          }
        }}
        title="Delete Period"
        message={`Delete "${deleteTarget?.name ?? 'this period'}"? Tasks referencing this period will not be deleted but may become orphaned.`}
        confirmLabel="Delete"
      />
    </div>
  )
}
