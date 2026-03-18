import {
  LayoutDashboard,
  ArrowLeftRight,
  Store,
  Trophy,
  Calendar,
  Printer,
  Settings,
  PanelLeftClose,
  PanelLeft,
  LogOut,
} from 'lucide-react'
import { NavLink } from 'react-router-dom'
import { DEPARTMENTS } from '@/lib/constants'
import { useUIStore } from '@/stores/uiStore'
import { useAuth } from '@/components/auth/AuthProvider'

const SPECIAL_SECTIONS = [
  { path: '/inter-department', label: 'Inter-Department', icon: ArrowLeftRight },
  { path: '/trade-shows', label: 'Trade Shows', icon: Store },
  { path: '/competitions', label: 'Competitions', icon: Trophy },
  { path: '/calendar', label: 'Calendar', icon: Calendar },
  { path: '/print-requests', label: 'Print Requests', icon: Printer },
  { path: '/settings', label: 'Settings', icon: Settings },
] as const

export function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const { sidebarCollapsed, toggleSidebar } = useUIStore()
  const { profile, signOut } = useAuth()

  const isTeacherOrAdmin = profile?.role === 'teacher' || profile?.role === 'admin'

  const visibleSpecialSections = SPECIAL_SECTIONS.filter(
    (section) => section.path !== '/settings' || isTeacherOrAdmin
  )

  return (
    <aside
      className={`
        fixed left-0 top-0 z-30 flex h-screen flex-col border-r border-border-subtle
        bg-surface-1 transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]
        ${sidebarCollapsed ? 'w-[var(--spacing-sidebar-collapsed)]' : 'w-[var(--spacing-sidebar)]'}
      `}
    >
      {/* Header */}
      <div className="flex h-14 items-center justify-between border-b border-border-subtle px-4">
        {!sidebarCollapsed && (
          <div className="flex items-center gap-2.5 overflow-hidden">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-accent text-xs font-bold text-white">
              S
            </div>
            <div className="min-w-0">
              <h1 className="truncate text-sm font-semibold text-text-primary">Siply</h1>
              <p className="truncate text-[10px] text-text-tertiary">VE Task Manager</p>
            </div>
          </div>
        )}
        <button
          onClick={toggleSidebar}
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-text-tertiary transition-colors hover:bg-surface-3 hover:text-text-secondary"
        >
          {sidebarCollapsed ? <PanelLeft size={16} /> : <PanelLeftClose size={16} />}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-3">
        {/* Dashboard */}
        <div className="px-2">
          <NavButton
            to="/"
            end
            collapsed={sidebarCollapsed}
            icon={<LayoutDashboard size={16} />}
            label="Dashboard"
            onNavigate={onNavigate}
          />
        </div>

        {/* Departments */}
        <div className="mt-4">
          {!sidebarCollapsed && (
            <p className="mb-1 px-4 text-[10px] font-medium uppercase tracking-wider text-text-tertiary">
              Departments
            </p>
          )}
          <div className="px-2">
            {DEPARTMENTS.map((dept) => (
              <NavButton
                key={dept.id}
                to={`/department/${dept.abbreviation}`}
                collapsed={sidebarCollapsed}
                icon={
                  <span
                    className="inline-block h-2.5 w-2.5 rounded-full"
                    style={{ backgroundColor: dept.color }}
                  />
                }
                label={sidebarCollapsed ? dept.abbreviation : dept.name}
                badge={dept.abbreviation}
                onNavigate={onNavigate}
              />
            ))}
          </div>
        </div>

        {/* Separator */}
        <div className="my-3 border-t border-border-subtle" />

        {/* Special sections */}
        <div className="px-2">
          {visibleSpecialSections.map(({ path, label, icon: Icon }) => (
            <NavButton
              key={path}
              to={path}
              collapsed={sidebarCollapsed}
              icon={<Icon size={16} />}
              label={label}
              onNavigate={onNavigate}
            />
          ))}
        </div>
      </nav>

      {/* Footer — Logged-in User */}
      {profile && (
        <div className="border-t border-border-subtle p-3">
          {!sidebarCollapsed ? (
            <div className="flex items-center gap-2.5">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-surface-4 text-xs font-medium text-text-secondary">
                {profile.fullName.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-medium text-text-primary">{profile.fullName}</p>
                <p className="truncate text-[10px] text-text-tertiary capitalize">{profile.role.replace('_', ' ')}</p>
              </div>
              <button
                onClick={() => signOut()}
                title="Sign out"
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-text-tertiary transition-colors hover:bg-surface-3 hover:text-text-secondary"
              >
                <LogOut size={14} />
              </button>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2" title={profile.fullName}>
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-surface-4 text-xs font-medium text-text-secondary">
                {profile.fullName.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()}
              </div>
              <button
                onClick={() => signOut()}
                title="Sign out"
                className="flex h-5 w-5 items-center justify-center rounded text-text-tertiary transition-colors hover:bg-surface-3 hover:text-text-secondary"
              >
                <LogOut size={12} />
              </button>
            </div>
          )}
        </div>
      )}
    </aside>
  )
}

function NavButton({
  to,
  end,
  collapsed,
  icon,
  label,
  badge,
  onNavigate,
}: {
  to: string
  end?: boolean
  collapsed: boolean
  icon: React.ReactNode
  label: string
  badge?: string
  onNavigate?: () => void
}) {
  return (
    <NavLink
      to={to}
      end={end}
      title={collapsed ? label : undefined}
      onClick={onNavigate}
      className={({ isActive }) => `
        group flex w-full items-center gap-2.5 rounded-md px-2.5 py-1.5 text-left text-sm transition-all
        ${collapsed ? 'justify-center' : ''}
        ${
          isActive
            ? 'bg-surface-3 text-text-primary font-medium'
            : 'text-text-secondary hover:bg-surface-2 hover:text-text-primary'
        }
      `}
    >
      <span className="shrink-0 flex items-center justify-center w-5">{icon}</span>
      {!collapsed && (
        <>
          <span className="truncate">{label}</span>
          {badge && (
            <span className="ml-auto shrink-0 rounded bg-surface-4 px-1.5 py-0.5 text-[10px] font-mono font-medium text-text-tertiary">
              {badge}
            </span>
          )}
        </>
      )}
    </NavLink>
  )
}
