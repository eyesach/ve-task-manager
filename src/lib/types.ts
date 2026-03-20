export interface Company {
  id: string
  name: string
  schoolYear: string
  description?: string
}

export interface Department {
  id: string
  companyId: string
  name: string
  abbreviation: string
  color: string
  sortOrder: number
}

export interface Profile {
  id: string
  companyId: string
  departmentId: string | null
  fullName: string
  email: string
  role: 'admin' | 'department_lead' | 'member' | 'teacher' | 'creator'
  jobTitle?: string
  avatarUrl?: string
}

export interface TaskPeriod {
  id: string
  companyId: string
  name: string
  startDate: string
  endDate: string
  isActive: boolean
}

export type TaskCategory = 'department' | 'inter_department' | 'trade_show' | 'competition'
export type TaskStatus = 'not_started' | 'in_progress' | 'in_review' | 'completed' | 'carried_over'
export type TaskPriority = 'low' | 'normal' | 'high' | 'critical'
export type EvidenceType = 'text' | 'link' | 'date' | 'teacher_observation' | 'file'

export interface Task {
  id: string
  companyId: string
  taskPeriodId: string
  departmentId: string | null
  taskCode: string
  title: string
  description?: string
  category: TaskCategory
  priority: TaskPriority
  status: TaskStatus
  dueDate?: string
  plannedCompletion?: string
  actualCompletion?: string
  responsibilityNote?: string
  hubPath?: string
  isOptional: boolean
  isHighPriority: boolean
  carriedFromPeriod?: string
  sortOrder: number
  createdAt: string
  updatedAt: string
}

export interface TaskAssignee {
  id: string
  taskId: string
  profileId: string
  isPrimary: boolean
}

export interface TaskDepartment {
  id: string
  taskId: string
  departmentId: string
  roleDescription: string
  createdAt: string
}

export interface ChecklistItem {
  id: string
  taskId: string
  label: string
  requiredEvidence?: string
  evidenceValue?: string
  evidenceType: EvidenceType
  plannedCompletion?: string
  actualCompletion?: string
  isCompleted: boolean
  completedBy?: string
  sortOrder: number
}

export interface TaskComment {
  id: string
  taskId: string
  profileId: string
  content: string
  createdAt: string
}

export interface PrintRequest {
  id: string
  companyId: string
  itemName: string
  linkToPdf?: string
  requestedBy: string
  departmentId: string
  quantity: number
  sided: 'single' | 'double'
  paperType: 'plain' | 'cardstock' | 'sticker' | 'other'
  notes?: string
  status: 'pending' | 'approved' | 'printed' | 'delivered'
  createdAt: string
}

export interface CalendarEvent {
  id: string
  companyId: string
  title: string
  description?: string
  eventType: 'trade_show' | 'competition' | 'deadline' | 'meeting' | 'no_school'
  startDate: string
  endDate?: string
  relatedTaskId?: string
}

// UI-specific types
export type ViewMode = 'list' | 'board' | 'log'
export type SidebarSection = 'departments' | 'inter_department' | 'trade_shows' | 'competitions' | 'calendar' | 'print_requests'

export interface NavItem {
  id: string
  label: string
  section: SidebarSection
  departmentId?: string
  abbreviation?: string
  color?: string
  icon?: string
}
