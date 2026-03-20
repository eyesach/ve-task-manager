/** Maps Supabase snake_case rows to our camelCase TypeScript types */

import type {
  Task,
  TaskAttachment,
  Profile,
  ChecklistItem,
  TaskComment,
  TaskAssignee,
  TaskDepartment,
  TaskPeriod,
  CalendarEvent,
  PrintRequest,
} from './types'

// ─── Row → Type mappers ────────────────────────────────────────────────────

export function mapTask(row: Record<string, unknown>): Task {
  return {
    id: row.id as string,
    companyId: row.company_id as string,
    taskPeriodId: row.task_period_id as string,
    departmentId: (row.department_id as string) ?? null,
    taskCode: row.task_code as string,
    title: row.title as string,
    description: row.description as string | undefined,
    attachments: Array.isArray(row.attachments)
      ? (row.attachments as TaskAttachment[])
      : undefined,
    category: row.category as Task['category'],
    priority: row.priority as Task['priority'],
    status: row.status as Task['status'],
    dueDate: row.due_date as string | undefined,
    plannedCompletion: row.planned_completion as string | undefined,
    actualCompletion: row.actual_completion as string | undefined,
    responsibilityNote: row.responsibility_note as string | undefined,
    hubPath: row.hub_path as string | undefined,
    isOptional: row.is_optional as boolean,
    isHighPriority: row.is_high_priority as boolean,
    carriedFromPeriod: row.carried_from_period as string | undefined,
    sortOrder: row.sort_order as number,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  }
}

export function mapProfile(row: Record<string, unknown>): Profile {
  return {
    id: row.id as string,
    companyId: row.company_id as string,
    departmentId: row.department_id as string,
    fullName: row.full_name as string,
    email: row.email as string,
    role: row.role as Profile['role'],
    jobTitle: row.job_title as string | undefined,
    avatarUrl: row.avatar_url as string | undefined,
  }
}

export function mapChecklistItem(row: Record<string, unknown>): ChecklistItem {
  return {
    id: row.id as string,
    taskId: row.task_id as string,
    label: row.label as string,
    requiredEvidence: row.required_evidence as string | undefined,
    evidenceValue: row.evidence_value as string | undefined,
    evidenceType: row.evidence_type as ChecklistItem['evidenceType'],
    plannedCompletion: row.planned_completion as string | undefined,
    actualCompletion: row.actual_completion as string | undefined,
    isCompleted: row.is_completed as boolean,
    completedBy: row.completed_by as string | undefined,
    sortOrder: row.sort_order as number,
  }
}

export function mapComment(row: Record<string, unknown>): TaskComment {
  return {
    id: row.id as string,
    taskId: row.task_id as string,
    profileId: row.profile_id as string,
    content: row.content as string,
    createdAt: row.created_at as string,
  }
}

export function mapAssignee(row: Record<string, unknown>): TaskAssignee {
  return {
    id: row.id as string,
    taskId: row.task_id as string,
    profileId: row.profile_id as string,
    isPrimary: row.is_primary as boolean,
  }
}

export function mapTaskDepartment(row: Record<string, unknown>): TaskDepartment {
  return {
    id: row.id as string,
    taskId: row.task_id as string,
    departmentId: row.department_id as string,
    roleDescription: row.role_description as string,
    createdAt: row.created_at as string,
  }
}

export function mapPeriod(row: Record<string, unknown>): TaskPeriod {
  return {
    id: row.id as string,
    companyId: row.company_id as string,
    name: row.name as string,
    startDate: row.start_date as string,
    endDate: row.end_date as string,
    isActive: row.is_active as boolean,
  }
}

export function mapCalendarEvent(row: Record<string, unknown>): CalendarEvent {
  return {
    id: row.id as string,
    companyId: row.company_id as string,
    title: row.title as string,
    description: row.description as string | undefined,
    eventType: row.event_type as CalendarEvent['eventType'],
    startDate: row.start_date as string,
    endDate: row.end_date as string | undefined,
    relatedTaskId: row.related_task_id as string | undefined,
  }
}

export function mapPrintRequest(row: Record<string, unknown>): PrintRequest {
  return {
    id: row.id as string,
    companyId: row.company_id as string,
    itemName: row.item_name as string,
    linkToPdf: row.link_to_pdf as string | undefined,
    requestedBy: row.requested_by as string,
    departmentId: row.department_id as string,
    quantity: row.quantity as number,
    sided: row.sided as PrintRequest['sided'],
    paperType: row.paper_type as PrintRequest['paperType'],
    notes: row.notes as string | undefined,
    status: row.status as PrintRequest['status'],
    createdAt: row.created_at as string,
  }
}

// ─── Type → Row mappers (camelCase → snake_case for inserts/updates) ────────

export function taskToRow(task: Partial<Task>): Record<string, unknown> {
  const row: Record<string, unknown> = {}
  if (task.id !== undefined) row.id = task.id
  if (task.companyId !== undefined) row.company_id = task.companyId
  if (task.taskPeriodId !== undefined) row.task_period_id = task.taskPeriodId
  if (task.departmentId !== undefined) row.department_id = task.departmentId
  if (task.taskCode !== undefined) row.task_code = task.taskCode
  if (task.title !== undefined) row.title = task.title
  if (task.description !== undefined) row.description = task.description
  if (task.attachments !== undefined) row.attachments = task.attachments
  if (task.category !== undefined) row.category = task.category
  if (task.priority !== undefined) row.priority = task.priority
  if (task.status !== undefined) row.status = task.status
  if (task.dueDate !== undefined) row.due_date = task.dueDate
  if (task.plannedCompletion !== undefined) row.planned_completion = task.plannedCompletion
  if (task.actualCompletion !== undefined) row.actual_completion = task.actualCompletion
  if (task.responsibilityNote !== undefined) row.responsibility_note = task.responsibilityNote
  if (task.hubPath !== undefined) row.hub_path = task.hubPath
  if (task.isOptional !== undefined) row.is_optional = task.isOptional
  if (task.isHighPriority !== undefined) row.is_high_priority = task.isHighPriority
  if (task.carriedFromPeriod !== undefined) row.carried_from_period = task.carriedFromPeriod
  if (task.sortOrder !== undefined) row.sort_order = task.sortOrder
  return row
}

export function checklistItemToRow(item: Partial<ChecklistItem>): Record<string, unknown> {
  const row: Record<string, unknown> = {}
  if (item.id !== undefined) row.id = item.id
  if (item.taskId !== undefined) row.task_id = item.taskId
  if (item.label !== undefined) row.label = item.label
  if (item.requiredEvidence !== undefined) row.required_evidence = item.requiredEvidence
  if (item.evidenceValue !== undefined) row.evidence_value = item.evidenceValue
  if (item.evidenceType !== undefined) row.evidence_type = item.evidenceType
  if (item.plannedCompletion !== undefined) row.planned_completion = item.plannedCompletion
  if (item.actualCompletion !== undefined) row.actual_completion = item.actualCompletion
  if (item.isCompleted !== undefined) row.is_completed = item.isCompleted
  if (item.completedBy !== undefined) row.completed_by = item.completedBy
  if (item.sortOrder !== undefined) row.sort_order = item.sortOrder
  return row
}

export function profileToRow(profile: Partial<Profile>): Record<string, unknown> {
  const row: Record<string, unknown> = {}
  if (profile.id !== undefined) row.id = profile.id
  if (profile.companyId !== undefined) row.company_id = profile.companyId
  if (profile.departmentId !== undefined) row.department_id = profile.departmentId
  if (profile.fullName !== undefined) row.full_name = profile.fullName
  if (profile.email !== undefined) row.email = profile.email
  if (profile.role !== undefined) row.role = profile.role
  if (profile.jobTitle !== undefined) row.job_title = profile.jobTitle
  return row
}

export function printRequestToRow(pr: Partial<PrintRequest>): Record<string, unknown> {
  const row: Record<string, unknown> = {}
  if (pr.id !== undefined) row.id = pr.id
  if (pr.companyId !== undefined) row.company_id = pr.companyId
  if (pr.itemName !== undefined) row.item_name = pr.itemName
  if (pr.linkToPdf !== undefined) row.link_to_pdf = pr.linkToPdf
  if (pr.requestedBy !== undefined) row.requested_by = pr.requestedBy
  if (pr.departmentId !== undefined) row.department_id = pr.departmentId
  if (pr.quantity !== undefined) row.quantity = pr.quantity
  if (pr.sided !== undefined) row.sided = pr.sided
  if (pr.paperType !== undefined) row.paper_type = pr.paperType
  if (pr.notes !== undefined) row.notes = pr.notes
  if (pr.status !== undefined) row.status = pr.status
  return row
}
