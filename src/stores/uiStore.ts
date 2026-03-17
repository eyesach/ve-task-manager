import { create } from 'zustand'
import type { ViewMode } from '@/lib/types'

interface UIState {
  sidebarCollapsed: boolean
  toggleSidebar: () => void

  viewMode: ViewMode
  setViewMode: (mode: ViewMode) => void

  selectedTaskId: string | null
  openTaskDetail: (taskId: string) => void
  closeTaskDetail: () => void
}

export const useUIStore = create<UIState>((set) => ({
  sidebarCollapsed: false,
  toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),

  viewMode: 'list',
  setViewMode: (mode) => set({ viewMode: mode }),

  selectedTaskId: null,
  openTaskDetail: (taskId) => set({ selectedTaskId: taskId }),
  closeTaskDetail: () => set({ selectedTaskId: null }),
}))
