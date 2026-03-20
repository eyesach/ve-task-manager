import { useAuth } from '@/components/auth/AuthProvider'
import type { Task } from '@/lib/types'

export function usePermissions() {
  const { profile } = useAuth()

  const role = profile?.role
  const userDeptId = profile?.departmentId
  const userId = profile?.id

  const isTeacherOrAdmin = role === 'teacher' || role === 'admin' || role === 'creator'
  const isDeptLead = role === 'department_lead'

  function canCreateTask(departmentId?: string): boolean {
    if (isTeacherOrAdmin) return true
    if (isDeptLead && departmentId && departmentId === userDeptId) return true
    return false
  }

  function canEditTask(task: Task): boolean {
    if (isTeacherOrAdmin) return true
    if (isDeptLead && task.departmentId === userDeptId) return true
    return false
  }

  function canDeleteTask(task: Task): boolean {
    if (isTeacherOrAdmin) return true
    if (isDeptLead && task.departmentId === userDeptId) return true
    return false
  }

  function canUpdateTaskStatus(_task: Task, assigneeIds: string[]): boolean {
    if (isTeacherOrAdmin) return true
    if (isDeptLead) return true
    if (userId && assigneeIds.includes(userId)) return true
    return false
  }

  function canUpdateChecklist(_task: Task, assigneeIds: string[]): boolean {
    return canUpdateTaskStatus(_task, assigneeIds)
  }

  function canAssignMembers(departmentId?: string): boolean {
    if (isTeacherOrAdmin) return true
    if (isDeptLead && departmentId && departmentId === userDeptId) return true
    return false
  }

  const canManageEmployees = isTeacherOrAdmin
  const canManageSettings = isTeacherOrAdmin
  const canCreateCalendarEvent = isTeacherOrAdmin

  return {
    canCreateTask, canEditTask, canDeleteTask,
    canUpdateTaskStatus, canUpdateChecklist, canAssignMembers,
    canManageEmployees, canManageSettings, canCreateCalendarEvent,
    isTeacherOrAdmin, profile,
  }
}
