import { useState } from 'react'
import { useToastStore } from '@/stores/toastStore'

export function CompanySettings() {
  const addToast = useToastStore((s) => s.addToast)

  const [companyName, setCompanyName] = useState('Siply')
  const [schoolYear, setSchoolYear] = useState('2025-26')
  const [description, setDescription] = useState(
    'Siply is a VE hydration ecosystem company (S-Corp) based in Tustin, CA with ~30 employees across 7 departments.'
  )

  function handleSave() {
    addToast('success', 'Settings saved.')
  }

  return (
    <div className="flex flex-col gap-6 max-w-lg">
      <div className="rounded-lg border border-border-subtle bg-surface-2 px-4 py-3 text-sm text-text-secondary">
        Company settings are stored locally until connected to Supabase. Changes will not persist across page reloads.
      </div>

      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-text-primary">Company Name</label>
          <input
            className="rounded-lg border border-border-strong bg-surface-1 px-3 py-2 text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-accent"
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
            placeholder="Company name"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-text-primary">School Year</label>
          <input
            className="rounded-lg border border-border-strong bg-surface-1 px-3 py-2 text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-accent"
            value={schoolYear}
            onChange={(e) => setSchoolYear(e.target.value)}
            placeholder="e.g. 2025-26"
          />
          <p className="text-xs text-text-tertiary">Used for task period labeling and reports.</p>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-text-primary">Description</label>
          <textarea
            rows={4}
            className="resize-none rounded-lg border border-border-strong bg-surface-1 px-3 py-2 text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-accent"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Brief description of your VE company"
          />
        </div>

        <div className="flex items-center gap-3 border-t border-border-subtle pt-4">
          <button
            onClick={handleSave}
            className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent-hover"
          >
            Save Settings
          </button>
        </div>
      </div>
    </div>
  )
}
