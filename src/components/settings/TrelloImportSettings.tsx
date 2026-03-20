import { useState, useCallback } from 'react'
import { Upload, ChevronRight, ChevronLeft, AlertTriangle, CheckCircle, FileJson, Loader2 } from 'lucide-react'
import { useTaskStore } from '@/stores/taskStore'
import { usePeriodStore } from '@/stores/periodStore'
import { useToastStore } from '@/stores/toastStore'
import { DEPARTMENTS } from '@/lib/constants'
import { insertTask, insertChecklistItem } from '@/lib/supabaseService'
import {
  validateTrelloExport,
  buildListMappings,
  transformTrelloBoard,
  extractPeriodNumber,
  type TrelloBoard,
  type ListMapping,
  type ImportPreview,
} from '@/lib/trelloImport'

type Step = 1 | 2 | 3 | 4

export function TrelloImportSettings() {
  const [step, setStep] = useState<Step>(1)
  const [board, setBoard] = useState<TrelloBoard | null>(null)
  const [boardName, setBoardName] = useState('')
  const [mappings, setMappings] = useState<ListMapping[]>([])
  const [selectedPeriodId, setSelectedPeriodId] = useState('')
  const [preview, setPreview] = useState<ImportPreview | null>(null)
  const [error, setError] = useState('')
  const [importing, setImporting] = useState(false)
  const [importProgress, setImportProgress] = useState(0)
  const [importDone, setImportDone] = useState(false)

  const periods = usePeriodStore((s) => s.periods)
  const activePeriodId = usePeriodStore((s) => s.activePeriodId)
  const getNextTaskCode = useTaskStore((s) => s.getNextTaskCode)
  const addToast = useToastStore((s) => s.addToast)

  // ─── Step 1: File Upload ────────────────────────────────────────────────────

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setError('')
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (evt) => {
      try {
        const data = JSON.parse(evt.target?.result as string)
        const result = validateTrelloExport(data)
        if (!result.valid) {
          setError(result.error)
          return
        }
        setBoard(result.board)
        setBoardName(result.board.name || file.name)
        setMappings(buildListMappings(result.board))
      } catch {
        setError('Failed to parse JSON file.')
      }
    }
    reader.onerror = () => setError('Failed to read file.')
    reader.readAsText(file)
  }, [])

  // ─── Step 2: Mapping helpers ────────────────────────────────────────────────

  const updateMapping = useCallback((listId: string, deptAbbr: string | null) => {
    setMappings((prev) =>
      prev.map((m) => (m.trelloListId === listId ? { ...m, departmentAbbr: deptAbbr } : m)),
    )
  }, [])

  const mappedCardCount = mappings
    .filter((m) => m.departmentAbbr)
    .reduce((sum, m) => sum + m.cardCount, 0)

  // ─── Step 3: Build preview ──────────────────────────────────────────────────

  const buildPreview = useCallback(() => {
    if (!board || !selectedPeriodId) return
    const period = periods.find((p) => p.id === selectedPeriodId)
    const periodNumber = period ? extractPeriodNumber(period.name) : 1
    const result = transformTrelloBoard(board, mappings, selectedPeriodId, periodNumber, getNextTaskCode)
    setPreview(result)
  }, [board, mappings, selectedPeriodId, periods, getNextTaskCode])

  // ─── Step 4: Execute import ─────────────────────────────────────────────────

  const executeImport = useCallback(async () => {
    if (!preview) return
    setImporting(true)
    setImportProgress(0)

    const addTaskLocal = useTaskStore.getState().addTaskLocal
    const addChecklistItemLocal = useTaskStore.getState().addChecklistItemLocal

    let succeeded = 0
    let failed = 0

    for (let i = 0; i < preview.tasks.length; i++) {
      const { task, checklists } = preview.tasks[i]!
      try {
        // Add to local store immediately for optimistic UI
        addTaskLocal(task)
        // Await the Supabase insert so the row exists before checklist inserts
        await insertTask(task)
        for (const item of checklists) {
          addChecklistItemLocal(item)
          await insertChecklistItem(item)
        }
        succeeded++
      } catch (err) {
        console.error('Failed to import task:', task.title, err)
        failed++
      }
      setImportProgress(i + 1)
      // Yield to UI between tasks
      if (i % 5 === 0) await new Promise((r) => setTimeout(r, 0))
    }

    setImporting(false)
    setImportDone(true)

    if (failed === 0) {
      addToast('success', `Imported ${succeeded} tasks successfully.`)
    } else {
      addToast('error', `Imported ${succeeded} tasks, ${failed} failed.`)
    }
  }, [preview, addToast])

  // ─── Reset wizard ───────────────────────────────────────────────────────────

  const reset = useCallback(() => {
    setStep(1)
    setBoard(null)
    setBoardName('')
    setMappings([])
    setSelectedPeriodId('')
    setPreview(null)
    setError('')
    setImporting(false)
    setImportProgress(0)
    setImportDone(false)
  }, [])

  // ─── Navigation ─────────────────────────────────────────────────────────────

  const canAdvance = (): boolean => {
    if (step === 1) return board !== null
    if (step === 2) return mappedCardCount > 0
    if (step === 3) return preview !== null && preview.tasks.length > 0
    return false
  }

  const goNext = () => {
    if (step === 2) {
      // Auto-select active period if none selected
      if (!selectedPeriodId && activePeriodId) setSelectedPeriodId(activePeriodId)
    }
    if (step === 3 && !preview) {
      buildPreview()
      return // stay on step 3 until preview is built
    }
    setStep((s) => Math.min(s + 1, 4) as Step)
  }

  const goBack = () => setStep((s) => Math.max(s - 1, 1) as Step)

  // ─── Render ─────────────────────────────────────────────────────────────────

  const inputCls =
    'w-full rounded-md border border-border-default bg-bg-secondary px-3 py-2 text-sm text-text-primary placeholder:text-text-tertiary focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent'
  const btnPrimary =
    'flex items-center gap-2 rounded-md bg-accent px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-accent/90 disabled:opacity-50 disabled:cursor-not-allowed'
  const btnSecondary =
    'flex items-center gap-2 rounded-md border border-border-default px-4 py-2 text-sm font-medium text-text-secondary transition-colors hover:bg-bg-secondary disabled:opacity-50'

  return (
    <div className="space-y-6">
      {/* Step indicator */}
      <div className="flex items-center gap-2 text-sm">
        {(['Upload', 'Map Departments', 'Preview', 'Import'] as const).map((label, i) => (
          <div key={label} className="flex items-center gap-2">
            {i > 0 && <ChevronRight className="h-4 w-4 text-text-tertiary" />}
            <span
              className={
                step === i + 1
                  ? 'font-medium text-accent'
                  : step > i + 1
                    ? 'text-green-400'
                    : 'text-text-tertiary'
              }
            >
              {i + 1}. {label}
            </span>
          </div>
        ))}
      </div>

      {/* ─── Step 1: Upload ──────────────────────────────────────────────── */}
      {step === 1 && (
        <div className="space-y-4">
          <p className="text-sm text-text-secondary">
            Upload a Trello board JSON export. In Trello, go to Menu → More → Print and Export → Export as JSON.
          </p>

          <label className="flex cursor-pointer flex-col items-center gap-3 rounded-lg border-2 border-dashed border-border-default p-8 transition-colors hover:border-accent hover:bg-bg-secondary">
            <Upload className="h-8 w-8 text-text-tertiary" />
            <span className="text-sm text-text-secondary">
              {board ? 'Choose a different file' : 'Click to select a .json file'}
            </span>
            <input
              type="file"
              accept=".json"
              className="hidden"
              onChange={handleFileSelect}
            />
          </label>

          {error && (
            <div className="flex items-center gap-2 rounded-md border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-400">
              <AlertTriangle className="h-4 w-4 flex-shrink-0" />
              {error}
            </div>
          )}

          {board && (
            <div className="rounded-md border border-border-default bg-bg-secondary p-4">
              <div className="flex items-center gap-2 text-sm font-medium text-text-primary">
                <FileJson className="h-4 w-4 text-accent" />
                {boardName}
              </div>
              <div className="mt-2 flex gap-4 text-xs text-text-tertiary">
                <span>{board.lists.filter((l) => !l.closed).length} lists</span>
                <span>{board.cards.filter((c) => !c.closed).length} cards</span>
                <span>{board.checklists.length} checklists</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ─── Step 2: Map Departments ─────────────────────────────────────── */}
      {step === 2 && (
        <div className="space-y-4">
          <p className="text-sm text-text-secondary">
            Map each Trello list to an app department. Lists set to "Skip" will not be imported.
          </p>

          <div className="overflow-hidden rounded-md border border-border-default">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border-default bg-bg-secondary text-left text-xs text-text-tertiary">
                  <th className="px-4 py-2">Trello List</th>
                  <th className="px-4 py-2 text-center">Cards</th>
                  <th className="px-4 py-2">Map To</th>
                </tr>
              </thead>
              <tbody>
                {mappings.map((m) => (
                  <tr key={m.trelloListId} className="border-b border-border-subtle last:border-0">
                    <td className="px-4 py-2 text-text-primary">{m.trelloListName}</td>
                    <td className="px-4 py-2 text-center text-text-tertiary">{m.cardCount}</td>
                    <td className="px-4 py-2">
                      <select
                        value={m.departmentAbbr ?? ''}
                        onChange={(e) =>
                          updateMapping(m.trelloListId, e.target.value || null)
                        }
                        className={inputCls}
                      >
                        <option value="">Skip (do not import)</option>
                        {DEPARTMENTS.map((d) => (
                          <option key={d.abbreviation} value={d.abbreviation}>
                            {d.name} ({d.abbreviation})
                          </option>
                        ))}
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <p className="text-xs text-text-tertiary">
            {mappedCardCount} card{mappedCardCount !== 1 ? 's' : ''} will be imported.
          </p>
        </div>
      )}

      {/* ─── Step 3: Preview ─────────────────────────────────────────────── */}
      {step === 3 && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-end gap-4">
            <div>
              <label className="mb-1 block text-xs font-medium text-text-secondary">Target Period</label>
              <select
                value={selectedPeriodId}
                onChange={(e) => {
                  setSelectedPeriodId(e.target.value)
                  setPreview(null) // reset preview when period changes
                }}
                className={inputCls + ' w-64'}
              >
                <option value="">Select a period...</option>
                {periods.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
            <button
              onClick={buildPreview}
              disabled={!selectedPeriodId}
              className={btnPrimary}
            >
              Generate Preview
            </button>
          </div>

          {periods.length === 0 && (
            <div className="flex items-center gap-2 rounded-md border border-amber-500/30 bg-amber-500/10 p-3 text-sm text-amber-400">
              <AlertTriangle className="h-4 w-4 flex-shrink-0" />
              No periods found. Create a task period in the Periods tab first.
            </div>
          )}

          {preview && (
            <>
              <div className="flex gap-4 text-sm">
                <span className="text-text-primary">
                  <strong>{preview.stats.importable}</strong> tasks to import
                </span>
                {preview.stats.skipped > 0 && (
                  <span className="text-amber-400">
                    {preview.stats.skipped} skipped
                  </span>
                )}
              </div>

              {/* Task preview list grouped by department */}
              <div className="max-h-96 space-y-3 overflow-y-auto">
                {(() => {
                  const byDept = new Map<string, typeof preview.tasks>()
                  for (const t of preview.tasks) {
                    const deptId = t.task.departmentId ?? 'other'
                    const arr = byDept.get(deptId) ?? []
                    arr.push(t)
                    byDept.set(deptId, arr)
                  }

                  return Array.from(byDept.entries()).map(([deptId, tasks]) => {
                    const dept = DEPARTMENTS.find((d) => d.id === deptId)
                    return (
                      <div key={deptId} className="rounded-md border border-border-default">
                        <div
                          className="flex items-center gap-2 border-b border-border-subtle px-4 py-2 text-xs font-medium"
                          style={{ color: dept?.color }}
                        >
                          <span
                            className="h-2 w-2 rounded-full"
                            style={{ backgroundColor: dept?.color }}
                          />
                          {dept?.name ?? 'Other'} ({tasks.length})
                        </div>
                        <div className="divide-y divide-border-subtle">
                          {tasks.map((t) => (
                            <div key={t.trelloCardId} className="flex items-center gap-3 px-4 py-2 text-sm">
                              <span className="font-mono text-xs text-accent">{t.task.taskCode}</span>
                              <span className="flex-1 truncate text-text-primary">{t.task.title}</span>
                              {t.checklists.length > 0 && (
                                <span className="text-xs text-text-tertiary">
                                  {t.checklists.length} items
                                </span>
                              )}
                              {t.task.dueDate && (
                                <span className="text-xs text-text-tertiary">{t.task.dueDate}</span>
                              )}
                              {t.warnings.map((w) => (
                                <span key={w} className="rounded bg-amber-500/20 px-1.5 py-0.5 text-xs text-amber-400">
                                  {w}
                                </span>
                              ))}
                            </div>
                          ))}
                        </div>
                      </div>
                    )
                  })
                })()}
              </div>

              {preview.skippedCards.length > 0 && (
                <details className="text-sm">
                  <summary className="cursor-pointer text-text-tertiary hover:text-text-secondary">
                    {preview.skippedCards.length} skipped card{preview.skippedCards.length !== 1 ? 's' : ''}
                  </summary>
                  <ul className="mt-1 space-y-1 pl-4 text-xs text-text-tertiary">
                    {preview.skippedCards.map((s, i) => (
                      <li key={i}>
                        {s.name} — {s.reason}
                      </li>
                    ))}
                  </ul>
                </details>
              )}
            </>
          )}
        </div>
      )}

      {/* ─── Step 4: Import ──────────────────────────────────────────────── */}
      {step === 4 && (
        <div className="space-y-4">
          {!importDone && !importing && preview && (
            <div className="space-y-3">
              <p className="text-sm text-text-secondary">
                Ready to import <strong>{preview.stats.importable}</strong> tasks with{' '}
                <strong>{preview.tasks.reduce((s, t) => s + t.checklists.length, 0)}</strong> checklist items.
              </p>
              <button onClick={executeImport} className={btnPrimary}>
                Import Tasks
              </button>
            </div>
          )}

          {importing && preview && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-text-secondary">
                <Loader2 className="h-4 w-4 animate-spin" />
                Importing task {importProgress} of {preview.tasks.length}...
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-bg-tertiary">
                <div
                  className="h-full rounded-full bg-accent transition-all"
                  style={{ width: `${(importProgress / preview.tasks.length) * 100}%` }}
                />
              </div>
            </div>
          )}

          {importDone && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm text-green-400">
                <CheckCircle className="h-5 w-5" />
                Import complete!
              </div>
              <button onClick={reset} className={btnSecondary}>
                Import Another Board
              </button>
            </div>
          )}
        </div>
      )}

      {/* ─── Navigation buttons ──────────────────────────────────────────── */}
      {!importDone && (
        <div className="flex justify-between border-t border-border-subtle pt-4">
          <button
            onClick={step === 1 ? reset : goBack}
            disabled={step === 1 && !board}
            className={btnSecondary}
          >
            <ChevronLeft className="h-4 w-4" />
            {step === 1 ? 'Reset' : 'Back'}
          </button>

          {step < 4 && (
            <button onClick={goNext} disabled={!canAdvance()} className={btnPrimary}>
              Next
              <ChevronRight className="h-4 w-4" />
            </button>
          )}
        </div>
      )}
    </div>
  )
}
