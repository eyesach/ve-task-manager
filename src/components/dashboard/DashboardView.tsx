import { useNavigate } from 'react-router-dom'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { CheckCircle2, Clock, AlertTriangle, ListTodo } from 'lucide-react'
import { format, formatDistanceToNow, addDays, parseISO, isAfter, isBefore } from 'date-fns'
import { useTaskStore } from '@/stores/taskStore'
import { useUIStore } from '@/stores/uiStore'
import { DEPARTMENTS, TASK_STATUSES } from '@/lib/constants'
import { StatusChip } from '@/components/common/StatusChip'

const TODAY = new Date()
const TODAY_STR = format(TODAY, 'yyyy-MM-dd')
const IN_14_DAYS = addDays(TODAY, 14)

// ─── Stat Card ────────────────────────────────────────────────────────────────

interface StatCardProps {
  label: string
  value: number
  sub?: string
  icon: React.ReactNode
  accent?: string
}

function StatCard({ label, value, sub, icon, accent }: StatCardProps) {
  return (
    <div className="flex flex-col gap-3 rounded-xl bg-surface-2 p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-3xl font-bold tabular-nums text-text-primary">{value}</p>
          {sub && <p className="mt-0.5 text-xs text-text-tertiary">{sub}</p>}
        </div>
        <div
          className="flex h-9 w-9 items-center justify-center rounded-lg"
          style={{ backgroundColor: accent ? `${accent}18` : undefined, color: accent }}
        >
          {icon}
        </div>
      </div>
      <p className="text-sm font-medium text-text-secondary">{label}</p>
    </div>
  )
}

// ─── Department Progress Card ─────────────────────────────────────────────────

interface DeptCardProps {
  deptId: string
  name: string
  abbreviation: string
  color: string
  completed: number
  total: number
  onClick: () => void
}

function DeptCard({ name, abbreviation, color, completed, total, onClick }: DeptCardProps) {
  const pct = total === 0 ? 0 : Math.round((completed / total) * 100)
  const isAllDone = total > 0 && completed === total

  return (
    <button
      type="button"
      onClick={onClick}
      className="flex flex-col gap-3 rounded-xl border-l-4 bg-surface-2 p-4 text-left transition-colors hover:bg-surface-3"
      style={{ borderColor: color }}
    >
      <div className="flex items-center gap-2">
        <span
          className="rounded px-1.5 py-0.5 font-mono text-[11px] font-semibold"
          style={{ backgroundColor: `${color}18`, color }}
        >
          {abbreviation}
        </span>
        <span className="text-sm font-medium text-text-primary">{name}</span>
      </div>

      <div className="flex flex-col gap-1">
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface-4">
          <div
            className="h-full rounded-full transition-all duration-500 ease-out"
            style={{
              width: `${pct}%`,
              backgroundColor: isAllDone ? '#10B981' : color,
            }}
          />
        </div>
        <p className="text-xs text-text-tertiary">
          {total === 0 ? 'No tasks' : `${completed} of ${total} complete`}
          {total > 0 && <span className="ml-1 font-mono">({pct}%)</span>}
        </p>
      </div>
    </button>
  )
}

// ─── Main Dashboard ───────────────────────────────────────────────────────────

export function DashboardView() {
  const navigate = useNavigate()
  const openTaskDetail = useUIStore((s) => s.openTaskDetail)
  const tasks = useTaskStore((s) => s.tasks)
  const comments = useTaskStore((s) => s.comments)
  const profiles = useTaskStore((s) => s.profiles)

  // ── Stat calculations ──────────────────────────────────────────────────────
  const totalTasks = tasks.length
  const completedTasks = tasks.filter((t) => t.status === 'completed')
  const inProgressTasks = tasks.filter((t) => t.status === 'in_progress')
  const overdueTasks = tasks.filter((t) => {
    if (!t.dueDate) return false
    if (t.status === 'completed' || t.status === 'carried_over') return false
    return isBefore(parseISO(t.dueDate), TODAY)
  })

  const completedPct =
    totalTasks === 0 ? 0 : Math.round((completedTasks.length / totalTasks) * 100)

  // ── Status distribution for pie chart ─────────────────────────────────────
  const pieData = TASK_STATUSES.map((s) => ({
    name: s.label,
    value: tasks.filter((t) => t.status === s.value).length,
    color: s.color,
  })).filter((d) => d.value > 0)

  // ── Upcoming deadlines (next 14 days) ─────────────────────────────────────
  const upcoming = tasks
    .filter((t) => {
      if (!t.dueDate) return false
      if (t.status === 'completed' || t.status === 'carried_over') return false
      const due = parseISO(t.dueDate)
      return !isBefore(due, TODAY) && (isAfter(due, TODAY) || t.dueDate === TODAY_STR) && !isAfter(due, IN_14_DAYS)
    })
    .sort((a, b) => a.dueDate!.localeCompare(b.dueDate!))

  // ── Recent activity (5 most recent comments) ──────────────────────────────
  const recentComments = [...comments]
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, 5)

  return (
    <div className="space-y-6 p-6">
      {/* Page heading */}
      <div>
        <h1 className="text-xl font-semibold text-text-primary">Dashboard</h1>
        <p className="mt-0.5 text-sm text-text-tertiary">
          Company-wide overview — {format(TODAY, 'MMMM d, yyyy')}
        </p>
      </div>

      {/* ── A. Stats Overview ──────────────────────────────────────────────── */}
      <div className="grid grid-cols-4 gap-4">
        <StatCard
          label="Total Tasks"
          value={totalTasks}
          icon={<ListTodo size={18} />}
          accent="#6B7280"
        />
        <StatCard
          label="Completed"
          value={completedTasks.length}
          sub={`${completedPct}% of all tasks`}
          icon={<CheckCircle2 size={18} />}
          accent="#10B981"
        />
        <StatCard
          label="In Progress"
          value={inProgressTasks.length}
          icon={<Clock size={18} />}
          accent="#3B82F6"
        />
        <StatCard
          label="Overdue"
          value={overdueTasks.length}
          sub={overdueTasks.length > 0 ? 'Need attention' : 'All on track'}
          icon={<AlertTriangle size={18} />}
          accent={overdueTasks.length > 0 ? '#EF4444' : '#10B981'}
        />
      </div>

      {/* ── B + C. Department Progress + Pie Chart ─────────────────────────── */}
      <div className="grid grid-cols-3 gap-4">
        {/* Department cards — col-span-2 */}
        <div className="col-span-2 rounded-xl bg-surface-2 p-5">
          <h2 className="mb-4 text-sm font-semibold text-text-primary">Department Progress</h2>
          <div className="grid grid-cols-2 gap-3">
            {DEPARTMENTS.map((dept) => {
              const deptTasks = tasks.filter(
                (t) => t.departmentId === dept.id && t.category === 'department'
              )
              const deptCompleted = deptTasks.filter((t) => t.status === 'completed').length
              return (
                <DeptCard
                  key={dept.id}
                  deptId={dept.id}
                  name={dept.name}
                  abbreviation={dept.abbreviation}
                  color={dept.color}
                  completed={deptCompleted}
                  total={deptTasks.length}
                  onClick={() => navigate(`/department/${dept.abbreviation}`)}
                />
              )
            })}
          </div>
        </div>

        {/* Pie chart — col-span-1 */}
        <div className="rounded-xl bg-surface-2 p-5">
          <h2 className="mb-4 text-sm font-semibold text-text-primary">Status Distribution</h2>
          {pieData.length === 0 ? (
            <div className="flex h-48 items-center justify-center text-xs text-text-tertiary">
              No task data
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="45%"
                  innerRadius={50}
                  outerRadius={75}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {pieData.map((entry) => (
                    <Cell key={entry.name} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    fontSize: 12,
                    borderRadius: 8,
                    border: 'none',
                    background: 'var(--surface-3)',
                    color: 'var(--text-primary)',
                  }}
                />
                <Legend
                  iconType="circle"
                  iconSize={8}
                  wrapperStyle={{ fontSize: 11, paddingTop: 8 }}
                />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* ── D + E. Upcoming Deadlines + Recent Activity ─────────────────────── */}
      <div className="grid grid-cols-2 gap-4">
        {/* Upcoming Deadlines */}
        <div className="rounded-xl bg-surface-2 p-5">
          <h2 className="mb-4 text-sm font-semibold text-text-primary">
            Upcoming Deadlines
            <span className="ml-2 text-xs font-normal text-text-tertiary">next 14 days</span>
          </h2>
          {upcoming.length === 0 ? (
            <p className="py-6 text-center text-xs text-text-tertiary">No upcoming deadlines</p>
          ) : (
            <ul className="space-y-1">
              {upcoming.map((task) => (
                <li key={task.id}>
                  <button
                    type="button"
                    onClick={() => openTaskDetail(task.id)}
                    className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left transition-colors hover:bg-surface-3"
                  >
                    <span className="w-16 shrink-0 font-mono text-xs font-semibold text-text-secondary">
                      {task.taskCode}
                    </span>
                    <span className="flex-1 truncate text-xs text-text-primary">{task.title}</span>
                    <span className="shrink-0 text-[11px] text-text-tertiary">
                      {format(parseISO(task.dueDate!), 'MMM d')}
                    </span>
                    <StatusChip status={task.status} />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Recent Activity */}
        <div className="rounded-xl bg-surface-2 p-5">
          <h2 className="mb-4 text-sm font-semibold text-text-primary">Recent Activity</h2>
          {recentComments.length === 0 ? (
            <p className="py-6 text-center text-xs text-text-tertiary">No recent activity</p>
          ) : (
            <ul className="space-y-3">
              {recentComments.map((comment) => {
                const profile = profiles.find((p) => p.id === comment.profileId)
                const task = tasks.find((t) => t.id === comment.taskId)
                const name = profile?.fullName ?? 'Unknown'
                const taskCode = task?.taskCode ?? comment.taskId.slice(0, 6)
                return (
                  <li key={comment.id} className="flex items-start gap-3">
                    <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-surface-4 text-[10px] font-semibold uppercase text-text-secondary">
                      {name.charAt(0)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs text-text-primary">
                        <span className="font-semibold">{name}</span>
                        {' commented on '}
                        <button
                          type="button"
                          onClick={() => task && openTaskDetail(task.id)}
                          className="font-mono font-semibold text-accent hover:underline"
                        >
                          {taskCode}
                        </button>
                      </p>
                      <p className="mt-0.5 text-[11px] text-text-tertiary">
                        {formatDistanceToNow(parseISO(comment.createdAt), { addSuffix: true })}
                      </p>
                    </div>
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      </div>
    </div>
  )
}
