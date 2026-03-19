# VE Task Manager — Full Frontend Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Complete all frontend phases of VE Task Manager — from Task CRUD through Calendar, Dashboard, Admin, and Polish — using mock data in Zustand stores.

**Architecture:** React 18 SPA with Vite + TypeScript + Tailwind CSS. State managed by Zustand stores (task, filter, ui, plus new calendar/period/print stores). React Router for URL-based navigation. All data is in-memory mock data — no backend.

**Tech Stack:** React 18, Vite 7, TypeScript 5.9, Tailwind CSS 4, Zustand 5, React Router 7, @dnd-kit, Tiptap, Recharts, date-fns, Lucide React

**Spec:** `docs/superpowers/specs/2026-03-17-full-frontend-implementation-design.md`

---

## File Structure Overview

### New Files to Create

```
src/
├── components/
│   ├── common/
│   │   ├── Modal.tsx                  # Reusable dialog (backdrop, close, title, footer)
│   │   ├── Toast.tsx                  # Toast notification system (success/error/info)
│   │   ├── ConfirmDialog.tsx          # Destructive action confirmation
│   │   └── EmptyState.tsx             # Reusable empty state (icon, message, action)
│   ├── tasks/
│   │   ├── TaskCreateModal.tsx        # Task creation form modal
│   │   ├── TaskBoard.tsx              # Kanban board view (5 status columns)
│   │   ├── TaskCard.tsx               # Compact card for board view
│   │   ├── TaskComments.tsx           # Comment thread in TaskDetail
│   │   ├── TaskManagementLog.tsx      # Department log view (mirrors original doc)
│   │   └── AssigneeSelect.tsx         # Multi-select assignee dropdown
│   ├── calendar/
│   │   ├── CalendarView.tsx           # Monthly grid calendar
│   │   ├── CalendarDayCell.tsx        # Single day cell with event pills
│   │   ├── CalendarDayPopover.tsx     # Day detail popover
│   │   └── EventCreateModal.tsx       # Calendar event creation form
│   ├── dashboard/
│   │   ├── DashboardView.tsx          # Company-wide overview
│   │   ├── DepartmentCard.tsx         # Department progress card
│   │   ├── UpcomingDeadlines.tsx      # Deadlines widget
│   │   └── StatusChart.tsx            # Donut chart (Recharts)
│   ├── departments/
│   │   ├── InterDepartmentView.tsx    # Cross-department task view
│   │   ├── TradeShowHub.tsx           # Trade show grouped tasks
│   │   └── CompetitionHub.tsx         # Competition tasks + deadlines
│   ├── print/
│   │   ├── PrintRequestsView.tsx      # Print request table
│   │   └── PrintRequestModal.tsx      # Print request form
│   └── settings/
│       ├── SettingsView.tsx           # Tabbed settings page
│       ├── CompanySettings.tsx        # Company info tab
│       ├── DepartmentSettings.tsx     # Department management tab
│       ├── EmployeeSettings.tsx       # Employee CRUD tab
│       ├── PeriodSettings.tsx         # Task period management tab
│       └── PreferencesSettings.tsx    # User preferences tab
├── stores/
│   ├── calendarStore.ts              # Calendar events CRUD
│   ├── periodStore.ts                # Task periods + active period
│   ├── printStore.ts                 # Print requests CRUD
│   └── toastStore.ts                 # Toast notification state
└── lib/
    └── mockCalendarData.ts           # Calendar event seed data
```

### Existing Files to Modify

```
src/App.tsx                            # Replace view-state routing with React Router
src/components/layout/Sidebar.tsx      # NavLink instead of setActiveView
src/components/layout/TopBar.tsx       # Remove uiStore.activeView dependency, add assignee filter
src/components/layout/AppShell.tsx     # Wrap with Router, render Outlet
src/components/tasks/TaskList.tsx      # Get activeView from URL params instead of uiStore
src/components/tasks/TaskDetail.tsx    # Add edit mode, assignee management, comments, priority edit
src/components/tasks/TaskChecklist.tsx # Add CRUD: add/edit/delete/reorder items, evidence editing
src/stores/taskStore.ts               # Add full CRUD mutations, comments, taskDepartments, profiles CRUD
src/stores/uiStore.ts                 # Remove activeView + searchQuery, keep sidebar/viewMode/selectedTask
src/stores/filterStore.ts             # (unchanged — already correct)
src/lib/types.ts                      # Add TaskDepartment interface
src/lib/constants.ts                  # Add PRINT_STATUSES, EVENT_TYPES constants
src/lib/mockData.ts                   # Add mock comments, taskDepartments, calendar events, print requests
src/index.css                         # Add styles for calendar grid, toast animations, modal backdrop
```

---

## Task 1: Install Dependencies

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Install react-router-dom**

```bash
cd "c:/Users/mrisa/Claude Projects/CompanyTaskOrganizer" && npm install react-router-dom
```

- [ ] **Step 2: Install @dnd-kit packages**

```bash
npm install @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities
```

- [ ] **Step 3: Install recharts**

```bash
npm install recharts
```

- [ ] **Step 4: Verify build still works**

```bash
npm run build
```
Expected: Build succeeds with no errors.

- [ ] **Step 5: Commit**

```bash
git add package.json package-lock.json
git commit -m "feat: install react-router-dom, @dnd-kit, recharts"
```

---

## Task 2: Add Types, Constants, and Extended Mock Data

**Files:**
- Modify: `src/lib/types.ts` — add `TaskDepartment` interface
- Modify: `src/lib/constants.ts` — add `PRINT_STATUSES`, `EVENT_TYPES`, `PRINT_PAPER_TYPES`
- Modify: `src/lib/mockData.ts` — add mock comments, task departments, calendar events, print requests, extra periods

- [ ] **Step 1: Add TaskDepartment type to types.ts**

Add after `TaskAssignee` interface (~line 70):
```typescript
export interface TaskDepartment {
  id: string
  taskId: string
  departmentId: string
  roleDescription: string
  createdAt: string
}
```

- [ ] **Step 2: Move DEPARTMENTS into mutable store support**

Currently `DEPARTMENTS` is a `const` array in `constants.ts`. To enable editing departments in Settings (Task 18), we need them in a Zustand store. However, to avoid a massive cross-cutting refactor right now, add a compatibility layer:

Add to `constants.ts`:
```typescript
// Default departments — used as initial state for the store
export const DEFAULT_DEPARTMENTS = DEPARTMENTS
```

Then in `taskStore.ts`, add `departments` to state initialized from `DEFAULT_DEPARTMENTS`. The existing `getDepartmentById()` and `getDepartmentByAbbr()` helper functions in `constants.ts` stay unchanged for now — they'll be updated in Task 18 to read from the store.

- [ ] **Step 3: Add constants for print requests and calendar events to constants.ts**

Add at bottom of `constants.ts`:
```typescript
export const PRINT_STATUSES: { value: PrintRequest['status']; label: string; color: string }[] = [
  { value: 'pending', label: 'Pending', color: '#F59E0B' },
  { value: 'approved', label: 'Approved', color: '#3B82F6' },
  { value: 'printed', label: 'Printed', color: '#8B5CF6' },
  { value: 'delivered', label: 'Delivered', color: '#10B981' },
]

export const EVENT_TYPES: { value: CalendarEvent['eventType']; label: string; color: string }[] = [
  { value: 'trade_show', label: 'Trade Show', color: '#F59E0B' },
  { value: 'competition', label: 'Competition', color: '#8B5CF6' },
  { value: 'deadline', label: 'Deadline', color: '#EF4444' },
  { value: 'meeting', label: 'Meeting', color: '#3B82F6' },
  { value: 'no_school', label: 'No School', color: '#6B7280' },
]

export const PRINT_PAPER_TYPES: { value: string; label: string }[] = [
  { value: 'plain', label: 'Plain' },
  { value: 'cardstock', label: 'Cardstock' },
  { value: 'sticker', label: 'Sticker' },
  { value: 'other', label: 'Other' },
]
```

Update import at top of `constants.ts`:
```typescript
import type { TaskStatus, TaskPriority, TaskCategory, EvidenceType, PrintRequest, CalendarEvent } from './types'
```

- [ ] **Step 3: Add mock comments to mockData.ts**

```typescript
import type { Task, Profile, ChecklistItem, TaskPeriod, TaskAssignee, TaskComment, TaskDepartment, CalendarEvent, PrintRequest } from './types'

export const MOCK_COMMENTS: TaskComment[] = [
  { id: 'cm1', taskId: 't2', profileId: 'p1', content: 'Still waiting on Branding and Digital Ops status reports. Following up today.', createdAt: '2026-01-20T09:30:00Z' },
  { id: 'cm2', taskId: 't2', profileId: 'p2', content: 'I can help chase down the remaining reports.', createdAt: '2026-01-20T10:15:00Z' },
  { id: 'cm3', taskId: 't7', profileId: 'p3', content: 'Found 3 uncategorized transactions from December. Checking with vendor.', createdAt: '2026-01-15T14:00:00Z' },
  { id: 'cm4', taskId: 't14', profileId: 'p11', content: 'Campaign objectives doc is ready for review. Need BD to confirm banner timeline.', createdAt: '2026-01-21T11:00:00Z' },
  { id: 'cm5', taskId: 't22', profileId: 'p1', content: 'Practice round 1 scheduled for Feb 3. Everyone needs to have their sections ready.', createdAt: '2026-01-20T16:00:00Z' },
]
```

- [ ] **Step 4: Add mock task department role assignments**

```typescript
export const MOCK_TASK_DEPARTMENTS: TaskDepartment[] = [
  { id: 'td1', taskId: 't18', departmentId: 'dept-ad', roleDescription: 'Logistics, scheduling, transport', createdAt: '2026-01-06T00:00:00Z' },
  { id: 'td2', taskId: 't18', departmentId: 'dept-af', roleDescription: 'Budget, cash handling, pricing', createdAt: '2026-01-06T00:00:00Z' },
  { id: 'td3', taskId: 't18', departmentId: 'dept-bd', roleDescription: 'Booth design, banners, display cards', createdAt: '2026-01-06T00:00:00Z' },
  { id: 'td4', taskId: 't18', departmentId: 'dept-do', roleDescription: 'Website updates, QR codes', createdAt: '2026-01-06T00:00:00Z' },
  { id: 'td5', taskId: 't18', departmentId: 'dept-mk', roleDescription: 'Pre-show campaign, press kit', createdAt: '2026-01-06T00:00:00Z' },
  { id: 'td6', taskId: 't18', departmentId: 'dept-sp', roleDescription: 'Product catalog, pitch decks, demos', createdAt: '2026-01-06T00:00:00Z' },
  { id: 'td7', taskId: 't18', departmentId: 'dept-hr', roleDescription: 'Staff scheduling, dress code memo', createdAt: '2026-01-06T00:00:00Z' },
  { id: 'td8', taskId: 't19', departmentId: 'dept-mk', roleDescription: 'Lead content compilation and layout', createdAt: '2026-01-06T00:00:00Z' },
  { id: 'td9', taskId: 't19', departmentId: 'dept-bd', roleDescription: 'Newsletter design and branding', createdAt: '2026-01-06T00:00:00Z' },
]
```

- [ ] **Step 5: Add additional mock periods**

```typescript
export const MOCK_PERIODS: TaskPeriod[] = [
  { id: 'period-1', companyId: 'siply', name: 'Period 1 (Sep/Oct)', startDate: '2025-09-08', endDate: '2025-10-31', isActive: false },
  { id: 'period-2', companyId: 'siply', name: 'Period 2 (Nov/Dec)', startDate: '2025-11-03', endDate: '2025-12-19', isActive: false },
  MOCK_PERIOD, // Period 3 — already defined, active
]
```

Replace the single `MOCK_PERIOD` export with `MOCK_PERIODS` array.

- [ ] **Step 6: Add mock calendar events**

```typescript
export const MOCK_CALENDAR_EVENTS: CalendarEvent[] = [
  { id: 'ev1', companyId: 'siply', title: 'Regional Trade Show', eventType: 'trade_show', startDate: '2026-02-08', endDate: '2026-02-09', relatedTaskId: 't18', description: 'Annual VE Regional Trade Show at convention center' },
  { id: 'ev2', companyId: 'siply', title: 'Business Plan Competition', eventType: 'competition', startDate: '2026-02-15', relatedTaskId: 't22', description: 'VE Business Plan Competition submission deadline' },
  { id: 'ev3', companyId: 'siply', title: 'Presidents Day — No School', eventType: 'no_school', startDate: '2026-02-16' },
  { id: 'ev4', companyId: 'siply', title: 'Board of Directors Meeting', eventType: 'meeting', startDate: '2026-02-14', relatedTaskId: 't3' },
  { id: 'ev5', companyId: 'siply', title: 'Financial Statements Due', eventType: 'deadline', startDate: '2026-01-24', relatedTaskId: 't5' },
  { id: 'ev6', companyId: 'siply', title: 'MLK Day — No School', eventType: 'no_school', startDate: '2026-01-19' },
  { id: 'ev7', companyId: 'siply', title: 'Practice Presentation Round 1', eventType: 'meeting', startDate: '2026-02-03', relatedTaskId: 't22' },
]
```

- [ ] **Step 7: Add mock print requests**

```typescript
export const MOCK_PRINT_REQUESTS: PrintRequest[] = [
  { id: 'pr1', companyId: 'siply', itemName: 'Trade Show Banners (2x)', linkToPdf: 'https://drive.google.com/file/banners', requestedBy: 'p5', departmentId: 'dept-bd', quantity: 2, sided: 'single', paperType: 'cardstock', status: 'approved', createdAt: '2026-01-20T00:00:00Z' },
  { id: 'pr2', companyId: 'siply', itemName: 'Product Catalog Booklets', linkToPdf: 'https://drive.google.com/file/catalog', requestedBy: 'p13', departmentId: 'dept-sp', quantity: 50, sided: 'double', paperType: 'cardstock', status: 'pending', createdAt: '2026-01-25T00:00:00Z' },
  { id: 'pr3', companyId: 'siply', itemName: 'Promotional Flyers', requestedBy: 'p6', departmentId: 'dept-bd', quantity: 100, sided: 'double', paperType: 'plain', status: 'pending', createdAt: '2026-01-22T00:00:00Z' },
]
```

- [ ] **Step 8: Verify build**

```bash
npm run build
```

- [ ] **Step 9: Commit**

```bash
git add src/lib/types.ts src/lib/constants.ts src/lib/mockData.ts
git commit -m "feat: add TaskDepartment type, extended constants, and comprehensive mock data"
```

---

## Task 3: Toast Notification System

**Files:**
- Create: `src/stores/toastStore.ts`
- Create: `src/components/common/Toast.tsx`

- [ ] **Step 1: Create toast store**

Create `src/stores/toastStore.ts`:
```typescript
import { create } from 'zustand'

export interface ToastItem {
  id: string
  type: 'success' | 'error' | 'info'
  message: string
}

interface ToastState {
  toasts: ToastItem[]
  addToast: (type: ToastItem['type'], message: string) => void
  removeToast: (id: string) => void
}

export const useToastStore = create<ToastState>((set) => ({
  toasts: [],
  addToast: (type, message) => {
    const id = crypto.randomUUID()
    set((s) => ({ toasts: [...s.toasts.slice(-2), { id, type, message }] }))
    setTimeout(() => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })), 3000)
  },
  removeToast: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
}))
```

- [ ] **Step 2: Create Toast component**

Create `src/components/common/Toast.tsx`:
```tsx
import { X, CheckCircle2, AlertCircle, Info } from 'lucide-react'
import { useToastStore } from '@/stores/toastStore'

const ICONS = {
  success: <CheckCircle2 size={16} className="text-emerald-400" />,
  error: <AlertCircle size={16} className="text-red-400" />,
  info: <Info size={16} className="text-blue-400" />,
}

export function ToastContainer() {
  const { toasts, removeToast } = useToastStore()

  return (
    <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className="flex items-center gap-2.5 rounded-lg border border-border-subtle bg-surface-2 px-4 py-3 shadow-xl animate-in slide-in-from-right"
        >
          {ICONS[toast.type]}
          <span className="text-sm text-text-primary">{toast.message}</span>
          <button onClick={() => removeToast(toast.id)} className="ml-2 text-text-tertiary hover:text-text-primary">
            <X size={14} />
          </button>
        </div>
      ))}
    </div>
  )
}
```

- [ ] **Step 3: Add toast animation CSS to index.css**

Add at the bottom of `src/index.css`:
```css
/* Toast animation */
@keyframes slide-in-from-right {
  from { transform: translateX(100%); opacity: 0; }
  to { transform: translateX(0); opacity: 1; }
}
.animate-in.slide-in-from-right {
  animation: slide-in-from-right 0.2s ease-out;
}
```

- [ ] **Step 4: Verify build**

```bash
npm run build
```

- [ ] **Step 5: Commit**

```bash
git add src/stores/toastStore.ts src/components/common/Toast.tsx src/index.css
git commit -m "feat: add toast notification system"
```

---

## Task 4: Modal and ConfirmDialog Components

**Files:**
- Create: `src/components/common/Modal.tsx`
- Create: `src/components/common/ConfirmDialog.tsx`
- Create: `src/components/common/EmptyState.tsx`

- [ ] **Step 1: Create Modal component**

Create `src/components/common/Modal.tsx`:
```tsx
import { useEffect, useRef } from 'react'
import { X } from 'lucide-react'

interface ModalProps {
  open: boolean
  onClose: () => void
  title: string
  children: React.ReactNode
  footer?: React.ReactNode
  width?: string  // Tailwind width class, default 'w-[560px]'
}

export function Modal({ open, onClose, title, children, footer, width = 'w-[560px]' }: ModalProps) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    if (open) document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [open, onClose])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div ref={ref} className={`relative ${width} max-h-[85vh] flex flex-col rounded-xl border border-border-subtle bg-surface-1 shadow-2xl`}>
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border-subtle px-6 py-4">
          <h3 className="text-base font-semibold text-text-primary">{title}</h3>
          <button onClick={onClose} className="flex h-7 w-7 items-center justify-center rounded-md text-text-tertiary hover:bg-surface-3 hover:text-text-primary">
            <X size={16} />
          </button>
        </div>
        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-4">{children}</div>
        {/* Footer */}
        {footer && (
          <div className="flex items-center justify-end gap-2 border-t border-border-subtle px-6 py-4">{footer}</div>
        )}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Create ConfirmDialog component**

Create `src/components/common/ConfirmDialog.tsx`:
```tsx
import { Modal } from './Modal'

interface ConfirmDialogProps {
  open: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  message: string
  confirmLabel?: string
  destructive?: boolean
}

export function ConfirmDialog({ open, onClose, onConfirm, title, message, confirmLabel = 'Delete', destructive = true }: ConfirmDialogProps) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      width="w-[420px]"
      footer={
        <>
          <button onClick={onClose} className="rounded-lg border border-border-subtle px-4 py-2 text-sm text-text-secondary hover:bg-surface-3">
            Cancel
          </button>
          <button
            onClick={() => { onConfirm(); onClose() }}
            className={`rounded-lg px-4 py-2 text-sm font-medium text-white ${destructive ? 'bg-red-600 hover:bg-red-700' : 'bg-accent hover:bg-accent-hover'}`}
          >
            {confirmLabel}
          </button>
        </>
      }
    >
      <p className="text-sm text-text-secondary">{message}</p>
    </Modal>
  )
}
```

- [ ] **Step 3: Create EmptyState component**

Create `src/components/common/EmptyState.tsx`:
```tsx
interface EmptyStateProps {
  icon: React.ReactNode
  title: string
  description?: string
  action?: React.ReactNode
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-text-tertiary">
      <div className="mb-3 opacity-40">{icon}</div>
      <p className="text-sm font-medium">{title}</p>
      {description && <p className="mt-1 text-xs">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}
```

- [ ] **Step 4: Verify build**

```bash
npm run build
```

- [ ] **Step 5: Commit**

```bash
git add src/components/common/Modal.tsx src/components/common/ConfirmDialog.tsx src/components/common/EmptyState.tsx
git commit -m "feat: add Modal, ConfirmDialog, and EmptyState components"
```

---

## Task 5: React Router Migration

**Files:**
- Modify: `src/App.tsx` — replace view-state routing with `<BrowserRouter>` + `<Routes>`
- Modify: `src/components/layout/Sidebar.tsx` — use `<NavLink>` + `useLocation`
- Modify: `src/components/layout/TopBar.tsx` — derive title from URL, not uiStore
- Unchanged: `src/components/layout/AppShell.tsx` — stays as-is (uses children pattern, not Outlet)
- Modify: `src/components/tasks/TaskList.tsx` — get view from URL params
- Modify: `src/stores/uiStore.ts` — remove `activeView` and `searchQuery`

- [ ] **Step 1: Refactor uiStore.ts — remove activeView and searchQuery**

Replace entire file with:
```typescript
import { create } from 'zustand'
import type { ViewMode } from '@/lib/types'

interface UIState {
  sidebarCollapsed: boolean
  toggleSidebar: () => void

  viewMode: ViewMode
  setViewMode: (mode: ViewMode) => void

  selectedTaskId: string | null
  openTaskDetail: (taskId: string) => void
  closeTaskDetail: () => void
}

export const useUIStore = create<UIState>((set) => ({
  sidebarCollapsed: false,
  toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),

  viewMode: 'list',
  setViewMode: (mode) => set({ viewMode: mode }),

  selectedTaskId: null,
  openTaskDetail: (taskId) => set({ selectedTaskId: taskId }),
  closeTaskDetail: () => set({ selectedTaskId: null }),
}))
```

- [ ] **Step 2: Rewrite App.tsx with React Router**

```tsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AppShell } from '@/components/layout/AppShell'
import { TaskList } from '@/components/tasks/TaskList'
import { TaskDetail } from '@/components/tasks/TaskDetail'
import { ToastContainer } from '@/components/common/Toast'

// Placeholder views — will be replaced in later tasks
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
```

- [ ] **Step 3: Update Sidebar.tsx to use NavLink**

Replace the imports and navigation logic:
- Import `NavLink` and `useLocation` from `react-router-dom`
- Remove `useUIStore` import of `activeView` and `setActiveView`
- Keep `sidebarCollapsed` and `toggleSidebar` from uiStore
- Change `SPECIAL_SECTIONS` to include `path` field:
```typescript
import { Settings } from 'lucide-react'  // add to imports

const SPECIAL_SECTIONS = [
  { path: '/inter-department', label: 'Inter-Department', icon: ArrowLeftRight },
  { path: '/trade-shows', label: 'Trade Shows', icon: Store },
  { path: '/competitions', label: 'Competitions', icon: Trophy },
  { path: '/calendar', label: 'Calendar', icon: Calendar },
  { path: '/print-requests', label: 'Print Requests', icon: Printer },
  { path: '/settings', label: 'Settings', icon: Settings },
] as const
```
- Dashboard NavButton: `to="/"` with `end` prop
- Department buttons: `to={`/department/${dept.abbreviation}`}`
- Special sections: `to={section.path}`
- Change `NavButton` to accept `to` prop and use `<NavLink>` instead of `<button onClick>`
- Use `({ isActive })` render prop from `NavLink` for active styling

- [ ] **Step 4: Update TopBar.tsx — derive title from location**

Replace `getViewTitle` function:
- Import `useLocation`, `useParams` from `react-router-dom`
- Remove `useUIStore` import (no longer need `activeView`)
- Derive view title from pathname:
  - `/department/:abbr` → find department by abbreviation from `useParams()`
  - `/inter-department` → "Inter-Department Tasks"
  - `/trade-shows` → "Trade Shows"
  - `/competitions` → "Competitions"
  - `/calendar` → "Calendar"
  - `/print-requests` → "Print Requests"
  - `/settings` → "Settings"
  - `/` → "Dashboard"

- [ ] **Step 5: Update TaskList.tsx — accept viewOverride prop and useParams**

Add `viewOverride` prop and use `useParams`:
```typescript
import { useParams } from 'react-router-dom'
import { getDepartmentByAbbr } from '@/lib/constants'

interface TaskListProps {
  viewOverride?: string
}

export function TaskList({ viewOverride }: TaskListProps) {
  const { abbr } = useParams<{ abbr: string }>()
  // Remove useUIStore activeView import

  // IMPORTANT: getDepartmentByAbbr('AD') returns { id: 'dept-ad', ... }
  // The getTasksForView helper still uses dept.id format (e.g., 'dept-ad'),
  // so this mapping preserves compatibility with the existing filtering logic.
  const activeView = viewOverride ?? (abbr ? getDepartmentByAbbr(abbr)?.id ?? '' : 'dashboard')

  // The getTasksForView function (lines 10-29) is UNCHANGED.
  // It already maps dept.id → tasks, which continues to work.
  // ... rest stays the same, using activeView for filtering
}
```

- [ ] **Step 6: Verify the app works**

```bash
npm run dev
```

Test: Navigate sidebar links, verify URL changes, verify task list renders per department, verify task detail panel still opens.

- [ ] **Step 7: Commit**

```bash
git add src/App.tsx src/stores/uiStore.ts src/components/layout/Sidebar.tsx src/components/layout/TopBar.tsx src/components/tasks/TaskList.tsx
git commit -m "feat: migrate from view-state to React Router navigation"
```

---

## Task 6: Task CRUD — Store Mutations

**Files:**
- Modify: `src/stores/taskStore.ts` — add full CRUD: addTask, updateTask, deleteTask, addAssignee, removeAssignee, addComment, profile CRUD

- [ ] **Step 1: Expand taskStore with all CRUD mutations**

Add to the `TaskState` interface and implementation:

```typescript
// New state arrays
comments: TaskComment[]
taskDepartments: TaskDepartment[]

// Task CRUD
addTask: (task: Task) => void
updateTask: (taskId: string, updates: Partial<Task>) => void
deleteTask: (taskId: string) => void

// Assignee CRUD
addAssignee: (taskId: string, profileId: string, isPrimary: boolean) => void
removeAssignee: (taskId: string, profileId: string) => void
togglePrimaryAssignee: (taskId: string, profileId: string) => void

// Checklist CRUD
addChecklistItem: (item: ChecklistItem) => void
updateChecklistItem: (itemId: string, updates: Partial<ChecklistItem>) => void
deleteChecklistItem: (itemId: string) => void
reorderChecklistItem: (itemId: string, direction: 'up' | 'down') => void

// Comments
getCommentsForTask: (taskId: string) => TaskComment[]
addComment: (comment: TaskComment) => void
deleteComment: (commentId: string) => void

// Task Departments
getTaskDepartments: (taskId: string) => TaskDepartment[]
addTaskDepartment: (td: TaskDepartment) => void
removeTaskDepartment: (tdId: string) => void

// Profile CRUD (admin)
addProfile: (profile: Profile) => void
updateProfile: (profileId: string, updates: Partial<Profile>) => void
deleteProfile: (profileId: string) => void

// Task code helper
getNextTaskCode: (departmentAbbr: string, periodNumber: number) => string
```

Implementation notes for each mutation:
- `addTask`: push to tasks array
- `updateTask`: map over tasks, spread updates, set `updatedAt`
- `deleteTask`: filter out task, also filter out its checklists, assignees, comments
- `addAssignee`: push to assignees with new UUID
- `removeAssignee`: filter out by taskId+profileId
- `addChecklistItem`: push to checklists
- `updateChecklistItem`: map over checklists, spread updates
- `deleteChecklistItem`: filter out
- `reorderChecklistItem`: swap sortOrder with adjacent item in same task
- `addComment`: push to comments
- `getNextTaskCode`: find max sequence number for dept+period prefix, increment
- `addProfile`/`updateProfile`/`deleteProfile`: standard array operations

- [ ] **Step 2: Import new mock data**

Update initial state to include:
```typescript
comments: MOCK_COMMENTS,
taskDepartments: MOCK_TASK_DEPARTMENTS,
```

- [ ] **Step 3: Verify build**

```bash
npm run build
```

- [ ] **Step 4: Commit**

```bash
git add src/stores/taskStore.ts
git commit -m "feat: add full CRUD mutations to taskStore (tasks, checklists, assignees, comments, profiles)"
```

---

## Task 7: Task Create Modal

**Files:**
- Create: `src/components/tasks/TaskCreateModal.tsx`
- Create: `src/components/tasks/AssigneeSelect.tsx`
- Modify: `src/components/layout/TopBar.tsx` — add "New Task" button
- Modify: `src/components/tasks/TaskList.tsx` — add "New Task" button in empty state

- [ ] **Step 1: Create AssigneeSelect component**

Create `src/components/tasks/AssigneeSelect.tsx` — a dropdown that shows profiles grouped by department. When a profile is selected, it calls `onAdd(profileId)`. Shows currently selected assignees as pills with remove button.

Props: `selectedIds: string[]`, `onAdd: (id: string) => void`, `onRemove: (id: string) => void`

- [ ] **Step 2: Create TaskCreateModal**

Create `src/components/tasks/TaskCreateModal.tsx`:
- Uses `<Modal>` component
- Form fields: title (input), task code (input with auto-suggestion), department (select from DEPARTMENTS), category (select from TASK_CATEGORIES), priority (select from TASK_PRIORITIES), due date (native date input), description (RichTextEditor), responsibility note (input), assignees (AssigneeSelect)
- On submit: generate UUID for task id, call `taskStore.addTask()`, show success toast, close modal
- Task code auto-suggestion: call `getNextTaskCode()` when department changes

- [ ] **Step 3: Add "New Task" button to TopBar**

In `TopBar.tsx`, add a `+ New Task` button before the filters:
```tsx
<button
  onClick={() => setShowCreateModal(true)}
  className="flex items-center gap-1.5 rounded-lg bg-accent px-3 py-1.5 text-xs font-medium text-white hover:bg-accent-hover"
>
  <Plus size={14} />
  New Task
</button>
```

Render `<TaskCreateModal open={showCreateModal} onClose={() => setShowCreateModal(false)} />` at bottom of TopBar.

- [ ] **Step 4: Verify — create a task**

Run dev server, click "New Task", fill form, submit. Verify task appears in list.

- [ ] **Step 5: Commit**

```bash
git add src/components/tasks/TaskCreateModal.tsx src/components/tasks/AssigneeSelect.tsx src/components/layout/TopBar.tsx
git commit -m "feat: add task creation modal with auto-generated task codes"
```

---

## Task 8: Task Edit & Delete in TaskDetail

**Files:**
- Modify: `src/components/tasks/TaskDetail.tsx` — add inline editing for all fields, delete button, assignee management

- [ ] **Step 1: Add edit state and inline editing**

Add local state for edit mode. When in edit mode:
- Title: renders as `<input>` instead of `<h2>`
- Due date: renders as `<input type="date">` instead of formatted text
- Priority: renders as `<select>` dropdown
- Category: renders as `<select>` dropdown
- Responsibility note: renders as `<input>` instead of `<p>`
- All changes call `updateTask()` on blur/change

Add an "Edit" toggle button in the header next to close button.

- [ ] **Step 2: Add delete button**

Add a delete button (Trash2 icon) in the header. On click, opens `<ConfirmDialog>` with "Delete this task?" message. On confirm, calls `deleteTask(task.id)`, shows success toast, closes detail panel.

- [ ] **Step 3: Add assignee management**

Replace the static assignees list with editable version:
- Show current assignees with "Primary" badge and remove (X) button
- Add `<AssigneeSelect>` below for adding new assignees
- Toggle primary flag by clicking the star icon next to each assignee
- Uses `addAssignee()`, `removeAssignee()`, `togglePrimaryAssignee()` from taskStore

- [ ] **Step 4: Add priority edit in metadata grid**

Make the priority field in the metadata grid an editable dropdown (similar to StatusChip pattern):
```tsx
<select
  value={task.priority}
  onChange={(e) => updateTask(task.id, { priority: e.target.value as TaskPriority })}
  className="..." // same styling as StatusChip select
>
  {TASK_PRIORITIES.map((p) => (
    <option key={p.value} value={p.value}>{p.label}</option>
  ))}
</select>
```

- [ ] **Step 5: Verify — edit and delete tasks**

Test: Open task detail, edit title/priority/due date, verify changes persist. Delete a task, verify it disappears.

- [ ] **Step 6: Commit**

```bash
git add src/components/tasks/TaskDetail.tsx
git commit -m "feat: add inline editing and delete to TaskDetail panel"
```

---

## Task 9: Checklist CRUD

**Files:**
- Modify: `src/components/tasks/TaskChecklist.tsx` — add/edit/delete/reorder items, inline evidence editing

- [ ] **Step 1: Add "Add Item" inline form**

At the bottom of the checklist items, add a form row:
- Text input for label
- Select dropdown for evidence type (from EVIDENCE_TYPES)
- Text input for required evidence description
- "Add" button that calls `addChecklistItem()` with generated UUID and next sortOrder
- Form clears after submit

- [ ] **Step 2: Add inline editing to ChecklistRow**

When clicking on a checklist item's label or evidence requirement:
- Swap to edit mode (local state `editingId`)
- Label becomes an `<input>` pre-filled with current value
- Evidence requirement becomes an `<input>`
- Evidence type becomes a `<select>`
- Save on blur or Enter, calling `updateChecklistItem()`
- Cancel on Escape

- [ ] **Step 3: Add inline evidence value editing**

When clicking the evidence value area (or "Add evidence" placeholder if empty):
- For `text` type: `<input type="text">`
- For `link` type: `<input type="url">` with basic URL validation
- For `date` type: `<input type="date">`
- For `teacher_observation` type: "Stamp" button that sets value to current date/time string
- Save on blur, calling `updateChecklistItem({ evidenceValue: value })`

- [ ] **Step 4: Add delete and reorder buttons**

Each ChecklistRow gets:
- X button (visible on hover) → calls `deleteChecklistItem(item.id)` with inline confirm
- Up/Down arrow buttons → calls `reorderChecklistItem(item.id, 'up' | 'down')`
- Arrows disabled at top/bottom boundaries

- [ ] **Step 5: Verify — full checklist workflow**

Test: Add item, edit label, add evidence, reorder, delete. Verify all operations persist in store.

- [ ] **Step 6: Commit**

```bash
git add src/components/tasks/TaskChecklist.tsx
git commit -m "feat: add checklist CRUD — add, edit, delete, reorder, inline evidence editing"
```

---

## Task 10: Kanban Board View

**Files:**
- Create: `src/components/tasks/TaskBoard.tsx`
- Create: `src/components/tasks/TaskCard.tsx`
- Modify: `src/App.tsx` — wire viewMode toggle to show Board or List

- [ ] **Step 1: Create TaskCard component**

Create `src/components/tasks/TaskCard.tsx`:
- Compact card layout: task code (bold, department color left border), title (single line truncated), bottom row: priority badge + assignee avatars (max 2) + checklist progress fraction
- Click opens TaskDetail
- Wrapped in `useSortable` from @dnd-kit for drag support

- [ ] **Step 2: Create TaskBoard component**

Create `src/components/tasks/TaskBoard.tsx`:
- 5 columns, one per status from `TASK_STATUSES`
- Each column: header (status label + count), scrollable card list
- Uses `DndContext` + `SortableContext` from @dnd-kit
- `onDragEnd` handler: detect which column card was dropped into, call `updateTaskStatus()`
- Empty columns show muted "No tasks" text
- Accepts same filtering as TaskList (status filter hides/shows columns, priority filter applies to cards, search filters cards)

Props: `viewOverride?: string` (same pattern as TaskList)

- [ ] **Step 3: Wire viewMode toggle in App.tsx**

Update routes to conditionally render TaskList or TaskBoard based on `uiStore.viewMode`:
```tsx
function TaskView({ viewOverride }: { viewOverride?: string }) {
  const viewMode = useUIStore((s) => s.viewMode)
  return viewMode === 'board'
    ? <TaskBoard viewOverride={viewOverride} />
    : <TaskList viewOverride={viewOverride} />
}
```
Use `<TaskView>` in routes instead of raw `<TaskList>`:
```tsx
<Route path="/department/:abbr" element={<TaskView />} />
<Route path="/inter-department" element={<TaskView viewOverride="inter_department" />} />
<Route path="/trade-shows" element={<TaskView viewOverride="trade_show" />} />
<Route path="/competitions" element={<TaskView viewOverride="competition" />} />
```

**Note:** The `viewOverride` pattern for inter-department, trade-shows, and competitions routes is TEMPORARY. Task 15 will replace these with dedicated hub components.

- [ ] **Step 4: Verify — drag cards between columns**

Test: Switch to board view, verify columns show. Drag a card from "Not Started" to "In Progress", verify status updates.

- [ ] **Step 5: Commit**

```bash
git add src/components/tasks/TaskBoard.tsx src/components/tasks/TaskCard.tsx src/App.tsx
git commit -m "feat: add Kanban board view with drag-and-drop status changes"
```

---

## Task 11: Comments

**Files:**
- Create: `src/components/tasks/TaskComments.tsx`
- Modify: `src/components/tasks/TaskDetail.tsx` — add TaskComments section

- [ ] **Step 1: Create TaskComments component**

Create `src/components/tasks/TaskComments.tsx`:
- Props: `taskId: string`
- Gets comments via `getCommentsForTask(taskId)`, sorted by createdAt ascending
- Each comment: avatar (from profile), name, relative time (date-fns `formatDistanceToNow`), content text
- Add comment form at bottom: text input + "Comment" submit button
- On submit: generate UUID, use `CURRENT_USER_ID` (add `export const CURRENT_USER_ID = 'p15'` to `constants.ts` — Ms. Thompson, for mock mode), call `addComment()`, clear input

- [ ] **Step 2: Add TaskComments to TaskDetail**

In `TaskDetail.tsx`, after the checklist section, add:
```tsx
<div className="border-t border-border-subtle p-5">
  <TaskComments taskId={task.id} />
</div>
```

- [ ] **Step 3: Verify — add and view comments**

Test: Open a task with existing mock comments, verify they show. Add a new comment, verify it appears.

- [ ] **Step 4: Commit**

```bash
git add src/components/tasks/TaskComments.tsx src/components/tasks/TaskDetail.tsx
git commit -m "feat: add comment thread to TaskDetail panel"
```

---

## Task 12: Polish — Assignee Filter, SearchQuery Dedup, Task Management Log

**Files:**
- Modify: `src/components/layout/TopBar.tsx` — add assignee filter dropdown
- Modify: `src/lib/types.ts` — update `ViewMode` to `'list' | 'board' | 'log'`
- Create: `src/components/tasks/TaskManagementLog.tsx` — department log view

- [ ] **Step 1: Add assignee filter dropdown to TopBar**

After the priority filter dropdown, add:
```tsx
<select
  value={assigneeFilter ?? ''}
  onChange={(e) => setAssigneeFilter(e.target.value || null)}
  className="h-8 rounded-md border border-border-subtle bg-surface-2 px-2 text-xs text-text-secondary outline-none transition-colors focus:border-border-strong"
>
  <option value="">All Assignees</option>
  {profiles.map((p) => (
    <option key={p.id} value={p.id}>{p.fullName}</option>
  ))}
</select>
```

Get `profiles` from `useTaskStore`, get `assigneeFilter` and `setAssigneeFilter` from `useFilterStore`.

- [ ] **Step 2: Wire assignee filter into TaskList**

In `TaskList.tsx`, add assignee filtering after priority filter:
```typescript
if (assigneeFilter) {
  const assigneeTaskIds = assignees.filter(a => a.profileId === assigneeFilter).map(a => a.taskId)
  result = result.filter(t => assigneeTaskIds.includes(t.id))
}
```

Get `assignees` from taskStore and `assigneeFilter` from filterStore.

- [ ] **Step 3: Create TaskManagementLog view**

Create `src/components/tasks/TaskManagementLog.tsx`:
- Table format mirroring original Google Docs layout
- Columns: Task Code, Title, Checklist Progress, Status, Assignees, Due Date, Planned Completion, Actual Completion
- Wider rows, more data visible than TaskRow
- Used as an alternate view for department pages

This is accessed via a third view mode option (list | board | log) or as a separate route. For simplicity, add a "Log" button to the view toggle in TopBar alongside List and Board.

- [ ] **Step 4: Verify assignee filter and log view**

Test: Select an assignee from dropdown, verify task list filters. Switch to log view, verify tabular format.

- [ ] **Step 5: Commit**

```bash
git add src/components/layout/TopBar.tsx src/components/tasks/TaskList.tsx src/components/tasks/TaskManagementLog.tsx
git commit -m "feat: add assignee filter, task management log view, and polish fixes"
```

---

## Task 13: Calendar View

**Files:**
- Create: `src/stores/calendarStore.ts`
- Create: `src/components/calendar/CalendarView.tsx`
- Create: `src/components/calendar/CalendarDayCell.tsx`
- Create: `src/components/calendar/CalendarDayPopover.tsx`
- Create: `src/components/calendar/EventCreateModal.tsx`
- Modify: `src/App.tsx` — replace calendar placeholder with CalendarView

- [ ] **Step 1: Create calendarStore**

Create `src/stores/calendarStore.ts`:
```typescript
import { create } from 'zustand'
import type { CalendarEvent } from '@/lib/types'
import { MOCK_CALENDAR_EVENTS } from '@/lib/mockData'

interface CalendarState {
  events: CalendarEvent[]
  getEventsForDate: (date: string) => CalendarEvent[]  // date as 'YYYY-MM-DD'
  getEventsForMonth: (year: number, month: number) => CalendarEvent[]
  addEvent: (event: CalendarEvent) => void
  updateEvent: (eventId: string, updates: Partial<CalendarEvent>) => void
  deleteEvent: (eventId: string) => void
}
```

- [ ] **Step 2: Create CalendarDayCell component**

Shows day number, up to 3 event/task pills (department-colored for tasks, type-colored for events), overflow indicator "+N more". Accepts `date`, `events`, `tasks`, `isCurrentMonth`, `isToday` props.

- [ ] **Step 3: Create CalendarDayPopover component**

When a day cell is clicked, shows a popover listing all tasks due that day and all events on that day. Each item is clickable — tasks open TaskDetail, events show details inline.

- [ ] **Step 4: Create CalendarView component**

Full monthly calendar grid:
- Header: `< March 2026 >` with prev/next month buttons and "Today" button
- Day-of-week header row (Sun–Sat)
- 5-6 rows of CalendarDayCell components
- Uses `date-fns`: `startOfMonth`, `endOfMonth`, `startOfWeek`, `endOfWeek`, `eachDayOfInterval`, `isSameMonth`, `isToday`, `format`
- Gets task due dates from taskStore and calendar events from calendarStore
- State: `currentMonth` (Date), `selectedDay` (string | null for popover)

- [ ] **Step 5: Create EventCreateModal**

Uses `<Modal>` with form fields: title, event type (select from EVENT_TYPES), start date, end date (optional), description, related task (optional select from all tasks).

- [ ] **Step 6: Wire into App.tsx**

Replace the calendar placeholder route with `<CalendarView />`.

- [ ] **Step 7: Add calendar-specific CSS**

Add to `src/index.css`:
```css
/* Calendar grid */
.calendar-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
}
```

- [ ] **Step 8: Verify — navigate months, see events and task pills**

Test: Go to /calendar, verify monthly grid renders. Navigate to Feb 2026, verify trade show and competition events appear. Click a day with events, verify popover.

- [ ] **Step 9: Commit**

```bash
git add src/stores/calendarStore.ts src/components/calendar/ src/App.tsx src/index.css
git commit -m "feat: add full calendar view with events, task due dates, and day popovers"
```

---

## Task 14: Dashboard View

**Files:**
- Create: `src/components/dashboard/DashboardView.tsx`
- Create: `src/components/dashboard/DepartmentCard.tsx`
- Create: `src/components/dashboard/UpcomingDeadlines.tsx`
- Create: `src/components/dashboard/StatusChart.tsx`
- Modify: `src/App.tsx` — replace dashboard placeholder

- [ ] **Step 1: Create DepartmentCard component**

Card showing: department color bar at top, department name, completion percentage as progress ring (SVG circle), task counts (total, completed, in-progress, overdue). Click navigates to `/department/:abbr`.

Uses data derived from taskStore: filter tasks by department, count statuses.

- [ ] **Step 2: Create UpcomingDeadlines widget**

List of tasks due in next 14 days, sorted by date. Each row: department color dot, task code, title (truncated), due date, status chip. Click opens TaskDetail.

- [ ] **Step 3: Create StatusChart**

Recharts `PieChart` with `Pie` component showing task count by status. Colors from `TASK_STATUSES`. Legend below chart. Centered in a card.

```tsx
import { PieChart, Pie, Cell, Legend, ResponsiveContainer } from 'recharts'
```

- [ ] **Step 4: Create DashboardView**

Layout:
- Top row: 7 DepartmentCards in a responsive grid (grid-cols-2 md:grid-cols-3 lg:grid-cols-4)
- Below: 2-column layout — left: UpcomingDeadlines, right: StatusChart
- Bottom: Overdue tasks alert panel (red border) listing overdue incomplete tasks

- [ ] **Step 5: Wire into App.tsx**

Replace `"/"` route placeholder with `<DashboardView />`.

- [ ] **Step 6: Verify — dashboard renders with real data**

Test: Navigate to `/`, verify department cards show correct counts, deadlines list is populated, chart renders.

- [ ] **Step 7: Commit**

```bash
git add src/components/dashboard/ src/App.tsx
git commit -m "feat: add dashboard with department progress, deadlines, and status chart"
```

---

## Task 15: Inter-Department, Trade Show, and Competition Hubs

**Files:**
- Create: `src/components/departments/InterDepartmentView.tsx`
- Create: `src/components/departments/TradeShowHub.tsx`
- Create: `src/components/departments/CompetitionHub.tsx`
- Modify: `src/App.tsx` — wire new views into routes

- [ ] **Step 1: Create InterDepartmentView**

Shows all inter-department tasks. For each task, shows a "Department Roles" expandable section using `taskDepartments` from taskStore. Each role row: department color dot, department name, role description. Plus the standard task info (status, assignees, checklist progress).

- [ ] **Step 2: Create TradeShowHub**

Groups trade show tasks by related calendar events. Each group card: event name/date/description at top, then list of related TS-coded tasks with aggregated checklist progress bar.

Gets data by: finding calendar events with `eventType === 'trade_show'`, then matching tasks via `relatedTaskId` or `category === 'trade_show'`.

- [ ] **Step 3: Create CompetitionHub**

Similar to TradeShowHub but for competition tasks. Shows deadline countdown (days remaining computed from `dueDate`), submission status, required deliverables (checklist items).

- [ ] **Step 4: Wire into App.tsx**

Replace the `TaskList viewOverride` routes with the dedicated hub components:
```tsx
<Route path="/inter-department" element={<InterDepartmentView />} />
<Route path="/trade-shows" element={<TradeShowHub />} />
<Route path="/competitions" element={<CompetitionHub />} />
```

- [ ] **Step 5: Verify**

Test: Navigate to each hub, verify data displays correctly.

- [ ] **Step 6: Commit**

```bash
git add src/components/departments/ src/App.tsx
git commit -m "feat: add inter-department view, trade show hub, and competition hub"
```

---

## Task 16: Task Periods & Carry-Over

**Files:**
- Create: `src/stores/periodStore.ts`
- Modify: `src/components/layout/TopBar.tsx` — add period selector dropdown
- Modify: `src/components/tasks/TaskList.tsx` — filter by active period

- [ ] **Step 1: Create periodStore**

Create `src/stores/periodStore.ts`:
```typescript
import { create } from 'zustand'
import type { TaskPeriod } from '@/lib/types'
import { MOCK_PERIODS } from '@/lib/mockData'

interface PeriodState {
  periods: TaskPeriod[]
  activePeriodId: string

  setActivePeriod: (periodId: string) => void
  addPeriod: (period: TaskPeriod) => void
  updatePeriod: (periodId: string, updates: Partial<TaskPeriod>) => void
  deletePeriod: (periodId: string) => void
}

export const usePeriodStore = create<PeriodState>((set) => ({
  periods: MOCK_PERIODS,
  activePeriodId: 'period-3',

  setActivePeriod: (periodId) => set({ activePeriodId: periodId }),
  addPeriod: (period) => set((s) => ({ periods: [...s.periods, period] })),
  updatePeriod: (periodId, updates) =>
    set((s) => ({ periods: s.periods.map((p) => p.id === periodId ? { ...p, ...updates } : p) })),
  deletePeriod: (periodId) =>
    set((s) => ({ periods: s.periods.filter((p) => p.id !== periodId) })),
}))
```

- [ ] **Step 2: Add period selector to TopBar**

Before the status filter, add a period dropdown:
```tsx
<select
  value={activePeriodId}
  onChange={(e) => setActivePeriod(e.target.value)}
  className="h-8 rounded-md border border-border-subtle bg-surface-2 px-2 text-xs font-medium text-text-primary outline-none"
>
  {periods.map((p) => (
    <option key={p.id} value={p.id}>{p.name}</option>
  ))}
</select>
```

- [ ] **Step 3: Filter TaskList by active period**

In `TaskList.tsx` (and `TaskBoard.tsx`), add period filtering:
```typescript
const { activePeriodId } = usePeriodStore()
// After getting tasks for view:
result = result.filter((t) => t.taskPeriodId === activePeriodId)
```

- [ ] **Step 4: Add carry-over action to TaskDetail**

For tasks that are not completed, add a "Carry Over" button that:
1. Finds the next period: sort `periods` by `startDate`, find the one after current `activePeriodId`. If no next period exists, show error toast "No next period available — create one in Settings first."
2. Sets original task status to `carried_over`
3. Creates a duplicate task in the next period with `carriedFromPeriod` set, status `not_started`, new UUID
4. Duplicates checklist items (reset `isCompleted` to false, clear `evidenceValue` and `completedBy`)
5. Shows success toast

Add helper to `periodStore`:
```typescript
getNextPeriod: () => {
  const { periods, activePeriodId } = get()
  const sorted = [...periods].sort((a, b) => a.startDate.localeCompare(b.startDate))
  const activeIdx = sorted.findIndex((p) => p.id === activePeriodId)
  return activeIdx >= 0 && activeIdx < sorted.length - 1 ? sorted[activeIdx + 1] : null
}
```

- [ ] **Step 5: Verify**

Test: Switch period selector, verify tasks filter. Carry over a task, verify duplicate appears.

- [ ] **Step 6: Commit**

```bash
git add src/stores/periodStore.ts src/components/layout/TopBar.tsx src/components/tasks/TaskList.tsx src/components/tasks/TaskBoard.tsx src/components/tasks/TaskDetail.tsx
git commit -m "feat: add task period selector and carry-over system"
```

---

## Task 17: Print Requests

**Files:**
- Create: `src/stores/printStore.ts`
- Create: `src/components/print/PrintRequestsView.tsx`
- Create: `src/components/print/PrintRequestModal.tsx`
- Modify: `src/App.tsx` — wire print requests route

- [ ] **Step 1: Create printStore**

Standard Zustand store with `printRequests: PrintRequest[]`, CRUD operations, initialized with `MOCK_PRINT_REQUESTS`.

- [ ] **Step 2: Create PrintRequestModal**

Form in `<Modal>`: item name, PDF link, department (select), quantity (number input), sided (radio: single/double), paper type (select from PRINT_PAPER_TYPES), notes (textarea). Submit calls `addPrintRequest()`.

- [ ] **Step 3: Create PrintRequestsView**

Table with columns: Item Name, Department, Requested By, Qty, Paper, Status, Date. Each row shows data from printStore. Status is an editable `StatusChip`-style dropdown (using PRINT_STATUSES). "New Request" button opens PrintRequestModal. Empty state when no requests.

- [ ] **Step 4: Wire into App.tsx**

Replace print-requests placeholder route with `<PrintRequestsView />`.

- [ ] **Step 5: Verify**

Test: Navigate to /print-requests, verify table shows mock data. Create a new request, verify it appears. Change status.

- [ ] **Step 6: Commit**

```bash
git add src/stores/printStore.ts src/components/print/ src/App.tsx
git commit -m "feat: add print request system with CRUD and status workflow"
```

---

## Task 18: Settings Page — Admin Features

**Files:**
- Create: `src/components/settings/SettingsView.tsx` — tabbed container
- Create: `src/components/settings/CompanySettings.tsx`
- Create: `src/components/settings/DepartmentSettings.tsx`
- Create: `src/components/settings/EmployeeSettings.tsx`
- Create: `src/components/settings/PeriodSettings.tsx`
- Create: `src/components/settings/PreferencesSettings.tsx`
- Modify: `src/App.tsx` — wire settings route

- [ ] **Step 1: Create SettingsView (tabbed container)**

Tabbed layout with tabs: Company, Departments, Employees, Periods, Preferences. Active tab state managed locally. Renders the corresponding settings component.

- [ ] **Step 2: Create CompanySettings**

Form fields: company name, school year, description (textarea). Editable — saves to a simple local state or a new companyStore. Since there's no backend, this just persists in-memory.

- [ ] **Step 3: Create DepartmentSettings**

Table of departments: name, abbreviation, color (color input), sort order. Actions: edit (inline), add (form row at bottom), delete (with confirm if tasks exist), reorder (up/down arrows). Uses DEPARTMENTS from constants — but to make them mutable, copy into a Zustand store or manage locally.

**Important:** Since DEPARTMENTS is currently a const array in constants.ts, this task needs to either:
- Move departments into taskStore as mutable state (recommended), OR
- Create a new departmentStore

Recommended: Add `departments` array to taskStore, initialized from the DEPARTMENTS constant. Update all components that read from `DEPARTMENTS` to read from `taskStore.departments` instead.

- [ ] **Step 4: Create EmployeeSettings**

Table of all profiles: name, email, department (dropdown), role (dropdown: admin/department_lead/member/teacher). Actions:
- Add: modal form with name, email, department, role
- Edit: inline editing on table row
- Delete: confirm dialog, warns if assigned to tasks, calls `deleteProfile()` which also removes from assignees

- [ ] **Step 5: Create PeriodSettings**

Table of task periods: name, start date, end date, active (radio/toggle). Add/edit/delete periods. Set active period.

- [ ] **Step 6: Create PreferencesSettings**

Simple form: theme toggle (dark/light — for now just dark), default landing view (dropdown of routes).

- [ ] **Step 7: Wire into App.tsx**

Replace settings placeholder route with `<SettingsView />`.

- [ ] **Step 8: Verify — full admin workflow**

Test: Add an employee, assign to department, verify they appear in assignee dropdowns. Edit a department color, verify it updates across the app. Manage periods.

- [ ] **Step 9: Commit**

```bash
git add src/components/settings/ src/App.tsx src/stores/taskStore.ts
git commit -m "feat: add settings page with company, department, employee, and period management"
```

---

## Task 19: Global Search

**Files:**
- Create: `src/components/common/SearchOverlay.tsx`
- Modify: `src/App.tsx` — add keyboard listener for Cmd/Ctrl+K

- [ ] **Step 1: Create SearchOverlay**

Full-screen overlay (z-60) triggered by Cmd/Ctrl+K:
- Search input at top (auto-focused)
- Results grouped by type: Tasks, Checklist Items, Comments
- Each result: icon, title/content, subtitle (task code for checklists/comments)
- Click result: for tasks → openTaskDetail, for checklists/comments → openTaskDetail of parent task
- Close on Escape or click outside
- Keyboard: up/down arrow to navigate results, Enter to select

Search logic: filter tasks by title/code/description, checklists by label, comments by content. All case-insensitive substring match.

- [ ] **Step 2: Add keyboard listener**

In `App.tsx`, add global Cmd/Ctrl+K handler that opens the search overlay. Disable when any text input has focus (check `document.activeElement.tagName`).

- [ ] **Step 3: Verify**

Test: Press Cmd+K, type a search term, verify results appear grouped, click result opens task detail.

- [ ] **Step 4: Commit**

```bash
git add src/components/common/SearchOverlay.tsx src/App.tsx
git commit -m "feat: add global search overlay with Cmd/Ctrl+K shortcut"
```

---

## Task 20: Keyboard Shortcuts

**Files:**
- Create: `src/hooks/useKeyboardShortcuts.ts`
- Create: `src/components/common/ShortcutsOverlay.tsx`
- Modify: `src/App.tsx` — initialize keyboard shortcuts

- [ ] **Step 1: Create useKeyboardShortcuts hook**

Custom hook that registers global keyboard listeners:
- `j` / `k` — navigate task list (move visual selection up/down, open task detail)
- `Enter` — open selected task detail
- `Escape` — close detail panel (already handled in TaskDetail)
- `n` — open task create modal
- `?` — toggle shortcuts help overlay

**All shortcuts disabled when**: `document.activeElement` is an input, textarea, select, or contenteditable element.

- [ ] **Step 2: Create ShortcutsOverlay**

Simple modal listing all shortcuts in a table format. Toggled by `?` key.

- [ ] **Step 3: Wire into App.tsx**

Call `useKeyboardShortcuts()` in App component.

- [ ] **Step 4: Verify**

Test: Press `?` to see shortcuts. Press `j`/`k` to navigate. Press `n` to create task.

- [ ] **Step 5: Commit**

```bash
git add src/hooks/useKeyboardShortcuts.ts src/components/common/ShortcutsOverlay.tsx src/App.tsx
git commit -m "feat: add keyboard shortcuts (j/k navigation, n for new task, ? for help)"
```

---

## Task 21: Mobile Responsive Layout

**Files:**
- Modify: `src/components/layout/AppShell.tsx` — mobile sidebar toggle
- Modify: `src/components/layout/Sidebar.tsx` — overlay mode on small screens
- Modify: `src/components/tasks/TaskDetail.tsx` — full-screen on mobile
- Modify: `src/index.css` — responsive breakpoints

- [ ] **Step 1: Mobile sidebar**

On screens < 768px:
- Sidebar is hidden by default (overlay mode)
- Hamburger button in TopBar triggers sidebar as full-height overlay with backdrop
- Sidebar auto-closes when a nav item is clicked

- [ ] **Step 2: Mobile task detail**

On screens < 768px, TaskDetail renders as full-screen modal instead of 520px slide-over.

- [ ] **Step 3: Mobile task list**

On screens < 640px, TaskRow switches to a compact card layout (stacked instead of columnar).

- [ ] **Step 4: Responsive grid adjustments**

Dashboard: `grid-cols-1 sm:grid-cols-2 lg:grid-cols-4`
Calendar: cells compress on small screens, show fewer event pills

- [ ] **Step 5: Verify on narrow viewport**

Test: Resize browser to 375px width, verify sidebar overlay, task list cards, full-screen detail.

- [ ] **Step 6: Commit**

```bash
git add src/components/layout/ src/components/tasks/TaskDetail.tsx src/components/tasks/TaskRow.tsx src/index.css
git commit -m "feat: add mobile responsive layout with overlay sidebar and compact views"
```

---

## Task 22: Final Polish & Build Verification

**Files:**
- Various — fix any remaining issues

- [ ] **Step 1: Add loading skeleton CSS**

Add to `src/index.css`:
```css
@keyframes shimmer {
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}
.skeleton {
  background: linear-gradient(90deg, var(--color-surface-3) 25%, var(--color-surface-4) 50%, var(--color-surface-3) 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
  border-radius: 4px;
}
```

- [ ] **Step 2: Verify all routes work**

Navigate to every route and verify:
- `/` — Dashboard with department cards, deadlines, chart
- `/department/AD` through `/department/SP` — each department's tasks
- `/inter-department` — cross-department view
- `/trade-shows` — trade show hub
- `/competitions` — competition hub
- `/calendar` — monthly calendar with events
- `/print-requests` — print request table
- `/settings` — tabbed settings with all 5 tabs

- [ ] **Step 3: Verify all CRUD operations**

- Create a task → appears in list
- Edit task fields → persists
- Delete task → removed from list
- Add/edit/delete checklist items → reflects in progress
- Add/remove assignees → appears in task detail
- Create calendar event → appears on calendar
- Submit print request → appears in table
- Add/edit/delete employees → reflected in assignee dropdowns
- Carry over a task → duplicate created in new period

- [ ] **Step 4: Run production build**

```bash
npm run build
```
Expected: Build succeeds with zero errors.

- [ ] **Step 5: Preview production build**

```bash
npm run preview
```
Test: Open browser, navigate through app, verify everything works.

- [ ] **Step 6: Final commit**

```bash
git add -A
git commit -m "feat: complete VE Task Manager frontend — all phases implemented"
```

---

## Summary

| Task | Phase | Description |
|------|-------|-------------|
| 1 | Setup | Install dependencies (router, dnd-kit, recharts) |
| 2 | Setup | Types, constants, extended mock data |
| 3 | 1.5 | Toast notification system |
| 4 | 1.5 | Modal, ConfirmDialog, EmptyState components |
| 5 | 1.5 | React Router migration |
| 6 | 1.1 | Task store CRUD mutations |
| 7 | 1.1 | Task creation modal |
| 8 | 1.1 | Task edit & delete in TaskDetail |
| 9 | 1.2 | Checklist CRUD (add/edit/delete/reorder/evidence) |
| 10 | 1.3 | Kanban board with drag-and-drop |
| 11 | 1.4 | Comments thread |
| 12 | 1.5 | Assignee filter, log view, polish |
| 13 | 3 | Calendar view with events |
| 14 | 4 | Dashboard with analytics |
| 15 | 5 | Inter-dept, trade show, competition hubs |
| 16 | 6 | Task periods & carry-over |
| 17 | 7 | Print requests |
| 18 | Admin | Settings page (company, departments, employees, periods) |
| 19 | 10 | Global search (Cmd/Ctrl+K) |
| 20 | 10 | Keyboard shortcuts |
| 21 | 10 | Mobile responsive |
| 22 | 10 | Final polish & build verification |

---

## Deferred Items (Not in This Plan)

These spec items are intentionally deferred to a follow-up plan:
- **PDF/CSV Export** — requires choosing a PDF library and designing export templates
- **Task Templates** — save/apply task structures for new periods
- **Recent Activity Feed** — dashboard widget showing latest changes (needs activity logging infrastructure)
- **Supabase Integration** (Phase 8) — per user request
- **Authentication & Roles** (Phase 9) — per user request
