import { create } from 'zustand'
import type { TaskStatus, TaskPriority } from '@/lib/types'

interface FilterState {
  statusFilter: TaskStatus | null
  priorityFilter: TaskPriority | null
  assigneeFilter: string | null
  searchQuery: string

  setStatusFilter: (status: TaskStatus | null) => void
  setPriorityFilter: (priority: TaskPriority | null) => void
  setAssigneeFilter: (assigneeId: string | null) => void
  setSearchQuery: (query: string) => void
  clearFilters: () => void
}

export const useFilterStore = create<FilterState>((set) => ({
  statusFilter: null,
  priorityFilter: null,
  assigneeFilter: null,
  searchQuery: '',

  setStatusFilter: (status) => set({ statusFilter: status }),
  setPriorityFilter: (priority) => set({ priorityFilter: priority }),
  setAssigneeFilter: (assigneeId) => set({ assigneeFilter: assigneeId }),
  setSearchQuery: (query) => set({ searchQuery: query }),
  clearFilters: () =>
    set({ statusFilter: null, priorityFilter: null, assigneeFilter: null, searchQuery: '' }),
}))
