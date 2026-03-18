import { create } from 'zustand'
import type { PrintRequest } from '@/lib/types'
import { MOCK_PRINT_REQUESTS } from '@/lib/mockData'
import { insertPrintRequest as dbInsertPR, updatePrintRequestRow, deletePrintRequestRow } from '@/lib/supabaseService'

interface PrintState {
  requests: PrintRequest[]
  addRequest: (request: PrintRequest) => void
  updateRequest: (id: string, updates: Partial<PrintRequest>) => void
  deleteRequest: (id: string) => void
  // Realtime event handlers (pure local state, no DB writes)
  applyRealtimeRequestInsert: (request: PrintRequest) => void
  applyRealtimeRequestUpdate: (requestId: string, updates: Partial<PrintRequest>) => void
  applyRealtimeRequestDelete: (requestId: string) => void
}

export const usePrintStore = create<PrintState>((set) => ({
  requests: MOCK_PRINT_REQUESTS,
  addRequest: (request) => {
    set((s) => ({ requests: [...s.requests, request] }))
    dbInsertPR(request)
  },
  updateRequest: (id, updates) => {
    set((s) => ({ requests: s.requests.map((r) => (r.id === id ? { ...r, ...updates } : r)) }))
    updatePrintRequestRow(id, updates)
  },
  deleteRequest: (id) => {
    set((s) => ({ requests: s.requests.filter((r) => r.id !== id) }))
    deletePrintRequestRow(id)
  },

  // ─── Realtime event handlers ───────────────────────────────────────────────

  applyRealtimeRequestInsert: (request) =>
    set((s) => ({
      requests: s.requests.some((r) => r.id === request.id) ? s.requests : [...s.requests, request],
    })),

  applyRealtimeRequestUpdate: (requestId, updates) =>
    set((s) => ({
      requests: s.requests.map((r) => (r.id === requestId ? { ...r, ...updates } : r)),
    })),

  applyRealtimeRequestDelete: (requestId) =>
    set((s) => ({ requests: s.requests.filter((r) => r.id !== requestId) })),
}))
