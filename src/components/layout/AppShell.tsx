import { useState } from 'react'
import { Sidebar } from './Sidebar'
import { TopBar } from './TopBar'
import { useUIStore } from '@/stores/uiStore'
import { useRealtimeSync } from '@/hooks/useRealtimeSync'

export function AppShell({ children }: { children: React.ReactNode }) {
  useRealtimeSync()
  const sidebarCollapsed = useUIStore((s) => s.sidebarCollapsed)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <div className="flex h-screen overflow-hidden bg-surface-0">
      {/* Mobile backdrop */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar — overlay on mobile, static on desktop */}
      <div
        className={`
          fixed inset-y-0 left-0 z-50 md:static md:z-auto
          ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
          transition-transform duration-200
        `}
      >
        <Sidebar onNavigate={() => setMobileMenuOpen(false)} />
      </div>

      <div
        className="flex flex-1 flex-col overflow-hidden transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]"
        style={{
          marginLeft: sidebarCollapsed
            ? 'var(--spacing-sidebar-collapsed)'
            : 'var(--spacing-sidebar)',
        }}
      >
        <TopBar onMenuToggle={() => setMobileMenuOpen((v) => !v)} />
        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  )
}
