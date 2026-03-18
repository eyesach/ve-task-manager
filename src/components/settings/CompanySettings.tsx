import { useState, useEffect } from 'react'
import { useCompanyStore } from '@/stores/companyStore'
import { useToastStore } from '@/stores/toastStore'
import { usePermissions } from '@/hooks/usePermissions'

export function CompanySettings() {
  const company = useCompanyStore((s) => s.company)
  const updateCompany = useCompanyStore((s) => s.updateCompany)
  const addToast = useToastStore((s) => s.addToast)
  const { canManageSettings } = usePermissions()

  const [companyName, setCompanyName] = useState(company.name)
  const [schoolYear, setSchoolYear] = useState(company.schoolYear)
  const [description, setDescription] = useState(company.description ?? '')

  // Sync local form state if store changes (e.g. from Supabase sync)
  useEffect(() => {
    setCompanyName(company.name)
    setSchoolYear(company.schoolYear)
    setDescription(company.description ?? '')
  }, [company.name, company.schoolYear, company.description])

  function handleSave() {
    updateCompany({
      name: companyName.trim(),
      schoolYear: schoolYear.trim(),
      description: description.trim(),
    })
    addToast('success', 'Settings saved.')
  }

  return (
    <div className="flex flex-col gap-6 max-w-lg">
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-text-primary">Company Name</label>
          <input
            className="rounded-lg border border-border-strong bg-surface-1 px-3 py-2 text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-accent disabled:opacity-60"
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
            placeholder="Company name"
            disabled={!canManageSettings}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-text-primary">School Year</label>
          <input
            className="rounded-lg border border-border-strong bg-surface-1 px-3 py-2 text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-accent disabled:opacity-60"
            value={schoolYear}
            onChange={(e) => setSchoolYear(e.target.value)}
            placeholder="e.g. 2025-26"
            disabled={!canManageSettings}
          />
          <p className="text-xs text-text-tertiary">Used for task period labeling and reports.</p>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-text-primary">Description</label>
          <textarea
            rows={4}
            className="resize-none rounded-lg border border-border-strong bg-surface-1 px-3 py-2 text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-accent disabled:opacity-60"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Brief description of your VE company"
            disabled={!canManageSettings}
          />
        </div>

        {canManageSettings && (
          <div className="flex items-center gap-3 border-t border-border-subtle pt-4">
            <button
              onClick={handleSave}
              className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent-hover"
            >
              Save Settings
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
