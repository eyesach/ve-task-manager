/**
 * Supabase CRUD service layer.
 * All database reads and writes go through here.
 * Returns mapped camelCase objects ready for Zustand stores.
 */

import { supabase } from './supabase'
import {
  mapTask,
  mapProfile,
  mapChecklistItem,
  mapComment,
  mapAssignee,
  mapTaskDepartment,
  mapPeriod,
  mapCalendarEvent,
  mapPrintRequest,
  taskToRow,
  checklistItemToRow,
  profileToRow,
  printRequestToRow,
} from './supabase-types'
import type {
  Task,
  Profile,
  ChecklistItem,
  TaskComment,
  TaskAssignee,
  TaskDepartment,
  TaskPeriod,
  CalendarEvent,
  PrintRequest,
  Company,
} from './types'

let _companyId: string | null = null

export function setCompanyId(id: string) {
  _companyId = id
}

function getCompanyId(): string {
  if (!_companyId) {
    console.warn('Company ID not set, using fallback')
    return '00000000-0000-0000-0000-000000000001'
  }
  return _companyId
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function isSupabaseConfigured(): boolean {
  const url = import.meta.env.VITE_SUPABASE_URL as string | undefined
  return Boolean(url && !url.includes('your-project'))
}

// ─── Fetch all data for initial sync ─────────────────────────────────────────

export async function fetchAllData() {
  if (!isSupabaseConfigured()) return null

  const [
    tasksRes,
    profilesRes,
    checklistsRes,
    commentsRes,
    assigneesRes,
    taskDeptsRes,
    periodsRes,
    eventsRes,
    printRes,
    companyRes,
  ] = await Promise.all([
    supabase.from('tasks').select('*').eq('company_id', getCompanyId()).order('sort_order'),
    supabase.from('profiles').select('*').eq('company_id', getCompanyId()).order('full_name'),
    supabase.from('checklist_items').select('*').order('sort_order'),
    supabase.from('task_comments').select('*').order('created_at'),
    supabase.from('task_assignees').select('*'),
    supabase.from('task_departments').select('*'),
    supabase.from('task_periods').select('*').eq('company_id', getCompanyId()).order('start_date'),
    supabase.from('calendar_events').select('*').eq('company_id', getCompanyId()).order('start_date'),
    supabase.from('print_requests').select('*').eq('company_id', getCompanyId()).order('created_at'),
    supabase.from('companies').select('*').eq('id', getCompanyId()).single(),
  ])

  // If any critical fetch fails, return null to fall back to mock data
  if (tasksRes.error || profilesRes.error || periodsRes.error) {
    console.error('Supabase fetch error:', tasksRes.error || profilesRes.error || periodsRes.error)
    return null
  }

  return {
    tasks: (tasksRes.data ?? []).map(mapTask),
    profiles: (profilesRes.data ?? []).map(mapProfile),
    checklists: (checklistsRes.data ?? []).map(mapChecklistItem),
    comments: (commentsRes.data ?? []).map(mapComment),
    assignees: (assigneesRes.data ?? []).map(mapAssignee),
    taskDepartments: (taskDeptsRes.data ?? []).map(mapTaskDepartment),
    periods: (periodsRes.data ?? []).map(mapPeriod),
    events: (eventsRes.data ?? []).map(mapCalendarEvent),
    printRequests: (printRes.data ?? []).map(mapPrintRequest),
    company: companyRes.data
      ? {
          id: companyRes.data.id as string,
          name: companyRes.data.name as string,
          schoolYear: (companyRes.data.school_year as string) ?? '',
          description: (companyRes.data.description as string) ?? '',
        }
      : null,
  }
}

// ─── Tasks ────────────────────────────────────────────────────────────────────

export async function insertTask(task: Task) {
  if (!isSupabaseConfigured()) return
  const { error } = await supabase.from('tasks').insert(taskToRow({ ...task, companyId: getCompanyId() }))
  if (error) console.error('insertTask:', error)
}

export async function updateTaskRow(taskId: string, updates: Partial<Task>) {
  if (!isSupabaseConfigured()) return
  const { error } = await supabase.from('tasks').update(taskToRow(updates)).eq('id', taskId)
  if (error) console.error('updateTask:', error)
}

export async function deleteTaskRow(taskId: string) {
  if (!isSupabaseConfigured()) return
  const { error } = await supabase.from('tasks').delete().eq('id', taskId)
  if (error) console.error('deleteTask:', error)
}

export async function deleteTasksByPeriodRow(periodId: string) {
  if (!isSupabaseConfigured()) return
  const { error } = await supabase.from('tasks').delete().eq('task_period_id', periodId)
  if (error) console.error('deleteTasksByPeriod:', error)
}

// ─── Checklist Items ─────────────────────────────────────────────────────────

export async function insertChecklistItem(item: ChecklistItem) {
  if (!isSupabaseConfigured()) return
  const { error } = await supabase.from('checklist_items').insert(checklistItemToRow(item))
  if (error) console.error('insertChecklistItem:', error)
}

export async function updateChecklistItemRow(itemId: string, updates: Partial<ChecklistItem>) {
  if (!isSupabaseConfigured()) return
  const { error } = await supabase.from('checklist_items').update(checklistItemToRow(updates)).eq('id', itemId)
  if (error) console.error('updateChecklistItem:', error)
}

export async function deleteChecklistItemRow(itemId: string) {
  if (!isSupabaseConfigured()) return
  const { error } = await supabase.from('checklist_items').delete().eq('id', itemId)
  if (error) console.error('deleteChecklistItem:', error)
}

// ─── Assignees ────────────────────────────────────────────────────────────────

export async function insertAssignee(assignee: TaskAssignee) {
  if (!isSupabaseConfigured()) return
  const { error } = await supabase.from('task_assignees').insert({
    id: assignee.id,
    task_id: assignee.taskId,
    profile_id: assignee.profileId,
    is_primary: assignee.isPrimary,
  })
  if (error) console.error('insertAssignee:', error)
}

export async function deleteAssigneeRow(taskId: string, profileId: string) {
  if (!isSupabaseConfigured()) return
  const { error } = await supabase
    .from('task_assignees')
    .delete()
    .eq('task_id', taskId)
    .eq('profile_id', profileId)
  if (error) console.error('deleteAssignee:', error)
}

export async function updateAssigneeRow(taskId: string, profileId: string, isPrimary: boolean) {
  if (!isSupabaseConfigured()) return
  const { error } = await supabase
    .from('task_assignees')
    .update({ is_primary: isPrimary })
    .eq('task_id', taskId)
    .eq('profile_id', profileId)
  if (error) console.error('updateAssignee:', error)
}

// ─── Comments ─────────────────────────────────────────────────────────────────

export async function insertComment(comment: TaskComment) {
  if (!isSupabaseConfigured()) return
  const { error } = await supabase.from('task_comments').insert({
    id: comment.id,
    task_id: comment.taskId,
    profile_id: comment.profileId,
    content: comment.content,
  })
  if (error) console.error('insertComment:', error)
}

export async function deleteCommentRow(commentId: string) {
  if (!isSupabaseConfigured()) return
  const { error } = await supabase.from('task_comments').delete().eq('id', commentId)
  if (error) console.error('deleteComment:', error)
}

// ─── Task Departments ─────────────────────────────────────────────────────────

export async function insertTaskDepartment(td: TaskDepartment) {
  if (!isSupabaseConfigured()) return
  const { error } = await supabase.from('task_departments').insert({
    id: td.id,
    task_id: td.taskId,
    department_id: td.departmentId,
    role_description: td.roleDescription,
  })
  if (error) console.error('insertTaskDepartment:', error)
}

export async function deleteTaskDepartmentRow(tdId: string) {
  if (!isSupabaseConfigured()) return
  const { error } = await supabase.from('task_departments').delete().eq('id', tdId)
  if (error) console.error('deleteTaskDepartment:', error)
}

// ─── Profiles ─────────────────────────────────────────────────────────────────

export async function insertProfile(profile: Profile) {
  if (!isSupabaseConfigured()) return
  const { error } = await supabase.from('profiles').insert(profileToRow({ ...profile, companyId: getCompanyId() }))
  if (error) console.error('insertProfile:', error)
}

export async function updateProfileRow(profileId: string, updates: Partial<Profile>): Promise<{ authError?: string }> {
  if (!isSupabaseConfigured()) return {}

  // If email changed, update auth.users via Edge Function
  if (updates.email) {
    const { data, error: fnError } = await supabase.functions.invoke('update-user', {
      body: { user_id: profileId, email: updates.email },
    })
    if (fnError) {
      console.error('updateAuthUser:', fnError)
      return { authError: `Failed to update login email: ${fnError.message}` }
    }
    // Check for application-level errors in the response
    if (data?.error) {
      console.error('updateAuthUser:', data.error)
      return { authError: `Failed to update login email: ${data.error}` }
    }
  }

  const { error } = await supabase.from('profiles').update(profileToRow(updates)).eq('id', profileId)
  if (error) console.error('updateProfile:', error)
  return {}
}

export async function deleteProfileRow(profileId: string) {
  if (!isSupabaseConfigured()) return
  const { error } = await supabase.from('profiles').delete().eq('id', profileId)
  if (error) console.error('deleteProfile:', error)
}

// ─── Periods ──────────────────────────────────────────────────────────────────

export async function insertPeriod(period: TaskPeriod) {
  if (!isSupabaseConfigured()) return
  const { error } = await supabase.from('task_periods').insert({
    id: period.id,
    company_id: getCompanyId(),
    name: period.name,
    start_date: period.startDate,
    end_date: period.endDate,
    is_active: period.isActive,
  })
  if (error) console.error('insertPeriod:', error)
}

export async function updatePeriodRow(periodId: string, updates: Partial<TaskPeriod>) {
  if (!isSupabaseConfigured()) return
  const row: Record<string, unknown> = {}
  if (updates.name !== undefined) row.name = updates.name
  if (updates.startDate !== undefined) row.start_date = updates.startDate
  if (updates.endDate !== undefined) row.end_date = updates.endDate
  if (updates.isActive !== undefined) row.is_active = updates.isActive
  const { error } = await supabase.from('task_periods').update(row).eq('id', periodId)
  if (error) console.error('updatePeriod:', error)
}

export async function deletePeriodRow(periodId: string) {
  if (!isSupabaseConfigured()) return
  const { error } = await supabase.from('task_periods').delete().eq('id', periodId)
  if (error) console.error('deletePeriod:', error)
}

// ─── Calendar Events ──────────────────────────────────────────────────────────

export async function insertCalendarEvent(event: CalendarEvent) {
  if (!isSupabaseConfigured()) return
  const { error } = await supabase.from('calendar_events').insert({
    id: event.id,
    company_id: getCompanyId(),
    title: event.title,
    description: event.description ?? null,
    event_type: event.eventType,
    start_date: event.startDate,
    end_date: event.endDate ?? null,
    related_task_id: event.relatedTaskId ?? null,
  })
  if (error) console.error('insertCalendarEvent:', error)
}

export async function updateCalendarEventRow(eventId: string, updates: Partial<CalendarEvent>) {
  if (!isSupabaseConfigured()) return
  const row: Record<string, unknown> = {}
  if (updates.title !== undefined) row.title = updates.title
  if (updates.description !== undefined) row.description = updates.description
  if (updates.eventType !== undefined) row.event_type = updates.eventType
  if (updates.startDate !== undefined) row.start_date = updates.startDate
  if (updates.endDate !== undefined) row.end_date = updates.endDate
  if (updates.relatedTaskId !== undefined) row.related_task_id = updates.relatedTaskId
  const { error } = await supabase.from('calendar_events').update(row).eq('id', eventId)
  if (error) console.error('updateCalendarEvent:', error)
}

export async function deleteCalendarEventRow(eventId: string) {
  if (!isSupabaseConfigured()) return
  const { error } = await supabase.from('calendar_events').delete().eq('id', eventId)
  if (error) console.error('deleteCalendarEvent:', error)
}

// ─── Print Requests ───────────────────────────────────────────────────────────

export async function insertPrintRequest(pr: PrintRequest) {
  if (!isSupabaseConfigured()) return
  const { error } = await supabase.from('print_requests').insert(printRequestToRow({ ...pr, companyId: getCompanyId() }))
  if (error) console.error('insertPrintRequest:', error)
}

export async function updatePrintRequestRow(id: string, updates: Partial<PrintRequest>) {
  if (!isSupabaseConfigured()) return
  const { error } = await supabase.from('print_requests').update(printRequestToRow(updates)).eq('id', id)
  if (error) console.error('updatePrintRequest:', error)
}

export async function deletePrintRequestRow(id: string) {
  if (!isSupabaseConfigured()) return
  const { error } = await supabase.from('print_requests').delete().eq('id', id)
  if (error) console.error('deletePrintRequest:', error)
}

// ─── Company ──────────────────────────────────────────────────────────────────

export async function updateCompanyRow(updates: Partial<Company>) {
  if (!isSupabaseConfigured()) return
  const row: Record<string, unknown> = {}
  if (updates.name !== undefined) row.name = updates.name
  if (updates.schoolYear !== undefined) row.school_year = updates.schoolYear
  if (updates.description !== undefined) row.description = updates.description
  const { error } = await supabase.from('companies').update(row).eq('id', getCompanyId())
  if (error) console.error('updateCompany:', error)
}
