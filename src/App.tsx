import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AppShell } from '@/components/layout/AppShell'
import { TaskList } from '@/components/tasks/TaskList'
import { TaskDetail } from '@/components/tasks/TaskDetail'
import { ToastContainer } from '@/components/common/Toast'

function PlaceholderView({ title }: { title: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-text-tertiary">
      <p className="text-sm font-medium">{title}</p>
      <p className="mt-1 text-xs">Coming soon.</p>
    </div>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AppShell>
        <Routes>
          <Route path="/" element={<PlaceholderView title="Dashboard" />} />
          <Route path="/department/:abbr" element={<TaskList />} />
          <Route path="/inter-department" element={<TaskList viewOverride="inter_department" />} />
          <Route path="/trade-shows" element={<TaskList viewOverride="trade_show" />} />
          <Route path="/competitions" element={<TaskList viewOverride="competition" />} />
          <Route path="/calendar" element={<PlaceholderView title="Calendar" />} />
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
