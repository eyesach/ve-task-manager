import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AppShell } from '@/components/layout/AppShell'
import { TaskList } from '@/components/tasks/TaskList'
import { TaskBoard } from '@/components/tasks/TaskBoard'
import { TaskManagementLog } from '@/components/tasks/TaskManagementLog'
import { TaskDetail } from '@/components/tasks/TaskDetail'
import { ToastContainer } from '@/components/common/Toast'
import { useUIStore } from '@/stores/uiStore'
import { CalendarView } from '@/components/calendar/CalendarView'
import { DashboardView } from '@/components/dashboard/DashboardView'

function PlaceholderView({ title }: { title: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-text-tertiary">
      <p className="text-sm font-medium">{title}</p>
      <p className="mt-1 text-xs">Coming soon.</p>
    </div>
  )
}

function TaskView({ viewOverride }: { viewOverride?: string }) {
  const viewMode = useUIStore((s) => s.viewMode)
  if (viewMode === 'board') return <TaskBoard viewOverride={viewOverride} />
  if (viewMode === 'log') return <TaskManagementLog viewOverride={viewOverride} />
  return <TaskList viewOverride={viewOverride} />
}

export default function App() {
  return (
    <BrowserRouter>
      <AppShell>
        <Routes>
          <Route path="/" element={<DashboardView />} />
          <Route path="/department/:abbr" element={<TaskView />} />
          <Route path="/inter-department" element={<TaskView viewOverride="inter_department" />} />
          <Route path="/trade-shows" element={<TaskView viewOverride="trade_show" />} />
          <Route path="/competitions" element={<TaskView viewOverride="competition" />} />
          <Route path="/calendar" element={<CalendarView />} />
          <Route path="/print-requests" element={<PlaceholderView title="Print Requests" />} />
          <Route path="/settings" element={<PlaceholderView title="Settings" />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        <TaskDetail />
        <ToastContainer />
      </AppShell>
    </BrowserRouter>
  )
}
