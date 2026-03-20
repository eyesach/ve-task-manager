import { useState } from 'react'
import { LogOut } from 'lucide-react'
import { useAuth } from '../auth/AuthProvider'
import { EmployeeSettings } from './EmployeeSettings'
import { DepartmentSettings } from './DepartmentSettings'
import { PeriodSettings } from './PeriodSettings'
import { CompanySettings } from './CompanySettings'
import { AccountSettings } from './AccountSettings'
import { TrelloImportSettings } from './TrelloImportSettings'

const TABS = [
  { id: 'account', label: 'Account' },
  { id: 'employees', label: 'Employees' },
  { id: 'departments', label: 'Departments' },
  { id: 'periods', label: 'Periods' },
  { id: 'company', label: 'Company' },
  { id: 'import', label: 'Import' },
] as const

type TabId = (typeof TABS)[number]['id']

export function SettingsView() {
  const [activeTab, setActiveTab] = useState<TabId>('account')
  const { signOut } = useAuth()

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-semibold text-text-primary">Settings</h1>
          <p className="mt-1 text-sm text-text-tertiary">Manage your company configuration, employees, and task periods.</p>
        </div>
        <button
          onClick={() => signOut()}
          className="flex items-center gap-2 rounded-md border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm font-medium text-red-400 transition-colors hover:bg-red-500/20"
        >
          <LogOut className="h-4 w-4" />
          Sign out
        </button>
      </div>

      {/* Tab Bar */}
      <div className="flex gap-1 border-b border-border-subtle">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={[
              'px-4 py-2 text-sm font-medium transition-colors',
              activeTab === tab.id
                ? 'border-b-2 border-accent text-accent -mb-px'
                : 'text-text-secondary hover:text-text-primary',
            ].join(' ')}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div>
        {activeTab === 'account' && <AccountSettings />}
        {activeTab === 'employees' && <EmployeeSettings />}
        {activeTab === 'departments' && <DepartmentSettings />}
        {activeTab === 'periods' && <PeriodSettings />}
        {activeTab === 'company' && <CompanySettings />}
        {activeTab === 'import' && <TrelloImportSettings />}
      </div>
    </div>
  )
}
