import { create } from 'zustand'
import type { PrintRequest } from '@/lib/types'
import { MOCK_PRINT_REQUESTS } from '@/lib/mockData'

interface PrintState {
  requests: PrintRequest[]
  addRequest: (request: PrintRequest) => void
  updateRequest: (id: string, updates: Partial<PrintRequest>) => void
  deleteRequest: (id: string) => void
}

export const usePrintStore = create<PrintState>((set) => ({
  requests: MOCK_PRINT_REQUESTS,
  addRequest: (request) => set((s) => ({ requests: [...s.requests, request] })),
  updateRequest: (id, updates) =>
    set((s) => ({ requests: s.requests.map((r) => (r.id === id ? { ...r, ...updates } : r)) })),
  deleteRequest: (id) =>
    set((s) => ({ requests: s.requests.filter((r) => r.id !== id) })),
}))
