import { useState } from 'react'
import { Pencil, Trash2, Plus, Check, X } from 'lucide-react'
import { useTaskStore } from '@/stores/taskStore'
import { DEPARTMENTS } from '@/lib/constants'
import { ConfirmDialog } from '@/components/common/ConfirmDialog'
import { useToastStore } from '@/stores/toastStore'
import type { Profile } from '@/lib/types'

const ROLES: { value: Profile['role']; label: string }[] = [
  { value: 'admin', label: 'Admin' },
  { value: 'department_lead', label: 'Department Lead' },
  { value: 'member', label: 'Member' },
  { value: 'teacher', label: 'Teacher' },
]

interface EditState {
  fullName: string
  email: string
  departmentId: string
  role: Profile['role']
}

const emptyEdit = (): EditState => ({
  fullName: '',
  email: '',
  departmentId: DEPARTMENTS[0].id,
  role: 'member',
})

export function EmployeeSettings() {
  const profiles = useTaskStore((s) => s.profiles)
  const addProfile = useTaskStore((s) => s.addProfile)
  const updateProfile = useTaskStore((s) => s.updateProfile)
  const deleteProfile = useTaskStore((s) => s.deleteProfile)
  const addToast = useToastStore((s) => s.addToast)

  const [editingId, setEditingId] = useState<string | null>(null)
  const [editState, setEditState] = useState<EditState>(emptyEdit())
  const [showAddForm, setShowAddForm] = useState(false)
  const [newEmployee, setNewEmployee] = useState<EditState>(emptyEdit())
  const [deleteTarget, setDeleteTarget] = useState<Profile | null>(null)

  function startEdit(profile: Profile) {
    setEditingId(profile.id)
    setEditState({
      fullName: profile.fullName,
      email: profile.email,
      departmentId: profile.departmentId,
      role: profile.role,
    })
  }

  function saveEdit(profileId: string) {
    if (!editState.fullName.trim()) {
      addToast('error', 'Name is required.')
      return
    }
    updateProfile(profileId, {
      fullName: editState.fullName.trim(),
      email: editState.email.trim(),
      departmentId: editState.departmentId,
      role: editState.role,
    })
    setEditingId(null)
    addToast('success', 'Employee updated.')
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
      companyId: 'siply',
      departmentId: newEmployee.departmentId,
      fullName: newEmployee.fullName.trim(),
      email: newEmployee.email.trim(),
      role: newEmployee.role,
    }
    addProfile(profile)
    setNewEmployee(emptyEdit())
    setShowAddForm(false)
    addToast('success', `${profile.fullName} added.`)
  }

  function getDeptName(deptId: string) {
    return DEPARTMENTS.find((d) => d.id === deptId)?.abbreviation ?? '—'
  }

  function getRoleLabel(role: Profile['role']) {
    return ROLES.find((r) => r.value === role)?.label ?? role
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-text-secondary">{profiles.length} employees</p>
        <button
          onClick={() => { setShowAddForm(true); setNewEmployee(emptyEdit()) }}
          className="flex items-center gap-1.5 rounded-lg bg-accent px-3 py-1.5 text-sm font-medium text-white hover:bg-accent-hover"
        >
          <Plus className="h-4 w-4" />
          Add Employee
        </button>
      </div>

      <div className="overflow-hidden rounded-lg border border-border-subtle bg-surface-1">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border-subtle bg-surface-2">
              <th className="px-4 py-2.5 text-left font-medium text-text-secondary">Name</th>
              <th className="px-4 py-2.5 text-left font-medium text-text-secondary">Email</th>
              <th className="px-4 py-2.5 text-left font-medium text-text-secondary">Dept</th>
              <th className="px-4 py-2.5 text-left font-medium text-text-secondary">Role</th>
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
                    <select
                      className="rounded border border-border-strong bg-surface-1 px-2 py-1 text-sm text-text-primary focus:outline-none focus:ring-1 focus:ring-accent"
                      value={editState.departmentId}
                      onChange={(e) => setEditState((s) => ({ ...s, departmentId: e.target.value }))}
                    >
                      {DEPARTMENTS.map((d) => (
                        <option key={d.id} value={d.id}>{d.abbreviation}</option>
                      ))}
                    </select>
                  </td>
                  <td className="px-4 py-2">
                    <select
                      className="rounded border border-border-strong bg-surface-1 px-2 py-1 text-sm text-text-primary focus:outline-none focus:ring-1 focus:ring-accent"
                      value={editState.role}
                      onChange={(e) => setEditState((s) => ({ ...s, role: e.target.value as Profile['role'] }))}
                    >
                      {ROLES.map((r) => (
                        <option key={r.value} value={r.value}>{r.label}</option>
                      ))}
                    </select>
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
                  <td className="px-4 py-2.5">
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
                  <select
                    className="rounded border border-border-strong bg-surface-1 px-2 py-1 text-sm text-text-primary focus:outline-none focus:ring-1 focus:ring-accent"
                    value={newEmployee.departmentId}
                    onChange={(e) => setNewEmployee((s) => ({ ...s, departmentId: e.target.value }))}
                  >
                    {DEPARTMENTS.map((d) => (
                      <option key={d.id} value={d.id}>{d.abbreviation}</option>
                    ))}
                  </select>
                </td>
                <td className="px-4 py-2">
                  <select
                    className="rounded border border-border-strong bg-surface-1 px-2 py-1 text-sm text-text-primary focus:outline-none focus:ring-1 focus:ring-accent"
                    value={newEmployee.role}
                    onChange={(e) => setNewEmployee((s) => ({ ...s, role: e.target.value as Profile['role'] }))}
                  >
                    {ROLES.map((r) => (
                      <option key={r.value} value={r.value}>{r.label}</option>
                    ))}
                  </select>
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
