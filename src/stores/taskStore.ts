import { create } from 'zustand'
import type {
  Task,
  ChecklistItem,
  TaskComment,
  TaskDepartment,
  TaskAssignee,
  Profile,
  TaskStatus,
  TaskPriority,
  TaskCategory,
  EvidenceType,
} from '@/lib/types'
import {
  MOCK_TASKS,
  MOCK_CHECKLISTS,
  MOCK_ASSIGNEES,
  MOCK_PROFILES,
  MOCK_COMMENTS,
  MOCK_TASK_DEPARTMENTS,
} from '@/lib/mockData'
import {
  insertTask,
  updateTaskRow,
  deleteTaskRow,
  deleteTasksByPeriodRow,
  insertChecklistItem as dbInsertChecklist,
  updateChecklistItemRow,
  deleteChecklistItemRow,
  insertAssignee as dbInsertAssignee,
  deleteAssigneeRow,
  updateAssigneeRow,
  insertComment as dbInsertComment,
  deleteCommentRow,
  insertTaskDepartment as dbInsertTaskDept,
  deleteTaskDepartmentRow,
  insertProfile as dbInsertProfile,
  updateProfileRow,
  deleteProfileRow,
} from '@/lib/supabaseService'

// Suppress unused-import lint warnings for re-exported types used only in JSDoc
void (undefined as unknown as TaskPriority)
void (undefined as unknown as TaskCategory)
void (undefined as unknown as EvidenceType)

interface TaskState {
  tasks: Task[]
  checklists: ChecklistItem[]
  assignees: TaskAssignee[]
  profiles: Profile[]
  comments: TaskComment[]
  taskDepartments: TaskDepartment[]

  // --- Selectors (existing) ---
  getTaskById: (id: string) => Task | undefined
  getTasksByDepartment: (deptId: string) => Task[]
  getTasksByCategory: (category: string) => Task[]
  getChecklistForTask: (taskId: string) => ChecklistItem[]
  getAssigneesForTask: (taskId: string) => Profile[]
  getChecklistProgress: (taskId: string) => { completed: number; total: number }

  // --- Mutations (existing) ---
  updateTaskStatus: (taskId: string, status: TaskStatus) => void
  updateTaskDescription: (taskId: string, description: string) => void
  toggleChecklistItem: (itemId: string) => void

  // --- Task CRUD ---
  addTask: (task: Task) => void
  updateTask: (taskId: string, updates: Partial<Task>) => void
  deleteTask: (taskId: string) => void
  deleteTasksByPeriod: (periodId: string) => void

  // --- Assignee CRUD ---
  addAssignee: (taskId: string, profileId: string, isPrimary: boolean) => void
  removeAssignee: (taskId: string, profileId: string) => void
  togglePrimaryAssignee: (taskId: string, profileId: string) => void

  // --- Checklist CRUD ---
  addChecklistItem: (item: ChecklistItem) => void
  updateChecklistItem: (itemId: string, updates: Partial<ChecklistItem>) => void
  deleteChecklistItem: (itemId: string) => void
  reorderChecklistItem: (itemId: string, direction: 'up' | 'down') => void

  // --- Comments ---
  getCommentsForTask: (taskId: string) => TaskComment[]
  addComment: (comment: TaskComment) => void
  deleteComment: (commentId: string) => void

  // --- Task Departments ---
  getTaskDepartments: (taskId: string) => TaskDepartment[]
  addTaskDepartment: (td: TaskDepartment) => void
  removeTaskDepartment: (tdId: string) => void

  // --- Profile CRUD (admin) ---
  addProfile: (profile: Profile) => void
  updateProfile: (profileId: string, updates: Partial<Profile>) => Promise<{ authError?: string }>
  deleteProfile: (profileId: string) => void

  // --- Task code helper ---
  getNextTaskCode: (departmentAbbr: string, periodNumber: number) => string

  // --- Realtime event handlers (pure local state, no DB writes) ---
  applyRealtimeTaskInsert: (task: Task) => void
  applyRealtimeTaskUpdate: (taskId: string, updates: Partial<Task>) => void
  applyRealtimeTaskDelete: (taskId: string) => void
  applyRealtimeChecklistInsert: (item: ChecklistItem) => void
  applyRealtimeChecklistUpdate: (itemId: string, updates: Partial<ChecklistItem>) => void
  applyRealtimeChecklistDelete: (itemId: string) => void
  applyRealtimeAssigneeInsert: (assignee: TaskAssignee) => void
  applyRealtimeAssigneeUpdate: (assigneeId: string, updates: Partial<TaskAssignee>) => void
  applyRealtimeAssigneeDelete: (assigneeId: string) => void
  applyRealtimeCommentInsert: (comment: TaskComment) => void
  applyRealtimeCommentUpdate: (commentId: string, updates: Partial<TaskComment>) => void
  applyRealtimeCommentDelete: (commentId: string) => void
  applyRealtimeProfileInsert: (profile: Profile) => void
  applyRealtimeProfileUpdate: (profileId: string, updates: Partial<Profile>) => void
  applyRealtimeProfileDelete: (profileId: string) => void
}

export const useTaskStore = create<TaskState>((set, get) => ({
  tasks: MOCK_TASKS,
  checklists: MOCK_CHECKLISTS,
  assignees: MOCK_ASSIGNEES,
  profiles: MOCK_PROFILES,
  comments: MOCK_COMMENTS,
  taskDepartments: MOCK_TASK_DEPARTMENTS,

  // ─── Selectors (existing) ───────────────────────────────────────────────────

  getTaskById: (id) => get().tasks.find((t) => t.id === id),

  getTasksByDepartment: (deptId) =>
    get().tasks.filter((t) => t.departmentId === deptId && t.category === 'department'),

  getTasksByCategory: (category) =>
    get().tasks.filter((t) => t.category === category),

  getChecklistForTask: (taskId) =>
    get()
      .checklists.filter((c) => c.taskId === taskId)
      .sort((a, b) => a.sortOrder - b.sortOrder),

  getAssigneesForTask: (taskId) => {
    const assigneeLinks = get().assignees.filter((a) => a.taskId === taskId)
    const profileIds = assigneeLinks.map((a) => a.profileId)
    return get().profiles.filter((p) => profileIds.includes(p.id))
  },

  getChecklistProgress: (taskId) => {
    const items = get().checklists.filter((c) => c.taskId === taskId)
    return {
      completed: items.filter((c) => c.isCompleted).length,
      total: items.length,
    }
  },

  // ─── Mutations (existing) ───────────────────────────────────────────────────

  updateTaskStatus: (taskId, status) => {
    set((s) => ({
      tasks: s.tasks.map((t) =>
        t.id === taskId ? { ...t, status, updatedAt: new Date().toISOString() } : t
      ),
    }))
    updateTaskRow(taskId, { status })
  },

  updateTaskDescription: (taskId, description) => {
    set((s) => ({
      tasks: s.tasks.map((t) =>
        t.id === taskId ? { ...t, description, updatedAt: new Date().toISOString() } : t
      ),
    }))
    updateTaskRow(taskId, { description })
  },

  toggleChecklistItem: (itemId) => {
    const item = get().checklists.find((c) => c.id === itemId)
    const newVal = item ? !item.isCompleted : true
    set((s) => ({
      checklists: s.checklists.map((c) =>
        c.id === itemId ? { ...c, isCompleted: newVal } : c
      ),
    }))
    updateChecklistItemRow(itemId, { isCompleted: newVal })
  },

  // ─── Task CRUD ──────────────────────────────────────────────────────────────

  addTask: (task) => {
    set((s) => ({ tasks: [...s.tasks, task] }))
    insertTask(task)
  },

  updateTask: (taskId, updates) => {
    set((s) => ({
      tasks: s.tasks.map((t) =>
        t.id === taskId ? { ...t, ...updates, updatedAt: new Date().toISOString() } : t
      ),
    }))
    updateTaskRow(taskId, updates)
  },

  deleteTask: (taskId) => {
    set((s) => ({
      tasks: s.tasks.filter((t) => t.id !== taskId),
      checklists: s.checklists.filter((c) => c.taskId !== taskId),
      assignees: s.assignees.filter((a) => a.taskId !== taskId),
      comments: s.comments.filter((cm) => cm.taskId !== taskId),
      taskDepartments: s.taskDepartments.filter((td) => td.taskId !== taskId),
    }))
    deleteTaskRow(taskId)
  },

  deleteTasksByPeriod: (periodId) => {
    const taskIds = get().tasks.filter((t) => t.taskPeriodId === periodId).map((t) => t.id)
    set((s) => ({
      tasks: s.tasks.filter((t) => t.taskPeriodId !== periodId),
      checklists: s.checklists.filter((c) => !taskIds.includes(c.taskId)),
      assignees: s.assignees.filter((a) => !taskIds.includes(a.taskId)),
      comments: s.comments.filter((cm) => !taskIds.includes(cm.taskId)),
      taskDepartments: s.taskDepartments.filter((td) => !taskIds.includes(td.taskId)),
    }))
    deleteTasksByPeriodRow(periodId)
  },

  // ─── Assignee CRUD ──────────────────────────────────────────────────────────

  addAssignee: (taskId, profileId, isPrimary) => {
    const assignee = { id: crypto.randomUUID(), taskId, profileId, isPrimary }
    set((s) => ({ assignees: [...s.assignees, assignee] }))
    dbInsertAssignee(assignee)
  },

  removeAssignee: (taskId, profileId) => {
    set((s) => ({
      assignees: s.assignees.filter(
        (a) => !(a.taskId === taskId && a.profileId === profileId)
      ),
    }))
    deleteAssigneeRow(taskId, profileId)
  },

  togglePrimaryAssignee: (taskId, profileId) => {
    const existing = get().assignees.find((a) => a.taskId === taskId && a.profileId === profileId)
    const newVal = existing ? !existing.isPrimary : true
    set((s) => ({
      assignees: s.assignees.map((a) =>
        a.taskId === taskId && a.profileId === profileId
          ? { ...a, isPrimary: newVal }
          : a
      ),
    }))
    updateAssigneeRow(taskId, profileId, newVal)
  },

  // ─── Checklist CRUD ─────────────────────────────────────────────────────────

  addChecklistItem: (item) => {
    set((s) => ({ checklists: [...s.checklists, item] }))
    dbInsertChecklist(item)
  },

  updateChecklistItem: (itemId, updates) => {
    set((s) => ({
      checklists: s.checklists.map((c) =>
        c.id === itemId ? { ...c, ...updates } : c
      ),
    }))
    updateChecklistItemRow(itemId, updates)
  },

  deleteChecklistItem: (itemId) => {
    set((s) => ({ checklists: s.checklists.filter((c) => c.id !== itemId) }))
    deleteChecklistItemRow(itemId)
  },

  reorderChecklistItem: (itemId, direction) => {
    const state = get()
    const item = state.checklists.find((c) => c.id === itemId)
    if (!item) return

    const taskItems = state.checklists
      .filter((c) => c.taskId === item.taskId)
      .sort((a, b) => a.sortOrder - b.sortOrder)

    const idx = taskItems.findIndex((c) => c.id === itemId)
    const swapIdx = direction === 'up' ? idx - 1 : idx + 1
    if (swapIdx < 0 || swapIdx >= taskItems.length) return

    const swapItem = taskItems[swapIdx]
    if (!swapItem) return

    const newSortOrderForItem = swapItem.sortOrder
    const newSortOrderForSwap = item.sortOrder
    const swapItemId = swapItem.id

    set((s) => ({
      checklists: s.checklists.map((c) => {
        if (c.id === itemId) return { ...c, sortOrder: newSortOrderForItem }
        if (c.id === swapItemId) return { ...c, sortOrder: newSortOrderForSwap }
        return c
      }),
    }))
    updateChecklistItemRow(itemId, { sortOrder: newSortOrderForItem })
    updateChecklistItemRow(swapItemId, { sortOrder: newSortOrderForSwap })
  },

  // ─── Comments ───────────────────────────────────────────────────────────────

  getCommentsForTask: (taskId) =>
    get()
      .comments.filter((cm) => cm.taskId === taskId)
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt)),

  addComment: (comment) => {
    set((s) => ({ comments: [...s.comments, comment] }))
    dbInsertComment(comment)
  },

  deleteComment: (commentId) => {
    set((s) => ({ comments: s.comments.filter((cm) => cm.id !== commentId) }))
    deleteCommentRow(commentId)
  },

  // ─── Task Departments ────────────────────────────────────────────────────────

  getTaskDepartments: (taskId) =>
    get().taskDepartments.filter((td) => td.taskId === taskId),

  addTaskDepartment: (td) => {
    set((s) => ({ taskDepartments: [...s.taskDepartments, td] }))
    dbInsertTaskDept(td)
  },

  removeTaskDepartment: (tdId) => {
    set((s) => ({
      taskDepartments: s.taskDepartments.filter((td) => td.id !== tdId),
    }))
    deleteTaskDepartmentRow(tdId)
  },

  // ─── Profile CRUD (admin) ────────────────────────────────────────────────────

  addProfile: (profile) => {
    set((s) => ({ profiles: [...s.profiles, profile] }))
    dbInsertProfile(profile)
  },

  updateProfile: async (profileId, updates) => {
    set((s) => ({
      profiles: s.profiles.map((p) =>
        p.id === profileId ? { ...p, ...updates } : p
      ),
    }))
    return await updateProfileRow(profileId, updates)
  },

  deleteProfile: (profileId) => {
    set((s) => ({
      profiles: s.profiles.filter((p) => p.id !== profileId),
      assignees: s.assignees.filter((a) => a.profileId !== profileId),
    }))
    deleteProfileRow(profileId)
  },

  // ─── Task code helper ────────────────────────────────────────────────────────

  getNextTaskCode: (departmentAbbr, periodNumber) => {
    const prefix = `${departmentAbbr} ${periodNumber}.`
    const existing = get()
      .tasks
      .filter((t) => t.taskCode.startsWith(prefix))
      .map((t) => {
        const seq = parseInt(t.taskCode.slice(prefix.length), 10)
        return isNaN(seq) ? 0 : seq
      })
    const maxSeq = existing.length > 0 ? Math.max(...existing) : 0
    return `${prefix}${maxSeq + 1}`
  },

  // ─── Realtime event handlers (pure local state, no DB writes) ──────────────

  applyRealtimeTaskInsert: (task) =>
    set((s) => ({
      tasks: s.tasks.some((t) => t.id === task.id) ? s.tasks : [...s.tasks, task],
    })),

  applyRealtimeTaskUpdate: (taskId, updates) =>
    set((s) => ({
      tasks: s.tasks.map((t) => (t.id === taskId ? { ...t, ...updates } : t)),
    })),

  applyRealtimeTaskDelete: (taskId) =>
    set((s) => ({
      tasks: s.tasks.filter((t) => t.id !== taskId),
      checklists: s.checklists.filter((c) => c.taskId !== taskId),
      assignees: s.assignees.filter((a) => a.taskId !== taskId),
      comments: s.comments.filter((cm) => cm.taskId !== taskId),
      taskDepartments: s.taskDepartments.filter((td) => td.taskId !== taskId),
    })),

  applyRealtimeChecklistInsert: (item) =>
    set((s) => ({
      checklists: s.checklists.some((c) => c.id === item.id) ? s.checklists : [...s.checklists, item],
    })),

  applyRealtimeChecklistUpdate: (itemId, updates) =>
    set((s) => ({
      checklists: s.checklists.map((c) => (c.id === itemId ? { ...c, ...updates } : c)),
    })),

  applyRealtimeChecklistDelete: (itemId) =>
    set((s) => ({
      checklists: s.checklists.filter((c) => c.id !== itemId),
    })),

  applyRealtimeAssigneeInsert: (assignee) =>
    set((s) => ({
      assignees: s.assignees.some((a) => a.id === assignee.id) ? s.assignees : [...s.assignees, assignee],
    })),

  applyRealtimeAssigneeUpdate: (assigneeId: string, updates: Partial<TaskAssignee>) =>
    set((s) => ({
      assignees: s.assignees.map((a) => (a.id === assigneeId ? { ...a, ...updates } : a)),
    })),

  applyRealtimeAssigneeDelete: (assigneeId) =>
    set((s) => ({
      assignees: s.assignees.filter((a) => a.id !== assigneeId),
    })),

  applyRealtimeCommentInsert: (comment) =>
    set((s) => ({
      comments: s.comments.some((cm) => cm.id === comment.id) ? s.comments : [...s.comments, comment],
    })),

  applyRealtimeCommentUpdate: (commentId: string, updates: Partial<TaskComment>) =>
    set((s) => ({
      comments: s.comments.map((cm) => (cm.id === commentId ? { ...cm, ...updates } : cm)),
    })),

  applyRealtimeCommentDelete: (commentId) =>
    set((s) => ({
      comments: s.comments.filter((cm) => cm.id !== commentId),
    })),

  applyRealtimeProfileInsert: (profile) =>
    set((s) => ({
      profiles: s.profiles.some((p) => p.id === profile.id) ? s.profiles : [...s.profiles, profile],
    })),

  applyRealtimeProfileUpdate: (profileId, updates) =>
    set((s) => ({
      profiles: s.profiles.map((p) => (p.id === profileId ? { ...p, ...updates } : p)),
    })),

  applyRealtimeProfileDelete: (profileId) =>
    set((s) => ({
      profiles: s.profiles.filter((p) => p.id !== profileId),
      assignees: s.assignees.filter((a) => a.profileId !== profileId),
    })),
}))
