import { useState } from 'react'
import { Pencil, Trash2, Plus, Check, X, Link2 } from 'lucide-react'
import { useTaskStore } from '@/stores/taskStore'
import { DEPARTMENTS, getLeadTitleForDepartment, getMemberTitlesForDepartment } from '@/lib/constants'
import { COMPANY_ID } from '@/lib/ids'
import { ConfirmDialog } from '@/components/common/ConfirmDialog'
import { useToastStore } from '@/stores/toastStore'
import { usePermissions } from '@/hooks/usePermissions'
import type { Profile } from '@/lib/types'

const ROLES: { value: Profile['role']; label: string }[] = [
  { value: 'admin', label: 'Admin' },
  { value: 'department_lead', label: 'Department Lead' },
  { value: 'member', label: 'Member' },
  { value: 'teacher', label: 'Teacher' },
  { value: 'creator', label: 'Creator' },
]

interface EditState {
  fullName: string
  email: string
  departmentId: string | null
  role: Profile['role']
  jobTitle: string
  customTitle: string
}

const emptyEdit = (): EditState => ({
  fullName: '',
  email: '',
  departmentId: DEPARTMENTS[0].id,
  role: 'member',
  jobTitle: '',
  customTitle: '',
})

function getJobTitleOptions(role: Profile['role'], departmentId: string | null): string[] {
  if (role === 'department_lead') {
    return [getLeadTitleForDepartment(departmentId)]
  }
  if (role === 'member') {
    return getMemberTitlesForDepartment(departmentId)
  }
  return []
}

export function EmployeeSettings() {
  const profiles = useTaskStore((s) => s.profiles)
  const addProfile = useTaskStore((s) => s.addProfile)
  const updateProfile = useTaskStore((s) => s.updateProfile)
  const deleteProfile = useTaskStore((s) => s.deleteProfile)
  const addToast = useToastStore((s) => s.addToast)
  const { canManageEmployees } = usePermissions()

  const [editingId, setEditingId] = useState<string | null>(null)
  const [editState, setEditState] = useState<EditState>(emptyEdit())
  const [showAddForm, setShowAddForm] = useState(false)
  const [newEmployee, setNewEmployee] = useState<EditState>(emptyEdit())
  const [deleteTarget, setDeleteTarget] = useState<Profile | null>(null)

  // Invite link state
  const [copiedLink, setCopiedLink] = useState(false)

  function startEdit(profile: Profile) {
    setEditingId(profile.id)
    const options = getJobTitleOptions(profile.role, profile.departmentId)
    const isCustom = profile.jobTitle ? !options.includes(profile.jobTitle) : false
    setEditState({
      fullName: profile.fullName,
      email: profile.email,
      departmentId: profile.departmentId,
      role: profile.role,
      jobTitle: isCustom ? '__custom__' : (profile.jobTitle ?? ''),
      customTitle: isCustom ? (profile.jobTitle ?? '') : '',
    })
  }

  function resolveJobTitle(state: EditState): string | undefined {
    if (state.role === 'teacher' || state.role === 'admin') return undefined
    if (state.jobTitle === '__custom__') return state.customTitle.trim() || undefined
    return state.jobTitle || undefined
  }

  async function saveEdit(profileId: string) {
    if (!editState.fullName.trim()) {
      addToast('error', 'Name is required.')
      return
    }
    const result = await updateProfile(profileId, {
      fullName: editState.fullName.trim(),
      email: editState.email.trim(),
      departmentId: editState.role === 'teacher' ? null : editState.departmentId,
      role: editState.role,
      jobTitle: resolveJobTitle(editState),
    })
    setEditingId(null)
    if (result?.authError) {
      addToast('error', result.authError)
    } else {
      addToast('success', 'Employee updated.')
    }
  }

  function cancelEdit() {
    setEditingId(null)
    setEditState(emptyEdit())
  }

  function handleAdd() {
    if (!newEmployee.fullName.trim()) {
      addToast('error', 'Name is required.')
      return
    }
    const profile: Profile = {
      id: crypto.randomUUID(),
      companyId: COMPANY_ID,
      departmentId: newEmployee.role === 'teacher' ? null : newEmployee.departmentId,
      fullName: newEmployee.fullName.trim(),
      email: newEmployee.email.trim(),
      role: newEmployee.role,
      jobTitle: resolveJobTitle(newEmployee),
    }
    addProfile(profile)
    setNewEmployee(emptyEdit())
    setShowAddForm(false)
    addToast('success', `${profile.fullName} added.`)
  }

  async function copyInviteLink() {
    const base = window.location.origin + window.location.pathname
    const link = `${base}#/join/${COMPANY_ID}`
    try {
      await navigator.clipboard.writeText(link)
      setCopiedLink(true)
      addToast('success', 'Invite link copied to clipboard!')
      setTimeout(() => setCopiedLink(false), 2000)
    } catch {
      addToast('error', 'Failed to copy to clipboard.')
    }
  }

  function getDeptName(deptId: string | null) {
    if (!deptId) return '—'
    return DEPARTMENTS.find((d) => d.id === deptId)?.abbreviation ?? '—'
  }

  function getRoleLabel(role: Profile['role']) {
    return ROLES.find((r) => r.value === role)?.label ?? role
  }

  function getDisplayTitle(profile: Profile) {
    if (profile.jobTitle) return profile.jobTitle
    if (profile.role === 'department_lead') return getLeadTitleForDepartment(profile.departmentId)
    return getRoleLabel(profile.role)
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-text-secondary">{profiles.length} employees</p>
        {canManageEmployees && (
          <div className="flex items-center gap-2">
            <button
              onClick={copyInviteLink}
              className="flex items-center gap-1.5 rounded-lg border border-accent px-3 py-1.5 text-sm font-medium text-accent hover:bg-accent/10"
            >
              {copiedLink ? <Check className="h-4 w-4" /> : <Link2 className="h-4 w-4" />}
              {copiedLink ? 'Link Copied!' : 'Copy Invite Link'}
            </button>
            <button
              onClick={() => { setShowAddForm(true); setNewEmployee(emptyEdit()) }}
              className="flex items-center gap-1.5 rounded-lg bg-accent px-3 py-1.5 text-sm font-medium text-white hover:bg-accent-hover"
            >
              <Plus className="h-4 w-4" />
              Add Employee
            </button>
          </div>
        )}
      </div>

      <div className="overflow-hidden rounded-lg border border-border-subtle bg-surface-1">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border-subtle bg-surface-2">
              <th className="px-4 py-2.5 text-left font-medium text-text-secondary">Name</th>
              <th className="px-4 py-2.5 text-left font-medium text-text-secondary">Email</th>
              <th className="px-4 py-2.5 text-left font-medium text-text-secondary">Dept</th>
              <th className="px-4 py-2.5 text-left font-medium text-text-secondary">Role</th>
              <th className="px-4 py-2.5 text-left font-medium text-text-secondary">Title</th>
              <th className="px-4 py-2.5 text-right font-medium text-text-secondary">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border-subtle">
            {profiles.map((profile) =>
              editingId === profile.id ? (
                <tr key={profile.id} className="bg-surface-2">
                  <td className="px-4 py-2">
                    <input
                      className="w-full rounded border border-border-strong bg-surface-1 px-2 py-1 text-sm text-text-primary focus:outline-none focus:ring-1 focus:ring-accent"
                      value={editState.fullName}
                      onChange={(e) => setEditState((s) => ({ ...s, fullName: e.target.value }))}
                      autoFocus
                    />
                  </td>
                  <td className="px-4 py-2">
                    <input
                      className="w-full rounded border border-border-strong bg-surface-1 px-2 py-1 text-sm text-text-primary focus:outline-none focus:ring-1 focus:ring-accent"
                      value={editState.email}
                      onChange={(e) => setEditState((s) => ({ ...s, email: e.target.value }))}
                    />
                  </td>
                  <td className="px-4 py-2">
                    {editState.role === 'teacher' ? (
                      <span className="inline-flex items-center rounded px-2 py-1 text-xs text-text-tertiary bg-surface-3">N/A</span>
                    ) : (
                      <select
                        className="rounded border border-border-strong bg-surface-1 px-2 py-1 text-sm text-text-primary focus:outline-none focus:ring-1 focus:ring-accent"
                        value={editState.departmentId ?? ''}
                        onChange={(e) => {
                          const deptId = e.target.value
                          const options = getJobTitleOptions(editState.role, deptId)
                          setEditState((s) => ({
                            ...s,
                            departmentId: deptId,
                            jobTitle: options[0] ?? '',
                            customTitle: '',
                          }))
                        }}
                      >
                        {DEPARTMENTS.map((d) => (
                          <option key={d.id} value={d.id}>{d.abbreviation}</option>
                        ))}
                      </select>
                    )}
                  </td>
                  <td className="px-4 py-2">
                    <select
                      className="rounded border border-border-strong bg-surface-1 px-2 py-1 text-sm text-text-primary focus:outline-none focus:ring-1 focus:ring-accent"
                      value={editState.role}
                      onChange={(e) => {
                        const role = e.target.value as Profile['role']
                        const deptId = role === 'teacher' ? null : (editState.departmentId ?? DEPARTMENTS[0].id)
                        const options = getJobTitleOptions(role, deptId)
                        setEditState((s) => ({
                          ...s,
                          role,
                          departmentId: deptId,
                          jobTitle: options[0] ?? '',
                          customTitle: '',
                        }))
                      }}
                    >
                      {ROLES.map((r) => (
                        <option key={r.value} value={r.value}>{r.label}</option>
                      ))}
                    </select>
                  </td>
                  <td className="px-4 py-2">
                    {editState.role === 'teacher' || editState.role === 'admin' ? (
                      <span className="inline-flex items-center rounded px-2 py-1 text-xs text-text-tertiary bg-surface-3">—</span>
                    ) : editState.role === 'department_lead' ? (
                      <div className="flex flex-col gap-1">
                        <span className="text-sm text-text-primary">{getLeadTitleForDepartment(editState.departmentId)}</span>
                        {editState.jobTitle === '__custom__' ? (
                          <input
                            className="w-full rounded border border-border-strong bg-surface-1 px-2 py-1 text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-1 focus:ring-accent"
                            placeholder="Custom title"
                            value={editState.customTitle}
                            onChange={(e) => setEditState((s) => ({ ...s, customTitle: e.target.value }))}
                          />
                        ) : null}
                        <button
                          type="button"
                          className="text-xs text-accent hover:underline text-left"
                          onClick={() => setEditState((s) => ({
                            ...s,
                            jobTitle: s.jobTitle === '__custom__' ? getLeadTitleForDepartment(s.departmentId) : '__custom__',
                            customTitle: '',
                          }))}
                        >
                          {editState.jobTitle === '__custom__' ? 'Use default' : 'Custom title'}
                        </button>
                      </div>
                    ) : (
                      <div className="flex flex-col gap-1">
                        <select
                          className="rounded border border-border-strong bg-surface-1 px-2 py-1 text-sm text-text-primary focus:outline-none focus:ring-1 focus:ring-accent"
                          value={editState.jobTitle}
                          onChange={(e) => setEditState((s) => ({ ...s, jobTitle: e.target.value, customTitle: '' }))}
                        >
                          {getJobTitleOptions(editState.role, editState.departmentId).map((t) => (
                            <option key={t} value={t}>{t}</option>
                          ))}
                          <option value="__custom__">+ Custom title</option>
                        </select>
                        {editState.jobTitle === '__custom__' && (
                          <input
                            className="w-full rounded border border-border-strong bg-surface-1 px-2 py-1 text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-1 focus:ring-accent"
                            placeholder="Enter custom title"
                            value={editState.customTitle}
                            onChange={(e) => setEditState((s) => ({ ...s, customTitle: e.target.value }))}
                          />
                        )}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-2">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => saveEdit(profile.id)}
                        className="rounded p-1 text-green-600 hover:bg-surface-3"
                        title="Save"
                      >
                        <Check className="h-4 w-4" />
                      </button>
                      <button
                        onClick={cancelEdit}
                        className="rounded p-1 text-text-tertiary hover:bg-surface-3"
                        title="Cancel"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                <tr key={profile.id} className="hover:bg-surface-2">
                  <td className="px-4 py-2.5 font-medium text-text-primary">{profile.fullName}</td>
                  <td className="px-4 py-2.5 text-text-secondary">{profile.email || '—'}</td>
                  <td className="px-4 py-2.5">
                    <span className="inline-flex items-center rounded px-1.5 py-0.5 text-xs font-medium bg-surface-3 text-text-secondary">
                      {getDeptName(profile.departmentId)}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-text-secondary">{getRoleLabel(profile.role)}</td>
                  <td className="px-4 py-2.5 text-text-secondary">{getDisplayTitle(profile)}</td>
                  <td className="px-4 py-2.5">
                    {canManageEmployees && (
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => startEdit(profile)}
                          className="rounded p-1 text-text-tertiary hover:bg-surface-3 hover:text-text-primary"
                          title="Edit"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => setDeleteTarget(profile)}
                          className="rounded p-1 text-text-tertiary hover:bg-surface-3 hover:text-red-500"
                          title="Delete"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              )
            )}

            {/* Add Employee inline form */}
            {showAddForm && (
              <tr className="bg-surface-2">
                <td className="px-4 py-2">
                  <input
                    className="w-full rounded border border-border-strong bg-surface-1 px-2 py-1 text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-1 focus:ring-accent"
                    placeholder="Full name"
                    value={newEmployee.fullName}
                    onChange={(e) => setNewEmployee((s) => ({ ...s, fullName: e.target.value }))}
                    autoFocus
                  />
                </td>
                <td className="px-4 py-2">
                  <input
                    className="w-full rounded border border-border-strong bg-surface-1 px-2 py-1 text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-1 focus:ring-accent"
                    placeholder="email@siply.ve"
                    value={newEmployee.email}
                    onChange={(e) => setNewEmployee((s) => ({ ...s, email: e.target.value }))}
                  />
                </td>
                <td className="px-4 py-2">
                  {newEmployee.role === 'teacher' ? (
                    <span className="inline-flex items-center rounded px-2 py-1 text-xs text-text-tertiary bg-surface-3">N/A</span>
                  ) : (
                    <select
                      className="rounded border border-border-strong bg-surface-1 px-2 py-1 text-sm text-text-primary focus:outline-none focus:ring-1 focus:ring-accent"
                      value={newEmployee.departmentId ?? ''}
                      onChange={(e) => {
                        const deptId = e.target.value
                        const options = getJobTitleOptions(newEmployee.role, deptId)
                        setNewEmployee((s) => ({
                          ...s,
                          departmentId: deptId,
                          jobTitle: options[0] ?? '',
                          customTitle: '',
                        }))
                      }}
                    >
                      {DEPARTMENTS.map((d) => (
                        <option key={d.id} value={d.id}>{d.abbreviation}</option>
                      ))}
                    </select>
                  )}
                </td>
                <td className="px-4 py-2">
                  <select
                    className="rounded border border-border-strong bg-surface-1 px-2 py-1 text-sm text-text-primary focus:outline-none focus:ring-1 focus:ring-accent"
                    value={newEmployee.role}
                    onChange={(e) => {
                      const role = e.target.value as Profile['role']
                      const deptId = role === 'teacher' ? null : (newEmployee.departmentId ?? DEPARTMENTS[0].id)
                      const options = getJobTitleOptions(role, deptId)
                      setNewEmployee((s) => ({
                        ...s,
                        role,
                        departmentId: deptId,
                        jobTitle: options[0] ?? '',
                        customTitle: '',
                      }))
                    }}
                  >
                    {ROLES.map((r) => (
                      <option key={r.value} value={r.value}>{r.label}</option>
                    ))}
                  </select>
                </td>
                <td className="px-4 py-2">
                  {newEmployee.role === 'teacher' || newEmployee.role === 'admin' ? (
                    <span className="inline-flex items-center rounded px-2 py-1 text-xs text-text-tertiary bg-surface-3">—</span>
                  ) : newEmployee.role === 'department_lead' ? (
                    <div className="flex flex-col gap-1">
                      <span className="text-sm text-text-primary">{getLeadTitleForDepartment(newEmployee.departmentId)}</span>
                      {newEmployee.jobTitle === '__custom__' ? (
                        <input
                          className="w-full rounded border border-border-strong bg-surface-1 px-2 py-1 text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-1 focus:ring-accent"
                          placeholder="Custom title"
                          value={newEmployee.customTitle}
                          onChange={(e) => setNewEmployee((s) => ({ ...s, customTitle: e.target.value }))}
                        />
                      ) : null}
                      <button
                        type="button"
                        className="text-xs text-accent hover:underline text-left"
                        onClick={() => setNewEmployee((s) => ({
                          ...s,
                          jobTitle: s.jobTitle === '__custom__' ? getLeadTitleForDepartment(s.departmentId) : '__custom__',
                          customTitle: '',
                        }))}
                      >
                        {newEmployee.jobTitle === '__custom__' ? 'Use default' : 'Custom title'}
                      </button>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-1">
                      <select
                        className="rounded border border-border-strong bg-surface-1 px-2 py-1 text-sm text-text-primary focus:outline-none focus:ring-1 focus:ring-accent"
                        value={newEmployee.jobTitle}
                        onChange={(e) => setNewEmployee((s) => ({ ...s, jobTitle: e.target.value, customTitle: '' }))}
                      >
                        {getJobTitleOptions(newEmployee.role, newEmployee.departmentId).map((t) => (
                          <option key={t} value={t}>{t}</option>
                        ))}
                        <option value="__custom__">+ Custom title</option>
                      </select>
                      {newEmployee.jobTitle === '__custom__' && (
                        <input
                          className="w-full rounded border border-border-strong bg-surface-1 px-2 py-1 text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-1 focus:ring-accent"
                          placeholder="Enter custom title"
                          value={newEmployee.customTitle}
                          onChange={(e) => setNewEmployee((s) => ({ ...s, customTitle: e.target.value }))}
                        />
                      )}
                    </div>
                  )}
                </td>
                <td className="px-4 py-2">
                  <div className="flex items-center justify-end gap-1">
                    <button
                      onClick={handleAdd}
                      className="rounded p-1 text-green-600 hover:bg-surface-3"
                      title="Save"
                    >
                      <Check className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => setShowAddForm(false)}
                      className="rounded p-1 text-text-tertiary hover:bg-surface-3"
                      title="Cancel"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <ConfirmDialog
        open={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => {
          if (deleteTarget) {
            deleteProfile(deleteTarget.id)
            addToast('success', `${deleteTarget.fullName} removed.`)
            setDeleteTarget(null)
          }
        }}
        title="Remove Employee"
        message={`Remove ${deleteTarget?.fullName ?? 'this employee'} from the company? This will also unassign them from all tasks.`}
        confirmLabel="Remove"
      />

    </div>
  )
}
