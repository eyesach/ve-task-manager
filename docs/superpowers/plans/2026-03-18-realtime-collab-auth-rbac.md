# Real-Time Collaboration + Authentication & RBAC Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add Supabase Auth (email/password, admin-invite-only), real-time sync via Supabase Realtime subscriptions, and four-tier role-based access control to the VE Task Manager.

**Architecture:** AuthProvider context wraps the app, providing session + profile. useRealtimeSync hook replaces useSupabaseSync with initial fetch + WebSocket subscriptions. usePermissions hook reads the profile and returns permission booleans consumed by UI components. RLS policies enforce permissions server-side. A Supabase Edge Function handles admin invite.

**Tech Stack:** React 18, Vite, TypeScript, Zustand, Supabase (Auth, Realtime, RLS, Edge Functions), Tailwind CSS

**Spec:** `docs/superpowers/specs/2026-03-18-realtime-collab-auth-design.md` (also in `C:\Users\mrisa\.claude\plans\cheerful-puzzling-cerf.md`)

---

## File Map

### New Files
| File | Responsibility |
|------|---------------|
| `src/components/auth/LoginPage.tsx` | Email+password login form, error display, redirect on success |
| `src/components/auth/AuthProvider.tsx` | React context: session listener, profile fetch, signIn/signOut |
| `src/components/auth/ProtectedRoute.tsx` | Redirect to /login if no auth session |
| `src/hooks/usePermissions.ts` | Role-based permission booleans from auth profile |
| `src/hooks/useRealtimeSync.ts` | Initial data fetch + Supabase Realtime channel subscriptions |
| `supabase/migrations/002_auth_rls_realtime.sql` | Tighten RLS, alter profiles FK, enable Realtime |
| `supabase/functions/invite-user/index.ts` | Edge Function: create auth user + profile row |

### Modified Files
| File | What Changes |
|------|-------------|
| `src/App.tsx` (62 lines) | Wrap in AuthProvider, add /login route, ProtectedRoute wrapper |
| `src/components/layout/AppShell.tsx` (46 lines) | Replace useSupabaseSync with useRealtimeSync |
| `src/components/layout/Sidebar.tsx` (191 lines) | Show logged-in user, sign-out button, hide Settings for non-admin |
| `src/components/layout/TopBar.tsx` (240 lines) | Permission-gate "New Task" button |
| `src/components/tasks/TaskRow.tsx` (101 lines) | Permission-gate delete/edit actions |
| `src/components/tasks/TaskDetail.tsx` (507 lines) | Permission-gate edit fields, allow status/checklist for assignees |
| `src/components/tasks/TaskComments.tsx` | Replace CURRENT_USER_ID with auth profile |
| `src/components/settings/EmployeeSettings.tsx` (480 lines) | Add invite flow, restrict to teacher/admin |
| `src/components/settings/PeriodSettings.tsx` | Restrict to teacher/admin |
| `src/components/settings/CompanySettings.tsx` | Restrict to teacher/admin |
| `src/components/calendar/EventCreateModal.tsx` | Gate behind canCreateCalendarEvent |
| `src/components/print/PrintRequestModal.tsx` | Gate status changes to admin only |
| `src/stores/taskStore.ts` (351 lines) | Add applyRealtime* methods for external event updates |
| `src/stores/calendarStore.ts` (46 lines) | Add applyRealtime* methods |
| `src/stores/printStore.ts` (28 lines) | Add applyRealtime* methods |
| `src/stores/periodStore.ts` (44 lines) | Add applyRealtime* methods |
| `src/lib/constants.ts` (114 lines) | Remove CURRENT_USER_ID (line 91) |
| `src/lib/supabaseService.ts` (331 lines) | Replace hardcoded COMPANY_ID with parameter |
| `src/hooks/useSupabaseSync.ts` (51 lines) | Delete (replaced by useRealtimeSync) |

---

## Task 1: AuthProvider + Auth Context

**Files:**
- Create: `src/components/auth/AuthProvider.tsx`

**Why first:** Everything else (permissions, realtime, UI gating) depends on knowing who the current user is.

- [ ] **Step 1: Create AuthProvider with context and types**

Create `src/components/auth/AuthProvider.tsx`:

```tsx
import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { Session, User } from '@supabase/supabase-js'
import { supabase } from '../../lib/supabase'
import { mapProfile } from '../../lib/supabase-types'
import type { Profile } from '../../lib/types'

interface AuthContextType {
  session: Session | null
  user: User | null
  profile: Profile | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)

  // Fetch profile from profiles table, reuse existing mapper
  async function fetchProfile(userId: string) {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()
    if (error) {
      console.error('Failed to fetch profile:', error)
      return null
    }
    return mapProfile(data)
  }

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      if (session?.user) {
        fetchProfile(session.user.id).then(p => {
          setProfile(p)
          setLoading(false)
        })
      } else {
        setLoading(false)
      }
    })

    // Listen for auth changes (login, logout, token refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setSession(session)
        if (session?.user) {
          const p = await fetchProfile(session.user.id)
          setProfile(p)
        } else {
          setProfile(null)
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  async function signIn(email: string, password: string) {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    return { error: error as Error | null }
  }

  async function signOut() {
    await supabase.auth.signOut()
    setSession(null)
    setProfile(null)
  }

  return (
    <AuthContext.Provider value={{
      session,
      user: session?.user ?? null,
      profile,
      loading,
      signIn,
      signOut,
    }}>
      {children}
    </AuthContext.Provider>
  )
}
```

- [ ] **Step 2: Verify file compiles**

Run: `npx tsc --noEmit src/components/auth/AuthProvider.tsx 2>&1 | head -20`
Expected: No errors (or only errors about missing downstream consumers)

- [ ] **Step 3: Commit**

```bash
git add src/components/auth/AuthProvider.tsx
git commit -m "feat: add AuthProvider context with Supabase Auth session + profile"
```

---

## Task 2: Login Page

**Files:**
- Create: `src/components/auth/LoginPage.tsx`

- [ ] **Step 1: Create LoginPage component**

Create `src/components/auth/LoginPage.tsx`:

```tsx
import { useState, FormEvent } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from './AuthProvider'
import { LogIn } from 'lucide-react'

export function LoginPage() {
  const { session, loading, signIn } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  // Already logged in — redirect to dashboard
  if (!loading && session) {
    return <Navigate to="/" replace />
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setSubmitting(true)
    const { error } = await signIn(email, password)
    if (error) {
      setError(error.message)
    }
    setSubmitting(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-full max-w-sm">
        <div className="bg-white rounded-xl shadow-lg p-8">
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-indigo-100 rounded-xl mb-3">
              <LogIn className="w-6 h-6 text-indigo-600" />
            </div>
            <h1 className="text-xl font-bold text-gray-900">VE Task Manager</h1>
            <p className="text-sm text-gray-500 mt-1">Sign in to your account</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-red-50 text-red-700 text-sm rounded-lg p-3">
                {error}
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                autoFocus
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="you@school.edu"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="Enter your password"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-2.5 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {submitting ? 'Signing in...' : 'Sign in'}
            </button>
          </form>

          <p className="text-xs text-gray-400 text-center mt-6">
            Contact your teacher or admin for an account.
          </p>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/auth/LoginPage.tsx
git commit -m "feat: add login page with email/password form"
```

---

## Task 3: ProtectedRoute + App.tsx Wiring

**Files:**
- Create: `src/components/auth/ProtectedRoute.tsx`
- Modify: `src/App.tsx` (62 lines)

- [ ] **Step 1: Create ProtectedRoute component**

Create `src/components/auth/ProtectedRoute.tsx`:

```tsx
import { Navigate } from 'react-router-dom'
import { useAuth } from './AuthProvider'

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { session, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-gray-400 text-sm">Loading...</div>
      </div>
    )
  }

  if (!session) {
    return <Navigate to="/login" replace />
  }

  return <>{children}</>
}
```

- [ ] **Step 2: Wire AuthProvider and ProtectedRoute into App.tsx**

In `src/App.tsx`:

**Add imports** (after existing imports around line 1-17):
```tsx
import { AuthProvider } from './components/auth/AuthProvider'
import { ProtectedRoute } from './components/auth/ProtectedRoute'
import { LoginPage } from './components/auth/LoginPage'
```

**Wrap BrowserRouter contents** — the entire return of the `App` component (around line 41) becomes:

```tsx
return (
  <AuthProvider>
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route
          path="/*"
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
                  <Route path="/settings" element={<CompanySettings />} />
                </Routes>
              </AppShell>
              {/* Overlays MUST stay inside ProtectedRoute — they depend on auth context and store data */}
              <TaskDetail />
              <ToastContainer />
              <SearchOverlay open={searchOpen} onClose={() => setSearchOpen(false)} />
            </ProtectedRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  </AuthProvider>
)
```

**Important:** Preserve the existing `useState` for `searchOpen` and the `useEffect` for Ctrl+K keyboard shortcut that currently exist in App.tsx. The overlays MUST stay inside `ProtectedRoute` because they depend on authenticated data from stores. SearchOverlay needs the `open` and `onClose` props passed through.

- [ ] **Step 3: Verify app compiles**

Run: `npx tsc --noEmit 2>&1 | head -30`

- [ ] **Step 4: Commit**

```bash
git add src/components/auth/ProtectedRoute.tsx src/App.tsx
git commit -m "feat: wire auth into app with protected routes and login page"
```

---

## Task 4: Remove Hardcoded User + Update Sidebar

**Files:**
- Modify: `src/lib/constants.ts` (line 91: CURRENT_USER_ID)
- Modify: `src/components/layout/Sidebar.tsx` (lines 119-139: teacher footer)

- [ ] **Step 1: Remove CURRENT_USER_ID from constants.ts**

In `src/lib/constants.ts`, find and remove line 91:
```
export const CURRENT_USER_ID = '00000000-0000-0000-0003-000000000015'
```

Then search the codebase for all usages of `CURRENT_USER_ID` and replace them with the auth context profile ID. Likely usages:
- `src/components/tasks/TaskDetail.tsx` — comment submission
- `src/components/print/PrintRequestModal.tsx` — print request submission
- Any file that imports from constants.ts

For each usage, import `useAuth` and replace `CURRENT_USER_ID` with `profile?.id`.

- [ ] **Step 2: Update Sidebar to show logged-in user**

In `src/components/layout/Sidebar.tsx`, replace the hardcoded teacher footer section (around lines 119-139) with:

```tsx
// Add import at top:
import { useAuth } from '../auth/AuthProvider'

// Inside Sidebar component, add:
const { profile, signOut } = useAuth()

// Replace the teacher footer (lines ~119-139) with:
{profile && (
  <div className="p-3 border-t border-gray-200">
    <div className="flex items-center gap-2">
      <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-xs font-medium text-indigo-700">
        {profile.fullName.split(' ').map(n => n[0]).join('')}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900 truncate">{profile.fullName}</p>
        <p className="text-xs text-gray-500 capitalize">{profile.role}</p>
      </div>
      <button
        onClick={signOut}
        className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
        title="Sign out"
      >
        <LogOut className="w-4 h-4" />
      </button>
    </div>
  </div>
)}
```

Add `LogOut` to the lucide-react import at the top of the file.

- [ ] **Step 3: Hide Settings nav for non-admin/non-teacher**

In the Sidebar's special sections loop (around lines 105-114), conditionally render the Settings item:

```tsx
{SPECIAL_SECTIONS.filter(section => {
  if (section.label === 'Settings') {
    return profile?.role === 'teacher' || profile?.role === 'admin'
  }
  return true
}).map(section => (
  // ... existing NavButton rendering
))}
```

- [ ] **Step 4: Commit**

```bash
git add src/lib/constants.ts src/components/layout/Sidebar.tsx
git commit -m "feat: replace hardcoded user with auth context in sidebar"
```

---

## Task 5: usePermissions Hook

**Files:**
- Create: `src/hooks/usePermissions.ts`

- [ ] **Step 1: Create the permissions hook**

Create `src/hooks/usePermissions.ts`:

```tsx
import { useAuth } from '../components/auth/AuthProvider'
import type { Task } from '../lib/types'

export function usePermissions() {
  const { profile } = useAuth()

  const role = profile?.role
  const userDeptId = profile?.departmentId
  const userId = profile?.id

  const isTeacherOrAdmin = role === 'teacher' || role === 'admin'
  const isDeptLead = role === 'department_lead'

  function canCreateTask(departmentId?: string): boolean {
    if (isTeacherOrAdmin) return true
    if (isDeptLead && departmentId && departmentId === userDeptId) return true
    return false
  }

  function canEditTask(task: Task): boolean {
    if (isTeacherOrAdmin) return true
    if (isDeptLead && task.departmentId === userDeptId) return true
    return false
  }

  function canDeleteTask(task: Task): boolean {
    if (isTeacherOrAdmin) return true
    if (isDeptLead && task.departmentId === userDeptId) return true
    return false
  }

  function canUpdateTaskStatus(task: Task, assigneeIds: string[]): boolean {
    if (isTeacherOrAdmin) return true
    if (isDeptLead) return true
    // Members can update status on tasks they're assigned to
    if (userId && assigneeIds.includes(userId)) return true
    return false
  }

  function canUpdateChecklist(task: Task, assigneeIds: string[]): boolean {
    // Same rules as status updates
    return canUpdateTaskStatus(task, assigneeIds)
  }

  function canAssignMembers(departmentId?: string): boolean {
    if (isTeacherOrAdmin) return true
    if (isDeptLead && departmentId && departmentId === userDeptId) return true
    return false
  }

  const canManageEmployees = isTeacherOrAdmin
  const canManageSettings = isTeacherOrAdmin
  const canCreateCalendarEvent = isTeacherOrAdmin

  return {
    canCreateTask,
    canEditTask,
    canDeleteTask,
    canUpdateTaskStatus,
    canUpdateChecklist,
    canAssignMembers,
    canManageEmployees,
    canManageSettings,
    canCreateCalendarEvent,
    isTeacherOrAdmin,
    profile,
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add src/hooks/usePermissions.ts
git commit -m "feat: add usePermissions hook with role-based access checks"
```

---

## Task 6: Permission-Gate UI Components

**Files:**
- Modify: `src/components/layout/TopBar.tsx` (lines 111-117: New Task button)
- Modify: `src/components/tasks/TaskRow.tsx` (line ~80-95: actions)
- Modify: `src/components/tasks/TaskDetail.tsx` (lines ~1-507: edit controls)
- Modify: `src/components/calendar/EventCreateModal.tsx`
- Modify: `src/components/settings/EmployeeSettings.tsx`
- Modify: `src/components/settings/PeriodSettings.tsx`
- Modify: `src/components/settings/CompanySettings.tsx`
- Modify: `src/components/print/PrintRequestModal.tsx`

- [ ] **Step 1: Gate "New Task" button in TopBar**

In `src/components/layout/TopBar.tsx`, add import:
```tsx
import { usePermissions } from '../../hooks/usePermissions'
```

Inside TopBar component, add:
```tsx
const { canCreateTask } = usePermissions()
```

Find the current department context (from the route params) and wrap the "New Task" button (around lines 111-117) in a permission check:
```tsx
{canCreateTask(currentDepartment?.id) && (
  <button ...> {/* existing New Task button */} </button>
)}
```

- [ ] **Step 2: Gate delete/edit in TaskRow**

In `src/components/tasks/TaskRow.tsx`, add:
```tsx
import { usePermissions } from '../../hooks/usePermissions'
```

Inside the component:
```tsx
const { canDeleteTask, canEditTask } = usePermissions()
```

Conditionally render edit/delete action buttons based on `canEditTask(task)` and `canDeleteTask(task)`.

- [ ] **Step 3: Gate edit fields in TaskDetail**

In `src/components/tasks/TaskDetail.tsx`:

Import `usePermissions` and `useAuth`:
```tsx
import { usePermissions } from '../../hooks/usePermissions'
import { useAuth } from '../auth/AuthProvider'
```

Inside component:
```tsx
const { canEditTask, canDeleteTask, canUpdateTaskStatus, canUpdateChecklist, canAssignMembers } = usePermissions()
const { profile } = useAuth()
const assigneeIds = assignees.map(a => a.profileId)
const canEdit = canEditTask(task)
const canChangeStatus = canUpdateTaskStatus(task, assigneeIds)
const canChangeChecklist = canUpdateChecklist(task, assigneeIds)
```

Apply `canEdit` to: title editing, description editing, due date, priority, category fields.
Apply `canChangeStatus` to: status dropdown.
Apply `canChangeChecklist` to: checklist item toggles and evidence fields.
Apply `canDeleteTask(task)` to: delete button.
Apply `canAssignMembers(task.departmentId)` to: assignee add/remove controls.

For disabled fields, add `pointer-events-none opacity-60` classes or `disabled` attribute.

- [ ] **Step 4: Gate calendar event creation**

In `src/components/calendar/EventCreateModal.tsx`, add permission check. The button that opens this modal should only be visible when `canCreateCalendarEvent` is true.

- [ ] **Step 5: Gate settings pages**

In `src/components/settings/EmployeeSettings.tsx`, `PeriodSettings.tsx`, `CompanySettings.tsx`:
- Import `usePermissions`
- If `!canManageSettings`, render a read-only view or a "You don't have permission" message
- For EmployeeSettings specifically, hide the "Add Employee" / invite button unless `canManageEmployees`

- [ ] **Step 6: Gate print request status changes**

In `src/components/print/PrintRequestModal.tsx`:
- All users can submit print requests (no gate on submission)
- Only `isTeacherOrAdmin` users can change the status of existing print requests

- [ ] **Step 7: Replace CURRENT_USER_ID usages**

Search for all files importing `CURRENT_USER_ID` from constants. Known usages:
- `src/components/tasks/TaskComments.tsx` — used for comment submission
- `src/components/print/PrintRequestModal.tsx` — used for print request submission

In each file:
- Replace import of `CURRENT_USER_ID` with `import { useAuth } from '../auth/AuthProvider'`
- Add `const { profile } = useAuth()` inside the component
- Replace `CURRENT_USER_ID` with `profile?.id ?? ''`

Verify no remaining usages:
Run: `grep -r "CURRENT_USER_ID" src/ --include="*.ts" --include="*.tsx"`
Expected: Only `src/lib/constants.ts` (if not yet removed) or no results.

- [ ] **Step 8: Verify app compiles**

Run: `npx tsc --noEmit 2>&1 | head -30`

- [ ] **Step 9: Commit**

```bash
git add -A
git commit -m "feat: add permission gates to all UI components"
```

---

## Task 7: Realtime Store Methods

**Files:**
- Modify: `src/stores/taskStore.ts` (351 lines)
- Modify: `src/stores/calendarStore.ts` (46 lines)
- Modify: `src/stores/printStore.ts` (28 lines)
- Modify: `src/stores/periodStore.ts` (44 lines)

**Why:** The Realtime hook needs methods to update stores from external events without triggering Supabase writes.

- [ ] **Step 1: Add Realtime methods to taskStore**

In `src/stores/taskStore.ts`, add these methods to the TaskState interface and implementation:

```typescript
// Add to interface (around line 105):
applyRealtimeTaskInsert: (task: Task) => void
applyRealtimeTaskUpdate: (taskId: string, updates: Partial<Task>) => void
applyRealtimeTaskDelete: (taskId: string) => void
applyRealtimeChecklistInsert: (item: ChecklistItem) => void
applyRealtimeChecklistUpdate: (itemId: string, updates: Partial<ChecklistItem>) => void
applyRealtimeChecklistDelete: (itemId: string) => void
applyRealtimeAssigneeInsert: (assignee: TaskAssignee) => void
applyRealtimeAssigneeDelete: (assigneeId: string) => void
applyRealtimeCommentInsert: (comment: TaskComment) => void
applyRealtimeCommentDelete: (commentId: string) => void
applyRealtimeProfileUpdate: (profileId: string, updates: Partial<Profile>) => void
applyRealtimeProfileInsert: (profile: Profile) => void
applyRealtimeProfileDelete: (profileId: string) => void
```

Implementation pattern (add to the store create function):

```typescript
applyRealtimeTaskInsert: (task) => set(s => ({
  tasks: s.tasks.some(t => t.id === task.id) ? s.tasks : [...s.tasks, task]
})),
applyRealtimeTaskUpdate: (taskId, updates) => set(s => ({
  tasks: s.tasks.map(t => t.id === taskId ? { ...t, ...updates } : t)
})),
applyRealtimeTaskDelete: (taskId) => set(s => ({
  tasks: s.tasks.filter(t => t.id !== taskId)
})),
// Same pattern for checklist, assignees, comments, profiles...
applyRealtimeChecklistInsert: (item) => set(s => ({
  checklists: s.checklists.some(c => c.id === item.id) ? s.checklists : [...s.checklists, item]
})),
applyRealtimeChecklistUpdate: (itemId, updates) => set(s => ({
  checklists: s.checklists.map(c => c.id === itemId ? { ...c, ...updates } : c)
})),
applyRealtimeChecklistDelete: (itemId) => set(s => ({
  checklists: s.checklists.filter(c => c.id !== itemId)
})),
applyRealtimeAssigneeInsert: (assignee) => set(s => ({
  assignees: s.assignees.some(a => a.id === assignee.id) ? s.assignees : [...s.assignees, assignee]
})),
applyRealtimeAssigneeDelete: (assigneeId) => set(s => ({
  assignees: s.assignees.filter(a => a.id !== assigneeId)
})),
applyRealtimeCommentInsert: (comment) => set(s => ({
  comments: s.comments.some(c => c.id === comment.id) ? s.comments : [...s.comments, comment]
})),
applyRealtimeCommentDelete: (commentId) => set(s => ({
  comments: s.comments.filter(c => c.id !== commentId)
})),
applyRealtimeProfileInsert: (profile) => set(s => ({
  profiles: s.profiles.some(p => p.id === profile.id) ? s.profiles : [...s.profiles, profile]
})),
applyRealtimeProfileUpdate: (profileId, updates) => set(s => ({
  profiles: s.profiles.map(p => p.id === profileId ? { ...p, ...updates } : p)
})),
applyRealtimeProfileDelete: (profileId) => set(s => ({
  profiles: s.profiles.filter(p => p.id !== profileId)
})),
```

- [ ] **Step 2: Add Realtime methods to calendarStore**

In `src/stores/calendarStore.ts`, add to interface and implementation:

```typescript
applyRealtimeEventInsert: (event: CalendarEvent) => void
applyRealtimeEventUpdate: (eventId: string, updates: Partial<CalendarEvent>) => void
applyRealtimeEventDelete: (eventId: string) => void
```

Implementation follows same pattern as taskStore.

- [ ] **Step 3: Add Realtime methods to printStore**

In `src/stores/printStore.ts`:

```typescript
applyRealtimeRequestInsert: (request: PrintRequest) => void
applyRealtimeRequestUpdate: (requestId: string, updates: Partial<PrintRequest>) => void
applyRealtimeRequestDelete: (requestId: string) => void
```

- [ ] **Step 4: Add Realtime methods to periodStore**

In `src/stores/periodStore.ts`:

```typescript
applyRealtimePeriodInsert: (period: TaskPeriod) => void
applyRealtimePeriodUpdate: (periodId: string, updates: Partial<TaskPeriod>) => void
applyRealtimePeriodDelete: (periodId: string) => void
```

- [ ] **Step 5: Verify compilation**

Run: `npx tsc --noEmit 2>&1 | head -20`

- [ ] **Step 6: Commit**

```bash
git add src/stores/taskStore.ts src/stores/calendarStore.ts src/stores/printStore.ts src/stores/periodStore.ts
git commit -m "feat: add realtime event methods to all Zustand stores"
```

---

## Task 8: useRealtimeSync Hook

**Files:**
- Create: `src/hooks/useRealtimeSync.ts`
- Modify: `src/components/layout/AppShell.tsx` (line 8: useSupabaseSync import)
- Delete: `src/hooks/useSupabaseSync.ts` (replaced)

**Reference:** Check `src/lib/supabase-types.ts` for the snake_case → camelCase mapping functions already used in `supabaseService.ts`.

- [ ] **Step 1: Create useRealtimeSync hook**

Create `src/hooks/useRealtimeSync.ts`:

```tsx
import { useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase'
import { fetchAllData } from '../lib/supabaseService'
import { useTaskStore } from '../stores/taskStore'
import { useCalendarStore } from '../stores/calendarStore'
import { usePrintStore } from '../stores/printStore'
import { usePeriodStore } from '../stores/periodStore'
import { useAuth } from '../components/auth/AuthProvider'
import { useCompanyStore } from '../stores/companyStore'
import { useToastStore } from '../stores/toastStore'
import type { RealtimePostgresChangesPayload } from '@supabase/supabase-js'

// Import the snake_case → camelCase mapping functions from supabase-types
import {
  mapTask, mapChecklistItem, mapAssignee,
  mapComment, mapProfile, mapCalendarEvent,
  mapPrintRequest, mapPeriod, mapTaskDepartment
} from '../lib/supabase-types'

export function useRealtimeSync() {
  const { profile } = useAuth()
  const companyId = profile?.companyId
  const initialized = useRef(false)
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null)

  const taskStore = useTaskStore()
  const calendarStore = useCalendarStore()
  const printStore = usePrintStore()
  const periodStore = usePeriodStore()
  const addToast = useToastStore(s => s.addToast)

  // Initial data fetch — mirrors existing useSupabaseSync pattern exactly
  useEffect(() => {
    if (!companyId || initialized.current) return
    initialized.current = true

    fetchAllData().then(data => {
      if (!data) return // Supabase not configured — keep mock data

      // Use setState directly (same pattern as existing useSupabaseSync)
      useTaskStore.setState({
        tasks: data.tasks,
        profiles: data.profiles,
        checklists: data.checklists,
        comments: data.comments,
        assignees: data.assignees,
        taskDepartments: data.taskDepartments,
      })

      usePeriodStore.setState({
        periods: data.periods,
        activePeriodId: data.periods.find(p => p.isActive)?.id ?? data.periods[0]?.id ?? '',
      })

      useCalendarStore.setState({ events: data.events })
      usePrintStore.setState({ requests: data.printRequests })

      if (data.company) {
        useCompanyStore.setState({ company: data.company })
      }
    })
  }, [companyId])

  // Realtime subscriptions
  useEffect(() => {
    if (!companyId) return

    const channel = supabase.channel(`company-${companyId}`)

    // Helper to handle events for tables WITH company_id
    function onCompanyTable(table: string, handler: (payload: RealtimePostgresChangesPayload<Record<string, unknown>>) => void) {
      channel.on('postgres_changes', {
        event: '*',
        schema: 'public',
        table,
        filter: `company_id=eq.${companyId}`,
      }, handler)
    }

    // Helper for child tables WITHOUT company_id
    function onChildTable(table: string, handler: (payload: RealtimePostgresChangesPayload<Record<string, unknown>>) => void) {
      channel.on('postgres_changes', {
        event: '*',
        schema: 'public',
        table,
      }, handler)
    }

    // --- Tasks ---
    onCompanyTable('tasks', (payload) => {
      if (payload.eventType === 'INSERT') {
        taskStore.applyRealtimeTaskInsert(mapTask(payload.new))
      } else if (payload.eventType === 'UPDATE') {
        taskStore.applyRealtimeTaskUpdate(payload.new.id as string, mapTask(payload.new))
      } else if (payload.eventType === 'DELETE') {
        taskStore.applyRealtimeTaskDelete((payload.old as any).id)
      }
    })

    // --- Checklist Items ---
    onChildTable('checklist_items', (payload) => {
      if (payload.eventType === 'INSERT') {
        taskStore.applyRealtimeChecklistInsert(mapChecklistItem(payload.new))
      } else if (payload.eventType === 'UPDATE') {
        taskStore.applyRealtimeChecklistUpdate(payload.new.id as string, mapChecklistItem(payload.new))
      } else if (payload.eventType === 'DELETE') {
        taskStore.applyRealtimeChecklistDelete((payload.old as any).id)
      }
    })

    // --- Task Assignees ---
    onChildTable('task_assignees', (payload) => {
      if (payload.eventType === 'INSERT') {
        taskStore.applyRealtimeAssigneeInsert(mapAssignee(payload.new))
      } else if (payload.eventType === 'DELETE') {
        taskStore.applyRealtimeAssigneeDelete((payload.old as any).id)
      }
    })

    // --- Task Comments ---
    onChildTable('task_comments', (payload) => {
      if (payload.eventType === 'INSERT') {
        taskStore.applyRealtimeCommentInsert(mapComment(payload.new))
      } else if (payload.eventType === 'DELETE') {
        taskStore.applyRealtimeCommentDelete((payload.old as any).id)
      }
    })

    // --- Task Departments ---
    onChildTable('task_departments', (payload) => {
      if (payload.eventType === 'INSERT') {
        const dept = mapTaskDepartment(payload.new)
        useTaskStore.setState(s => ({
          taskDepartments: s.taskDepartments.some(d => d.id === dept.id)
            ? s.taskDepartments : [...s.taskDepartments, dept]
        }))
      } else if (payload.eventType === 'DELETE') {
        useTaskStore.setState(s => ({
          taskDepartments: s.taskDepartments.filter(d => d.id !== (payload.old as any).id)
        }))
      }
    })

    // --- Profiles ---
    onCompanyTable('profiles', (payload) => {
      if (payload.eventType === 'INSERT') {
        taskStore.applyRealtimeProfileInsert(mapProfile(payload.new))
      } else if (payload.eventType === 'UPDATE') {
        taskStore.applyRealtimeProfileUpdate(payload.new.id as string, mapProfile(payload.new))
      } else if (payload.eventType === 'DELETE') {
        taskStore.applyRealtimeProfileDelete((payload.old as any).id)
      }
    })

    // --- Calendar Events ---
    onCompanyTable('calendar_events', (payload) => {
      if (payload.eventType === 'INSERT') {
        calendarStore.applyRealtimeEventInsert(mapCalendarEvent(payload.new))
      } else if (payload.eventType === 'UPDATE') {
        calendarStore.applyRealtimeEventUpdate(payload.new.id as string, mapCalendarEvent(payload.new))
      } else if (payload.eventType === 'DELETE') {
        calendarStore.applyRealtimeEventDelete((payload.old as any).id)
      }
    })

    // --- Print Requests ---
    onCompanyTable('print_requests', (payload) => {
      if (payload.eventType === 'INSERT') {
        printStore.applyRealtimeRequestInsert(mapPrintRequest(payload.new))
      } else if (payload.eventType === 'UPDATE') {
        printStore.applyRealtimeRequestUpdate(payload.new.id as string, mapPrintRequest(payload.new))
      } else if (payload.eventType === 'DELETE') {
        printStore.applyRealtimeRequestDelete((payload.old as any).id)
      }
    })

    // --- Task Periods ---
    onCompanyTable('task_periods', (payload) => {
      if (payload.eventType === 'INSERT') {
        periodStore.applyRealtimePeriodInsert(mapPeriod(payload.new))
      } else if (payload.eventType === 'UPDATE') {
        periodStore.applyRealtimePeriodUpdate(payload.new.id as string, mapPeriod(payload.new))
      } else if (payload.eventType === 'DELETE') {
        periodStore.applyRealtimePeriodDelete((payload.old as any).id)
      }
    })

    // Subscribe and handle reconnection
    let hasConnectedOnce = false
    channel.subscribe((status) => {
      if (status === 'CHANNEL_ERROR') {
        addToast({ type: 'error', message: 'Connection lost. Reconnecting...' })
      }
      if (status === 'SUBSCRIBED') {
        if (hasConnectedOnce) {
          // Re-fetch on REconnect to catch missed events
          addToast({ type: 'success', message: 'Back online' })
          fetchAllData().then(data => {
            if (!data) return
            useTaskStore.setState({
              tasks: data.tasks,
              profiles: data.profiles,
              checklists: data.checklists,
              comments: data.comments,
              assignees: data.assignees,
              taskDepartments: data.taskDepartments,
            })
            usePeriodStore.setState({
              periods: data.periods,
              activePeriodId: data.periods.find(p => p.isActive)?.id ?? data.periods[0]?.id ?? '',
            })
            useCalendarStore.setState({ events: data.events })
            usePrintStore.setState({ requests: data.printRequests })
            if (data.company) useCompanyStore.setState({ company: data.company })
          })
        }
        hasConnectedOnce = true
      }
    })

    channelRef.current = channel

    return () => {
      supabase.removeChannel(channel)
      channelRef.current = null
    }
  }, [companyId])
}
```

**Important notes for implementer:**
- Mapping functions are in `src/lib/supabase-types.ts`: `mapTask`, `mapChecklistItem`, `mapAssignee`, `mapComment`, `mapProfile`, `mapCalendarEvent`, `mapPrintRequest`, `mapPeriod`, `mapTaskDepartment`.
- Stores use `useTaskStore.setState({...})` for bulk hydration (not setter methods). Store field names are: `tasks`, `profiles`, `checklists`, `comments`, `assignees`, `taskDepartments`.
- Check the toast store's `addToast` signature — it may use `{ type, message }` or a different shape.
- **RLS note:** The member UPDATE policy on tasks allows full row updates at the DB level. Column-level restriction (members can only change `status`) is enforced at the UI layer only. PostgreSQL RLS cannot restrict individual columns.

- [ ] **Step 2: Update AppShell to use useRealtimeSync**

In `src/components/layout/AppShell.tsx` (line 5):

Replace:
```tsx
import { useSupabaseSync } from '../../hooks/useSupabaseSync'
```
With:
```tsx
import { useRealtimeSync } from '../../hooks/useRealtimeSync'
```

Replace line 8 (`useSupabaseSync()`) with:
```tsx
useRealtimeSync()
```

- [ ] **Step 3: Delete old useSupabaseSync hook**

Delete file: `src/hooks/useSupabaseSync.ts`

Verify no other files import it:
```bash
grep -r "useSupabaseSync" src/ --include="*.ts" --include="*.tsx"
```

- [ ] **Step 4: Verify compilation**

Run: `npx tsc --noEmit 2>&1 | head -30`

- [ ] **Step 5: Commit**

```bash
git add src/hooks/useRealtimeSync.ts src/components/layout/AppShell.tsx
git rm src/hooks/useSupabaseSync.ts
git commit -m "feat: replace one-time fetch with Supabase Realtime subscriptions"
```

---

## Task 9: Update supabaseService.ts — Dynamic Company ID

**Files:**
- Modify: `src/lib/supabaseService.ts` (line 36: hardcoded COMPANY_ID)

- [ ] **Step 1: Replace hardcoded COMPANY_ID**

In `src/lib/supabaseService.ts`, line 36:

Replace:
```typescript
const COMPANY_ID = '00000000-0000-0000-0000-000000000001'
```

With a module-level variable and a setter:
```typescript
let _companyId: string | null = null

export function setCompanyId(id: string) {
  _companyId = id
}

function getCompanyId(): string {
  if (!_companyId) {
    console.warn('Company ID not set, using fallback')
    return '00000000-0000-0000-0000-000000000001' // fallback for dev
  }
  return _companyId
}
```

Then replace every usage of `COMPANY_ID` in the file with `getCompanyId()`.

In `AuthProvider.tsx`, after successfully fetching the profile, call:
```tsx
import { setCompanyId } from '../../lib/supabaseService'

// Inside the profile fetch success:
if (p) {
  setCompanyId(p.companyId)
  setProfile(p)
}
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/supabaseService.ts src/components/auth/AuthProvider.tsx
git commit -m "feat: derive company ID from auth profile instead of hardcoding"
```

---

## Task 10: SQL Migration — RLS + Realtime

**Files:**
- Create: `supabase/migrations/002_auth_rls_realtime.sql`

**Important:** This migration will be RUN MANUALLY by the user on their Supabase instance. Do NOT auto-execute.

- [ ] **Step 1: Write the migration file**

Create `supabase/migrations/002_auth_rls_realtime.sql`:

```sql
-- ============================================================
-- Migration 002: Proper RLS policies + Realtime enablement
-- Run this MANUALLY in Supabase SQL Editor after setting up Auth
-- ============================================================

-- Helper: get current user's company_id from their profile
CREATE OR REPLACE FUNCTION auth.user_company_id()
RETURNS uuid AS $$
  SELECT company_id FROM public.profiles WHERE id = auth.uid()
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Helper: get current user's role
CREATE OR REPLACE FUNCTION auth.user_role()
RETURNS text AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid()
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Helper: get current user's department_id
CREATE OR REPLACE FUNCTION auth.user_department_id()
RETURNS uuid AS $$
  SELECT department_id FROM public.profiles WHERE id = auth.uid()
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- ============================================================
-- Drop all existing dev policies
-- ============================================================
DO $$
DECLARE
  pol RECORD;
BEGIN
  FOR pol IN
    SELECT policyname, tablename
    FROM pg_policies
    WHERE schemaname = 'public'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', pol.policyname, pol.tablename);
  END LOOP;
END $$;

-- ============================================================
-- Companies
-- ============================================================
CREATE POLICY "Users can view own company"
  ON companies FOR SELECT
  USING (id = auth.user_company_id());

-- ============================================================
-- Departments
-- ============================================================
CREATE POLICY "Users can view departments in own company"
  ON departments FOR SELECT
  USING (company_id = auth.user_company_id());

-- ============================================================
-- Profiles
-- ============================================================
CREATE POLICY "Users can view profiles in own company"
  ON profiles FOR SELECT
  USING (company_id = auth.user_company_id());

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

CREATE POLICY "Admins can insert profiles"
  ON profiles FOR INSERT
  WITH CHECK (
    auth.user_role() IN ('teacher', 'admin')
    AND company_id = auth.user_company_id()
  );

CREATE POLICY "Admins can delete profiles"
  ON profiles FOR DELETE
  USING (
    auth.user_role() IN ('teacher', 'admin')
    AND company_id = auth.user_company_id()
  );

-- ============================================================
-- Tasks
-- ============================================================
CREATE POLICY "Users can view tasks in own company"
  ON tasks FOR SELECT
  USING (company_id = auth.user_company_id());

CREATE POLICY "Authorized users can insert tasks"
  ON tasks FOR INSERT
  WITH CHECK (
    company_id = auth.user_company_id()
    AND (
      auth.user_role() IN ('teacher', 'admin')
      OR (auth.user_role() = 'department_lead' AND department_id = auth.user_department_id())
    )
  );

CREATE POLICY "Authorized users can update tasks"
  ON tasks FOR UPDATE
  USING (company_id = auth.user_company_id())
  WITH CHECK (
    auth.user_role() IN ('teacher', 'admin')
    OR (auth.user_role() = 'department_lead' AND department_id = auth.user_department_id())
    OR (
      -- Members can only update status on assigned tasks
      auth.user_role() IN ('member', 'department_lead')
      AND id IN (SELECT task_id FROM task_assignees WHERE profile_id = auth.uid())
    )
  );

CREATE POLICY "Authorized users can delete tasks"
  ON tasks FOR DELETE
  USING (
    company_id = auth.user_company_id()
    AND (
      auth.user_role() IN ('teacher', 'admin')
      OR (auth.user_role() = 'department_lead' AND department_id = auth.user_department_id())
    )
  );

-- ============================================================
-- Checklist Items (child table — uses sub-select)
-- ============================================================
CREATE POLICY "Users can view checklists for visible tasks"
  ON checklist_items FOR SELECT
  USING (task_id IN (SELECT id FROM tasks WHERE company_id = auth.user_company_id()));

CREATE POLICY "Authorized users can modify checklists"
  ON checklist_items FOR ALL
  USING (
    task_id IN (SELECT id FROM tasks WHERE company_id = auth.user_company_id())
    AND (
      auth.user_role() IN ('teacher', 'admin')
      OR task_id IN (SELECT task_id FROM task_assignees WHERE profile_id = auth.uid())
      OR task_id IN (
        SELECT id FROM tasks WHERE department_id = auth.user_department_id()
        AND auth.user_role() = 'department_lead'
      )
    )
  );

-- ============================================================
-- Task Assignees (child table)
-- ============================================================
CREATE POLICY "Users can view assignees for visible tasks"
  ON task_assignees FOR SELECT
  USING (task_id IN (SELECT id FROM tasks WHERE company_id = auth.user_company_id()));

CREATE POLICY "Authorized users can manage assignees"
  ON task_assignees FOR ALL
  USING (
    task_id IN (SELECT id FROM tasks WHERE company_id = auth.user_company_id())
    AND (
      auth.user_role() IN ('teacher', 'admin')
      OR (
        auth.user_role() = 'department_lead'
        AND task_id IN (SELECT id FROM tasks WHERE department_id = auth.user_department_id())
      )
    )
  );

-- ============================================================
-- Task Departments (child table)
-- ============================================================
CREATE POLICY "Users can view task departments"
  ON task_departments FOR SELECT
  USING (task_id IN (SELECT id FROM tasks WHERE company_id = auth.user_company_id()));

CREATE POLICY "Admins can manage task departments"
  ON task_departments FOR ALL
  USING (
    auth.user_role() IN ('teacher', 'admin')
    AND task_id IN (SELECT id FROM tasks WHERE company_id = auth.user_company_id())
  );

-- ============================================================
-- Task Comments (child table)
-- ============================================================
CREATE POLICY "Users can view comments on visible tasks"
  ON task_comments FOR SELECT
  USING (task_id IN (SELECT id FROM tasks WHERE company_id = auth.user_company_id()));

CREATE POLICY "Authenticated users can add comments"
  ON task_comments FOR INSERT
  WITH CHECK (
    profile_id = auth.uid()
    AND task_id IN (SELECT id FROM tasks WHERE company_id = auth.user_company_id())
  );

CREATE POLICY "Users can delete own comments"
  ON task_comments FOR DELETE
  USING (profile_id = auth.uid());

-- ============================================================
-- Calendar Events
-- ============================================================
CREATE POLICY "Users can view calendar events in own company"
  ON calendar_events FOR SELECT
  USING (company_id = auth.user_company_id());

CREATE POLICY "Admins can manage calendar events"
  ON calendar_events FOR ALL
  USING (
    auth.user_role() IN ('teacher', 'admin')
    AND company_id = auth.user_company_id()
  );

-- ============================================================
-- Print Requests
-- ============================================================
CREATE POLICY "Users can view print requests in own company"
  ON print_requests FOR SELECT
  USING (company_id = auth.user_company_id());

CREATE POLICY "Users can submit print requests"
  ON print_requests FOR INSERT
  WITH CHECK (
    company_id = auth.user_company_id()
    AND requested_by = auth.uid()
  );

CREATE POLICY "Admins can manage print requests"
  ON print_requests FOR UPDATE
  USING (
    auth.user_role() IN ('teacher', 'admin')
    AND company_id = auth.user_company_id()
  );

CREATE POLICY "Admins can delete print requests"
  ON print_requests FOR DELETE
  USING (
    auth.user_role() IN ('teacher', 'admin')
    AND company_id = auth.user_company_id()
  );

-- ============================================================
-- Task Periods
-- ============================================================
CREATE POLICY "Users can view periods in own company"
  ON task_periods FOR SELECT
  USING (company_id = auth.user_company_id());

CREATE POLICY "Admins can manage periods"
  ON task_periods FOR ALL
  USING (
    auth.user_role() IN ('teacher', 'admin')
    AND company_id = auth.user_company_id()
  );

-- ============================================================
-- Enable Realtime on all tables
-- ============================================================
ALTER PUBLICATION supabase_realtime ADD TABLE
  tasks,
  checklist_items,
  task_assignees,
  task_comments,
  task_departments,
  calendar_events,
  print_requests,
  profiles,
  task_periods,
  departments;
```

- [ ] **Step 2: Commit**

```bash
git add supabase/migrations/002_auth_rls_realtime.sql
git commit -m "feat: add proper RLS policies and enable Realtime on all tables"
```

---

## Task 11: Supabase Edge Function — Invite User

**Files:**
- Create: `supabase/functions/invite-user/index.ts`

**Note:** This runs on Supabase's Deno runtime, NOT in the Vite app. It requires the Supabase CLI to deploy (`supabase functions deploy invite-user`).

- [ ] **Step 1: Create the Edge Function**

Create `supabase/functions/invite-user/index.ts`:

```typescript
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Verify the caller is authenticated
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing authorization' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Create admin client with service role key
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    )

    // Create user client to verify caller's role
    const supabaseUser = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    )

    // Check caller is teacher or admin
    const { data: { user: caller } } = await supabaseUser.auth.getUser()
    if (!caller) {
      return new Response(JSON.stringify({ error: 'Not authenticated' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const { data: callerProfile } = await supabaseAdmin
      .from('profiles')
      .select('role, company_id')
      .eq('id', caller.id)
      .single()

    if (!callerProfile || !['teacher', 'admin'].includes(callerProfile.role)) {
      return new Response(JSON.stringify({ error: 'Insufficient permissions' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Parse request body
    const { email, full_name, department_id, role } = await req.json()

    if (!email || !full_name || !department_id || !role) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Validate role
    if (!['admin', 'department_lead', 'member', 'teacher'].includes(role)) {
      return new Response(JSON.stringify({ error: 'Invalid role' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Generate temporary password
    const tempPassword = crypto.randomUUID().slice(0, 12)

    // Create auth user
    const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password: tempPassword,
      email_confirm: true,
    })

    if (createError || !newUser.user) {
      return new Response(JSON.stringify({ error: createError?.message || 'Failed to create user' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Create profile row
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .insert({
        id: newUser.user.id,
        company_id: callerProfile.company_id,
        department_id,
        full_name,
        email,
        role,
      })

    if (profileError) {
      // Cleanup: delete the auth user if profile creation fails
      await supabaseAdmin.auth.admin.deleteUser(newUser.user.id)
      return new Response(JSON.stringify({ error: 'Failed to create profile: ' + profileError.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    return new Response(JSON.stringify({
      success: true,
      user_id: newUser.user.id,
      email,
      temporary_password: tempPassword,
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
```

- [ ] **Step 2: Commit**

```bash
git add supabase/functions/invite-user/index.ts
git commit -m "feat: add invite-user Edge Function for admin user creation"
```

---

## Task 12: Invite UI in EmployeeSettings

**Files:**
- Modify: `src/components/settings/EmployeeSettings.tsx` (480 lines)

- [ ] **Step 1: Add invite modal to EmployeeSettings**

In `src/components/settings/EmployeeSettings.tsx`:

Add imports:
```tsx
import { usePermissions } from '../../hooks/usePermissions'
import { useAuth } from '../auth/AuthProvider'
import { supabase } from '../../lib/supabase'
```

Add state for the invite flow:
```tsx
const { canManageEmployees } = usePermissions()
const [showInvite, setShowInvite] = useState(false)
const [inviteData, setInviteData] = useState({ email: '', fullName: '', departmentId: '', role: 'member' as string })
const [inviteResult, setInviteResult] = useState<{ tempPassword: string; email: string } | null>(null)
const [inviteError, setInviteError] = useState<string | null>(null)
const [inviting, setInviting] = useState(false)
```

Add invite handler:
```tsx
async function handleInvite() {
  setInviting(true)
  setInviteError(null)
  const { data, error } = await supabase.functions.invoke('invite-user', {
    body: {
      email: inviteData.email,
      full_name: inviteData.fullName,
      department_id: inviteData.departmentId,
      role: inviteData.role,
    },
  })
  setInviting(false)
  if (error || data?.error) {
    setInviteError(error?.message || data?.error || 'Failed to invite user')
  } else {
    setInviteResult({ tempPassword: data.temporary_password, email: data.email })
  }
}
```

Add invite button (only if `canManageEmployees`):
```tsx
{canManageEmployees && (
  <button onClick={() => setShowInvite(true)} className="...">
    Invite Employee
  </button>
)}
```

Add invite modal with form fields (email, name, department dropdown, role dropdown) and result display showing the temporary password.

- [ ] **Step 2: Wrap settings page for read-only non-admins**

At the top of the component, if `!canManageEmployees`, disable all edit/delete/invite buttons (add `disabled` prop or hide them).

- [ ] **Step 3: Apply same pattern to PeriodSettings and CompanySettings**

Add `usePermissions` import and `canManageSettings` check to both. If false, disable all mutation controls.

- [ ] **Step 4: Commit**

```bash
git add src/components/settings/EmployeeSettings.tsx src/components/settings/PeriodSettings.tsx src/components/settings/CompanySettings.tsx
git commit -m "feat: add admin invite flow and permission-gate settings pages"
```

---

## Task 13: Final Integration Verification

- [ ] **Step 1: Verify TypeScript compilation**

Run: `npx tsc --noEmit`
Expected: No errors

- [ ] **Step 2: Verify dev server starts**

Run: `npm run dev`
Expected: App starts, shows login page at root

- [ ] **Step 3: Grep for leftover CURRENT_USER_ID references**

Run: `grep -r "CURRENT_USER_ID" src/ --include="*.ts" --include="*.tsx"`
Expected: No results

- [ ] **Step 4: Grep for hardcoded company ID**

Run: `grep -r "00000000-0000-0000-0000-000000000001" src/ --include="*.ts" --include="*.tsx"`
Expected: Only in the fallback in `supabaseService.ts`

- [ ] **Step 5: Commit any remaining fixes**

```bash
git add -A
git commit -m "fix: resolve any remaining compilation and integration issues"
```
