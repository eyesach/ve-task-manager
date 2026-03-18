import { create } from 'zustand'
import type { TaskPeriod } from '@/lib/types'
import { MOCK_PERIODS } from '@/lib/mockData'
import { insertPeriod as dbInsertPeriod, updatePeriodRow, deletePeriodRow } from '@/lib/supabaseService'

interface PeriodState {
  periods: TaskPeriod[]
  activePeriodId: string

  setActivePeriod: (periodId: string) => void
  addPeriod: (period: TaskPeriod) => void
  updatePeriod: (periodId: string, updates: Partial<TaskPeriod>) => void
  deletePeriod: (periodId: string) => void
  getNextPeriod: () => TaskPeriod | null
  // Realtime event handlers (pure local state, no DB writes)
  applyRealtimePeriodInsert: (period: TaskPeriod) => void
  applyRealtimePeriodUpdate: (periodId: string, updates: Partial<TaskPeriod>) => void
  applyRealtimePeriodDelete: (periodId: string) => void
}

export const usePeriodStore = create<PeriodState>((set, get) => ({
  periods: MOCK_PERIODS,
  activePeriodId: localStorage.getItem('activePeriodId') ?? '00000000-0000-0000-0002-000000000003',

  setActivePeriod: (periodId) => {
    localStorage.setItem('activePeriodId', periodId)
    set({ activePeriodId: periodId })
  },
  addPeriod: (period) => {
    set((s) => ({ periods: [...s.periods, period] }))
    dbInsertPeriod(period)
  },
  updatePeriod: (periodId, updates) => {
    set((s) => ({ periods: s.periods.map((p) => (p.id === periodId ? { ...p, ...updates } : p)) }))
    updatePeriodRow(periodId, updates)
  },
  deletePeriod: (periodId) => {
    set((s) => ({ periods: s.periods.filter((p) => p.id !== periodId) }))
    deletePeriodRow(periodId)
  },
  getNextPeriod: () => {
    const { periods, activePeriodId } = get()
    const sorted = [...periods].sort((a, b) => a.startDate.localeCompare(b.startDate))
    const activeIdx = sorted.findIndex((p) => p.id === activePeriodId)
    return activeIdx >= 0 && activeIdx < sorted.length - 1 ? sorted[activeIdx + 1]! : null
  },

  // ─── Realtime event handlers ───────────────────────────────────────────────

  applyRealtimePeriodInsert: (period) =>
    set((s) => ({
      periods: s.periods.some((p) => p.id === period.id) ? s.periods : [...s.periods, period],
    })),

  applyRealtimePeriodUpdate: (periodId, updates) =>
    set((s) => ({
      periods: s.periods.map((p) => (p.id === periodId ? { ...p, ...updates } : p)),
    })),

  applyRealtimePeriodDelete: (periodId) =>
    set((s) => ({ periods: s.periods.filter((p) => p.id !== periodId) })),
}))
