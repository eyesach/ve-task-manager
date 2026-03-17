import { useState } from 'react'
import { EmployeeSettings } from './EmployeeSettings'
import { DepartmentSettings } from './DepartmentSettings'
import { PeriodSettings } from './PeriodSettings'
import { CompanySettings } from './CompanySettings'

const TABS = [
  { id: 'employees', label: 'Employees' },
  { id: 'departments', label: 'Departments' },
  { id: 'periods', label: 'Periods' },
  { id: 'company', label: 'Company' },
] as const

type TabId = (typeof TABS)[number]['id']

export function SettingsView() {
  const [activeTab, setActiveTab] = useState<TabId>('employees')

  return (
    <div className="flex flex-col gap-6 p-6">
      <div>
        <h1 className="text-xl font-semibold text-text-primary">Settings</h1>
        <p className="mt-1 text-sm text-text-tertiary">Manage your company configuration, employees, and task periods.</p>
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
        {activeTab === 'employees' && <EmployeeSettings />}
        {activeTab === 'departments' && <DepartmentSettings />}
        {activeTab === 'periods' && <PeriodSettings />}
        {activeTab === 'company' && <CompanySettings />}
      </div>
    </div>
  )
}
