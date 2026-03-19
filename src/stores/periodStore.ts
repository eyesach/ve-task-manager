import { create } from 'zustand'
import type { TaskPeriod } from '@/lib/types'
import { MOCK_PERIODS } from '@/lib/mockData'
import { insertPeriod as dbInsertPeriod, updatePeriodRow, deletePeriodRow } from '@/lib/supabaseService'

/** Find the period whose date range contains today, or fall back to the one marked is_active in DB */
function computeActivePeriodId(periods: TaskPeriod[]): string {
  const today = new Date().toISOString().slice(0, 10) // YYYY-MM-DD
  // First: find a period where today falls within start–end range
  const byDate = periods.find(
    (p) => p.startDate && p.endDate && p.startDate <= today && today <= p.endDate
  )
  if (byDate) return byDate.id
  // Second: fall back to whichever period has is_active=true in the DB
  const dbActive = periods.find((p) => p.isActive)
  if (dbActive) return dbActive.id
  // Third: fall back to the latest period by start date
  const sorted = [...periods].sort((a, b) => b.startDate.localeCompare(a.startDate))
  return sorted[0]?.id ?? ''
}

interface PeriodState {
  periods: TaskPeriod[]
  manualOverrideId: string | null // user can pin a specific period
  activePeriodId: string

  setActivePeriod: (periodId: string) => void
  clearManualOverride: () => void
  addPeriod: (period: TaskPeriod) => void
  updatePeriod: (periodId: string, updates: Partial<TaskPeriod>) => void
  deletePeriod: (periodId: string) => void
  getNextPeriod: () => TaskPeriod | null
  // Realtime event handlers (pure local state, no DB writes)
  applyRealtimePeriodInsert: (period: TaskPeriod) => void
  applyRealtimePeriodUpdate: (periodId: string, updates: Partial<TaskPeriod>) => void
  applyRealtimePeriodDelete: (periodId: string) => void
}

/** Recompute activePeriodId from manual override or date logic */
function resolveActivePeriodId(periods: TaskPeriod[], manualOverrideId: string | null): string {
  if (manualOverrideId && periods.some((p) => p.id === manualOverrideId)) {
    return manualOverrideId
  }
  return computeActivePeriodId(periods)
}

export const usePeriodStore = create<PeriodState>((set, get) => ({
  periods: MOCK_PERIODS,
  manualOverrideId: null,
  activePeriodId: computeActivePeriodId(MOCK_PERIODS),

  setActivePeriod: (periodId) => {
    const { periods } = get()
    // Mark this period active in DB, unmark others
    for (const p of periods) {
      if (p.id === periodId && !p.isActive) {
        updatePeriodRow(p.id, { isActive: true })
      } else if (p.id !== periodId && p.isActive) {
        updatePeriodRow(p.id, { isActive: false })
      }
    }
    const updatedPeriods = periods.map((p) => ({ ...p, isActive: p.id === periodId }))
    set({
      manualOverrideId: periodId,
      periods: updatedPeriods,
      activePeriodId: periodId,
    })
  },

  clearManualOverride: () => {
    const { periods } = get()
    set({ manualOverrideId: null, activePeriodId: computeActivePeriodId(periods) })
  },

  addPeriod: (period) => {
    const { manualOverrideId } = get()
    const newPeriods = [...get().periods, period]
    set({ periods: newPeriods, activePeriodId: resolveActivePeriodId(newPeriods, manualOverrideId) })
    dbInsertPeriod(period)
  },
  updatePeriod: (periodId, updates) => {
    const { manualOverrideId } = get()
    const newPeriods = get().periods.map((p) => (p.id === periodId ? { ...p, ...updates } : p))
    set({ periods: newPeriods, activePeriodId: resolveActivePeriodId(newPeriods, manualOverrideId) })
    updatePeriodRow(periodId, updates)
  },
  deletePeriod: (periodId) => {
    const { manualOverrideId } = get()
    const override = manualOverrideId === periodId ? null : manualOverrideId
    const newPeriods = get().periods.filter((p) => p.id !== periodId)
    set({ periods: newPeriods, manualOverrideId: override, activePeriodId: resolveActivePeriodId(newPeriods, override) })
    deletePeriodRow(periodId)
  },
  getNextPeriod: () => {
    const { periods, activePeriodId } = get()
    const sorted = [...periods].sort((a, b) => a.startDate.localeCompare(b.startDate))
    const activeIdx = sorted.findIndex((p) => p.id === activePeriodId)
    return activeIdx >= 0 && activeIdx < sorted.length - 1 ? sorted[activeIdx + 1]! : null
  },

  // ─── Realtime event handlers ───────────────────────────────────────────────

  applyRealtimePeriodInsert: (period) => {
    const { manualOverrideId } = get()
    const newPeriods = get().periods.some((p) => p.id === period.id) ? get().periods : [...get().periods, period]
    set({ periods: newPeriods, activePeriodId: resolveActivePeriodId(newPeriods, manualOverrideId) })
  },

  applyRealtimePeriodUpdate: (periodId, updates) => {
    const { manualOverrideId } = get()
    const newPeriods = get().periods.map((p) => (p.id === periodId ? { ...p, ...updates } : p))
    set({ periods: newPeriods, activePeriodId: resolveActivePeriodId(newPeriods, manualOverrideId) })
  },

  applyRealtimePeriodDelete: (periodId) => {
    const { manualOverrideId } = get()
    const override = manualOverrideId === periodId ? null : manualOverrideId
    const newPeriods = get().periods.filter((p) => p.id !== periodId)
    set({ periods: newPeriods, manualOverrideId: override, activePeriodId: resolveActivePeriodId(newPeriods, override) })
  },
}))
