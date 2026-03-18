import type { TaskStatus, TaskPriority, TaskCategory, EvidenceType, PrintRequest, CalendarEvent } from './types'

export const DEPARTMENTS = [
  { id: '00000000-0000-0000-0001-000000000001', name: 'Administration', abbreviation: 'AD', color: '#4F46E5', sortOrder: 0 },
  { id: '00000000-0000-0000-0001-000000000002', name: 'Accounting & Finance', abbreviation: 'AF', color: '#059669', sortOrder: 1 },
  { id: '00000000-0000-0000-0001-000000000003', name: 'Branding & Design', abbreviation: 'BD', color: '#D97706', sortOrder: 2 },
  { id: '00000000-0000-0000-0001-000000000004', name: 'Digital Operations', abbreviation: 'DO', color: '#7C3AED', sortOrder: 3 },
  { id: '00000000-0000-0000-0001-000000000005', name: 'Human Resources', abbreviation: 'HR', color: '#DC2626', sortOrder: 4 },
  { id: '00000000-0000-0000-0001-000000000006', name: 'Marketing', abbreviation: 'MK', color: '#2563EB', sortOrder: 5 },
  { id: '00000000-0000-0000-0001-000000000007', name: 'Sales & Product Development', abbreviation: 'SP', color: '#0891B2', sortOrder: 6 },
] as const

export const TASK_STATUSES: { value: TaskStatus; label: string; color: string }[] = [
  { value: 'not_started', label: 'Not Started', color: '#6B7280' },
  { value: 'in_progress', label: 'In Progress', color: '#3B82F6' },
  { value: 'in_review', label: 'In Review', color: '#F59E0B' },
  { value: 'completed', label: 'Completed', color: '#10B981' },
  { value: 'carried_over', label: 'Carried Over', color: '#EF4444' },
]

export const TASK_PRIORITIES: { value: TaskPriority; label: string; color: string }[] = [
  { value: 'low', label: 'Low', color: '#9CA3AF' },
  { value: 'normal', label: 'Normal', color: '#6B7280' },
  { value: 'high', label: 'High', color: '#F59E0B' },
  { value: 'critical', label: 'Critical', color: '#EF4444' },
]

export const TASK_CATEGORIES: { value: TaskCategory; label: string }[] = [
  { value: 'department', label: 'Department Task' },
  { value: 'inter_department', label: 'Inter-Department' },
  { value: 'trade_show', label: 'Trade Show' },
  { value: 'competition', label: 'Competition' },
]

export const EVIDENCE_TYPES: { value: EvidenceType; label: string }[] = [
  { value: 'text', label: 'Text Note' },
  { value: 'link', label: 'Google Drive Link' },
  { value: 'date', label: 'Date & Time Record' },
  { value: 'teacher_observation', label: 'Teacher Observation' },
  { value: 'file', label: 'File Upload' },
]

// Department lead titles — maps department ID to executive title
export const DEPARTMENT_LEAD_TITLES: Record<string, string> = {
  '00000000-0000-0000-0001-000000000001': 'CEO',                      // Administration
  '00000000-0000-0000-0001-000000000002': 'CFO',                      // Accounting & Finance
  '00000000-0000-0000-0001-000000000003': 'VP of Branding & Design',  // Branding & Design
  '00000000-0000-0000-0001-000000000004': 'VP of Digital Operations', // Digital Operations
  '00000000-0000-0000-0001-000000000005': 'CHRO',                     // Human Resources
  '00000000-0000-0000-0001-000000000006': 'CMO',                      // Marketing
  '00000000-0000-0000-0001-000000000007': 'CSO',                      // Sales & Product Development
}

// Default member job titles per department
export const DEPARTMENT_MEMBER_TITLES: Record<string, string[]> = {
  '00000000-0000-0000-0001-000000000001': ['COO', 'Executive Assistant', 'Administrative Coordinator'],
  '00000000-0000-0000-0001-000000000002': ['Financial Analyst', 'Accountant', 'Accounts Payable Clerk', 'Bookkeeper'],
  '00000000-0000-0000-0001-000000000003': ['Graphic Designer', 'Brand Strategist', 'Creative Director', 'Visual Designer'],
  '00000000-0000-0000-0001-000000000004': ['Web Developer', 'IT Specialist', 'Systems Administrator', 'Digital Media Specialist'],
  '00000000-0000-0000-0001-000000000005': ['HR Coordinator', 'Recruiter', 'Training Specialist', 'Benefits Administrator'],
  '00000000-0000-0000-0001-000000000006': ['Marketing Associate', 'Social Media Manager', 'Content Creator', 'Market Research Analyst'],
  '00000000-0000-0000-0001-000000000007': ['Sales Associate', 'Product Manager', 'Business Development Rep', 'Account Executive'],
}

export function getLeadTitleForDepartment(departmentId: string | null): string {
  if (!departmentId) return 'Department Lead'
  return DEPARTMENT_LEAD_TITLES[departmentId] ?? 'Department Lead'
}

export function getMemberTitlesForDepartment(departmentId: string | null): string[] {
  if (!departmentId) return ['Member']
  return DEPARTMENT_MEMBER_TITLES[departmentId] ?? ['Member']
}

export function getStatusConfig(status: TaskStatus) {
  return TASK_STATUSES.find(s => s.value === status) ?? TASK_STATUSES[0]!
}

export function getPriorityConfig(priority: TaskPriority) {
  return TASK_PRIORITIES.find(p => p.value === priority) ?? TASK_PRIORITIES[1]!
}

export function getDepartmentById(id: string) {
  return DEPARTMENTS.find(d => d.id === id)
}

export function getDepartmentByAbbr(abbr: string) {
  return DEPARTMENTS.find(d => d.abbreviation === abbr)
}

export const PRINT_STATUSES: { value: PrintRequest['status']; label: string; color: string }[] = [
  { value: 'pending', label: 'Pending', color: '#F59E0B' },
  { value: 'approved', label: 'Approved', color: '#3B82F6' },
  { value: 'printed', label: 'Printed', color: '#8B5CF6' },
  { value: 'delivered', label: 'Delivered', color: '#10B981' },
]

export const EVENT_TYPES: { value: CalendarEvent['eventType']; label: string; color: string }[] = [
  { value: 'trade_show', label: 'Trade Show', color: '#F59E0B' },
  { value: 'competition', label: 'Competition', color: '#8B5CF6' },
  { value: 'deadline', label: 'Deadline', color: '#EF4444' },
  { value: 'meeting', label: 'Meeting', color: '#3B82F6' },
  { value: 'no_school', label: 'No School', color: '#6B7280' },
]

export const PRINT_PAPER_TYPES: { value: string; label: string }[] = [
  { value: 'plain', label: 'Plain' },
  { value: 'cardstock', label: 'Cardstock' },
  { value: 'sticker', label: 'Sticker' },
  { value: 'other', label: 'Other' },
]
