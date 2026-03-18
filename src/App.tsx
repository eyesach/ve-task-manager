import { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from '@/components/auth/AuthProvider'
import { LoginPage } from '@/components/auth/LoginPage'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import { AppShell } from '@/components/layout/AppShell'
import { TaskList } from '@/components/tasks/TaskList'
import { TaskBoard } from '@/components/tasks/TaskBoard'
import { TaskManagementLog } from '@/components/tasks/TaskManagementLog'
import { TaskDetail } from '@/components/tasks/TaskDetail'
import { ToastContainer } from '@/components/common/Toast'
import { SearchOverlay } from '@/components/common/SearchOverlay'
import { useUIStore } from '@/stores/uiStore'
import { CalendarView } from '@/components/calendar/CalendarView'
import { DashboardView } from '@/components/dashboard/DashboardView'
import { PrintRequestsView } from '@/components/print/PrintRequestsView'
import { SettingsView } from '@/components/settings/SettingsView'
import { InterDepartmentView } from '@/components/departments/InterDepartmentView'
import { TradeShowHub } from '@/components/departments/TradeShowHub'
import { CompetitionHub } from '@/components/departments/CompetitionHub'


function TaskView({ viewOverride }: { viewOverride?: string }) {
  const viewMode = useUIStore((s) => s.viewMode)
  if (viewMode === 'board') return <TaskBoard viewOverride={viewOverride} />
  if (viewMode === 'log') return <TaskManagementLog viewOverride={viewOverride} />
  return <TaskList viewOverride={viewOverride} />
}

export default function App() {
  const [searchOpen, setSearchOpen] = useState(false)

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setSearchOpen(true)
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [])

  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route
            path="*"
            element={
              <ProtectedRoute>
                <AppShell>
                  <Routes>
                    <Route path="/" element={<DashboardView />} />
                    <Route path="/department/:abbr" element={<TaskView />} />
                    <Route path="/inter-department" element={<InterDepartmentView />} />
                    <Route path="/trade-shows" element={<TradeShowHub />} />
                    <Route path="/competitions" element={<CompetitionHub />} />
                    <Route path="/calendar" element={<CalendarView />} />
                    <Route path="/print-requests" element={<PrintRequestsView />} />
                    <Route path="/settings" element={<SettingsView />} />
                    <Route path="*" element={<Navigate to="/" replace />} />
                  </Routes>
                  <TaskDetail />
                  <ToastContainer />
                  <SearchOverlay open={searchOpen} onClose={() => setSearchOpen(false)} />
                </AppShell>
              </ProtectedRoute>
            }
          />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}
