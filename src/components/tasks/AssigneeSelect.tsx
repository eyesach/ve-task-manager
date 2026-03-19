import { DEPARTMENTS } from '@/lib/constants'
import { useTaskStore } from '@/stores/taskStore'

interface AssigneeSelectProps {
  selectedIds: string[]
  onAdd: (profileId: string) => void
  onRemove: (profileId: string) => void
}

export function AssigneeSelect({ selectedIds, onAdd, onRemove }: AssigneeSelectProps) {
  const { profiles } = useTaskStore()

  const selected = profiles.filter((p) => selectedIds.includes(p.id))
  const unselected = profiles.filter((p) => !selectedIds.includes(p.id))

  // Group unselected profiles by department
  const grouped = DEPARTMENTS.map((dept) => ({
    dept,
    profiles: unselected.filter((p) => p.departmentId === dept.id),
  })).filter((g) => g.profiles.length > 0)

  function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const value = e.target.value
    if (!value) return
    onAdd(value)
    e.target.value = ''
  }

  return (
    <div className="space-y-2">
      {/* Selected pills */}
      {selected.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {selected.map((p) => (
            <span
              key={p.id}
              className="flex items-center gap-1 rounded-full bg-surface-3 px-2.5 py-1 text-xs text-text-primary"
            >
              {p.fullName}
              <button
                type="button"
                onClick={() => onRemove(p.id)}
                className="ml-0.5 flex h-3.5 w-3.5 items-center justify-center rounded-full text-text-tertiary transition-colors hover:bg-surface-4 hover:text-text-primary"
                aria-label={`Remove ${p.fullName}`}
              >
                ×
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Dropdown to add */}
      {unselected.length > 0 && (
        <select
          defaultValue=""
          onChange={handleChange}
          className="w-full rounded-lg border border-border-subtle bg-surface-2 px-3 py-2 text-sm text-text-primary outline-none focus:border-border-strong"
        >
          <option value="" disabled>
            Add assignee…
          </option>
          {grouped.map(({ dept, profiles: deptProfiles }) => (
            <optgroup key={dept.id} label={dept.name}>
              {deptProfiles.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.fullName}
                </option>
              ))}
            </optgroup>
          ))}
        </select>
      )}
    </div>
  )
}
