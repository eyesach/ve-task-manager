import { create } from 'zustand'
import type { TaskPeriod } from '@/lib/types'
import { MOCK_PERIODS } from '@/lib/mockData'

interface PeriodState {
  periods: TaskPeriod[]
  activePeriodId: string

  setActivePeriod: (periodId: string) => void
  addPeriod: (period: TaskPeriod) => void
  updatePeriod: (periodId: string, updates: Partial<TaskPeriod>) => void
  deletePeriod: (periodId: string) => void
  getNextPeriod: () => TaskPeriod | null
}

export const usePeriodStore = create<PeriodState>((set, get) => ({
  periods: MOCK_PERIODS,
  activePeriodId: 'period-3',

  setActivePeriod: (periodId) => set({ activePeriodId: periodId }),
  addPeriod: (period) => set((s) => ({ periods: [...s.periods, period] })),
  updatePeriod: (periodId, updates) =>
    set((s) => ({ periods: s.periods.map((p) => (p.id === periodId ? { ...p, ...updates } : p)) })),
  deletePeriod: (periodId) =>
    set((s) => ({ periods: s.periods.filter((p) => p.id !== periodId) })),
  getNextPeriod: () => {
    const { periods, activePeriodId } = get()
    const sorted = [...periods].sort((a, b) => a.startDate.localeCompare(b.startDate))
    const activeIdx = sorted.findIndex((p) => p.id === activePeriodId)
    return activeIdx >= 0 && activeIdx < sorted.length - 1 ? sorted[activeIdx + 1]! : null
  },
}))
