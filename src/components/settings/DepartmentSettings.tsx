import { DEPARTMENTS } from '@/lib/constants'

export function DepartmentSettings() {
  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-lg border border-border-subtle bg-surface-2 px-4 py-3 text-sm text-text-secondary">
        Department configuration will be available when connected to Supabase. Departments are currently defined as constants shared across the application.
      </div>

      <div className="overflow-hidden rounded-lg border border-border-subtle bg-surface-1">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border-subtle bg-surface-2">
              <th className="px-4 py-2.5 text-left font-medium text-text-secondary">Color</th>
              <th className="px-4 py-2.5 text-left font-medium text-text-secondary">Name</th>
              <th className="px-4 py-2.5 text-left font-medium text-text-secondary">Abbreviation</th>
              <th className="px-4 py-2.5 text-left font-medium text-text-secondary">Sort Order</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border-subtle">
            {DEPARTMENTS.map((dept) => (
              <tr key={dept.id} className="hover:bg-surface-2">
                <td className="px-4 py-3">
                  <div
                    className="h-5 w-5 rounded-full border border-border-subtle"
                    style={{ backgroundColor: dept.color }}
                    title={dept.color}
                  />
                </td>
                <td className="px-4 py-3 font-medium text-text-primary">{dept.name}</td>
                <td className="px-4 py-3">
                  <span
                    className="inline-flex items-center rounded px-2 py-0.5 text-xs font-bold text-white"
                    style={{ backgroundColor: dept.color }}
                  >
                    {dept.abbreviation}
                  </span>
                </td>
                <td className="px-4 py-3 text-text-secondary">{dept.sortOrder}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
