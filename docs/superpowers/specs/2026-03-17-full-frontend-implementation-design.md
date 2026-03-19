# VE Task Manager — Full Frontend Implementation Design

> **Created:** 2026-03-17
> **Scope:** Complete all frontend phases (skip Supabase/Auth backend)
> **Starting state:** Phase 1 ~90% complete, Phase 2 (Rich Text) complete

---

## Overview

Complete the VE Task Manager frontend across all remaining phases using mock data in Zustand stores. Add React Router for URL-based navigation. Skip Phases 8 (Supabase) and 9 (Auth) entirely.

---

## Cross-Cutting Changes

### React Router Integration

Add `react-router-dom`. Replace `uiStore.activeView` navigation with URL routing.

**Routes:**
| Path | Component | Description |
|------|-----------|-------------|
| `/` | `DashboardView` | Company-wide overview |
| `/department/:abbr` | `DepartmentView` | Single department tasks |
| `/inter-department` | `InterDepartmentView` | Cross-department tasks |
| `/trade-shows` | `TradeShowHub` | Trade show tasks + timeline |
| `/competitions` | `CompetitionHub` | Competition tasks + deadlines |
| `/calendar` | `CalendarView` | Monthly calendar grid |
| `/print-requests` | `PrintRequestsView` | Print request queue |
| `/settings` | `SettingsView` | Company/user preferences |

**Migration:** `Sidebar.tsx` uses `<NavLink>` instead of `setActiveView()`. `App.tsx` uses `<BrowserRouter>` + `<Routes>`. `uiStore.activeView` removed; derive active state from URL params. `uiStore.selectedTaskId` stays (detail panel is overlay, not a route).

### Shared UI Components (New)

- **Modal** — Reusable dialog with backdrop, close on Escape/click-outside, title, content, footer actions. Used by task creation, delete confirmation, event creation.
- **Toast** — Lightweight notification system for CRUD feedback. Auto-dismiss after 3s. Stack up to 3 toasts. Types: success, error, info. Renders fixed bottom-right, above sidebar and detail panel z-index layers.
- **ConfirmDialog** — Specialized modal for destructive actions ("Delete this task?") with cancel/confirm buttons.
- **DatePicker** — Styled native `<input type="date">` with label. No external library needed.

### Type Additions

Add `TaskDepartment` interface to `src/lib/types.ts` (referenced in CLAUDE.md schema but not yet defined):
```typescript
interface TaskDepartment {
  id: string;
  taskId: string;
  departmentId: string;
  roleDescription: string; // e.g., "CO- Coordinate", "Marketing- Develop Year Long Plan"
  createdAt: string;
}
```

### Store Architecture

- **taskStore** — Tasks and their direct children: checklists, assignees, comments, taskDepartments
- **periodStore** (new) — Task periods, active period ID, period CRUD
- **calendarStore** (new) — Calendar events, event CRUD
- **printStore** (new) — Print requests, request CRUD
- **filterStore** — Shared filters (status, priority, assignee, search) used by task list and board views
- **uiStore** — Sidebar state, view mode, selected task ID (remove `activeView` and `searchQuery`)

**View-specific filtering:** Dashboard, Calendar, Trade Show Hub, and Competition Hub do NOT use the shared `filterStore`. They have view-local state or derive data directly from stores. Only task list views (department, inter-department) and board view share the `filterStore`.

### Empty States

Every new view must include an empty state with an icon, message, and action hint:
- Calendar: "No events this month" + create event button
- Dashboard: "No tasks yet" + create task prompt
- Inter-Department: "No inter-department tasks" + explanation
- Trade Show Hub: "No trade show tasks" + create task prompt
- Competition Hub: "No competition tasks" + create task prompt
- Print Requests: "No print requests" + submit request button
- Board empty columns: "No tasks" (muted text, centered)

---

## Phase 1 Completion (Gaps)

### 1.1 — Task CRUD

**TaskCreateModal:** Form fields — title, task code (auto-suggested), department, category, priority, due date, description (RichTextEditor), responsibility note. Assignee multi-select from profiles list. Store mutation: `addTask()`.

**TaskDetail edit mode:** Toggle fields to editable (title as input, due date as date picker, priority as dropdown, etc.). Store mutation: `updateTask()`.

**Task delete:** ConfirmDialog trigger from TaskDetail. Store mutation: `deleteTask()`.

**Task code auto-generation:** Given department abbreviation + period number, find max sequence and suggest next (e.g., `AD 3.5` exists → suggest `AD 3.6`).

**Assignee management:** In TaskDetail, show assignee list with add/remove. Dropdown selects from company profiles (grouped by department). Toggle primary assignee flag. Shows assignee name, department, and role.

**Priority management:** In TaskDetail, priority is an editable dropdown (already partially exists in StatusChip pattern). Also allow setting priority during task creation. Priority changes should be reflected immediately in all views (list, board, calendar pills).

### 1.2 — Checklist CRUD

**Add item:** Inline form at checklist bottom — label input, evidence type dropdown, required evidence text. Store: `addChecklistItem()`.

**Edit item:** Click label or evidence to enter inline edit mode. Store: `updateChecklistItem()`.

**Delete item:** X button with confirm. Store: `deleteChecklistItem()`.

**Reorder:** Up/down arrow buttons on each item to swap sort_order. (Skip drag-and-drop for checklist items — keep dnd-kit for board only.)

**Inline evidence editing:** Click evidence cell to type/paste the actual value. For links, validate URL format. For dates, show date picker.

**Teacher observation stamp:** Button that sets evidence_type to 'teacher_observation' and evidence_value to current date/time string.

### 1.3 — Board View (Kanban)

Install `@dnd-kit/core`, `@dnd-kit/sortable`, `@dnd-kit/utilities`.

**TaskBoard:** 5 columns (one per status). Each column shows filtered+sorted task cards. Column headers show count.

**TaskCard:** Compact card — task code (colored), title (truncated), priority badge, assignee avatars, checklist progress mini-bar.

**Drag-and-drop:** Drag cards between columns to change status. Visual drop indicators. Calls `updateTaskStatus()`.

**ViewMode toggle:** TopBar switches between `<TaskList>` and `<TaskBoard>` via `uiStore.viewMode`. Both respect same filters.

### 1.4 — Comments

**TaskComments:** Displayed in TaskDetail below checklist. Chronological thread.

**Comment form:** Text input + submit button. Shows current user avatar. Store: `addComment()`.

**Store changes:** Add `comments: TaskComment[]` to taskStore. Add `getCommentsForTask(taskId)`. Add mock comments to seed data.

### 1.5 — Polish

- Remove `searchQuery` from `uiStore` (use only `filterStore`). Update `TopBar.tsx` to read/write from `filterStore.searchQuery` instead of `uiStore.searchQuery`.
- Add assignee filter dropdown to TopBar
- Empty column state in board view
- Skeleton loading placeholders (CSS-only shimmer)
- **TaskManagementLog view** — Department task log format mirroring the original Google Docs layout. Table with task code, title, checklist progress, status, assignees, planned/actual completion. This is the closest UI analog to the system being replaced and serves as the basis for PDF export in Phase 10.

---

## Phase 3: Calendar & Events

**CalendarView:** Monthly grid (7 columns x 5-6 rows). Navigate prev/next month. "Today" button.

**Day cells:** Show task due date pills (department-colored) and event pills (type-colored). Overflow indicator if >3 items.

**Day detail popover:** Click a day → popover listing all tasks/events for that day. Click task → opens TaskDetail.

**CalendarEvent creation:** Modal form — title, type (trade_show, competition, deadline, meeting, no_school), start/end dates, description, related task.

**Store:** Add `calendarEvents: CalendarEvent[]` to a new `calendarStore.ts`. CRUD operations. Mock data: trade show dates, competition deadlines, school breaks.

---

## Phase 4: Dashboard & Analytics

Install `recharts`.

**DashboardView (replaces the "all tasks" list on `/`):**
- **Department progress cards** — 7 cards, each with department name, color bar, completion % as progress ring, task counts (total/done/in-progress/overdue).
- **Upcoming deadlines widget** — List of tasks due in next 14 days, sorted by date, with department badge and status.
- **Overdue tasks alert** — Red-highlighted panel listing all overdue incomplete tasks. Click to open detail.
- **Status distribution chart** — Donut chart (Recharts) showing task count by status.
- **Recent activity feed** — Latest 10 status changes, checklist completions. Derived from mock data timestamps.

**Department-level stats:** When viewing a department page, show a stats header (total tasks, completion rate, checklist evidence rate, overdue count).

---

## Phase 5: Inter-Department & Cross-Functional

**InterDepartmentView:** List all `category === 'inter_department'` tasks. For each, show a department role grid — which departments are involved and their specific roles (from `task_departments` data).

**Role editing:** In task detail for inter-dept tasks, add a "Department Roles" section. Add/edit/remove department role assignments.

**TradeShowHub:** `/trade-shows` shows TS-coded tasks grouped by trade show event. Each event card: name, date, location, aggregated checklist progress across all related tasks.

**CompetitionHub:** `/competitions` shows competition tasks with deadline countdown, submission status, required deliverables.

**Store:** Add `taskDepartments: TaskDepartment[]` to taskStore. CRUD operations. Mock data for department role assignments.

---

## Phase 6: Task Periods & Carry-Over

**Task period selector:** Dropdown in TopBar (or sub-header) showing available periods. Switching period filters all views.

**Period management:** Settings page section — create/edit periods (name, start date, end date). Set active period.

**Carry-over system:** End-of-period review view showing incomplete tasks. Bulk select → "Carry to next period" action. This performs two operations: (1) sets the original task's status to `carried_over`, and (2) creates a **duplicate** task in the new period with `carried_from_period` set to the original's period ID, status `not_started`, and the same checklist items (reset to incomplete). The original task and its checklist evidence are preserved as a historical record.

**Store:** New `periodStore.ts` with `taskPeriods: TaskPeriod[]` and `activePeriodId`. Period CRUD operations. Mock data for 3 periods (Period 1 Sep/Oct, Period 2 Nov/Dec, Period 3 Jan/Feb — active).

---

## Phase 7: Print Requests

**PrintRequestsView:** Table with columns: item name, department, requester, quantity, paper type, status.

**Print request form:** Modal — item name, PDF link, department, quantity, sided (single/double), paper type, notes.

**Status workflow:** Pending → Approved → Printed → Delivered. Status chip with color coding.

**Store:** New `printStore.ts` with `printRequests: PrintRequest[]`. CRUD operations. Mock data.

---

## Phase 10: Polish & Advanced

### Search
Global search (Cmd/Ctrl+K) — search across tasks (title, code, description), checklist items (label), comments (content). Results grouped by type in a dropdown overlay.

### Keyboard Shortcuts
- `j/k` — Navigate task list
- `Enter` — Open selected task
- `Escape` — Close detail panel
- `n` — New task
- `?` — Show shortcuts overlay
- **Note:** All shortcuts must be disabled when a text input, textarea, or RichTextEditor has focus to avoid conflicts with typing.

### Mobile Responsive
- Sidebar as hamburger overlay on small screens
- Task list as compact cards
- Task detail as full-screen modal
- Touch-friendly control sizes

### Export
- PDF export of department task log (using `@react-pdf/renderer` or `jspdf`)
- CSV export of task data

### Task Templates
- Save task structure as template (title pattern, checklist items, evidence types)
- Create tasks from template for new periods

### Admin & Settings (`/settings`)

The Settings page is a tabbed interface with the following sections:

**Company tab:**
- Company name, school year, description (editable fields)
- Branding: primary color, secondary color, logo URL

**Departments tab:**
- List all departments with name, abbreviation, color swatch, sort order
- Add new department (name, abbreviation, color picker)
- Edit existing department (inline or modal)
- Reorder departments (up/down arrows)
- Delete department (with warning if tasks exist)

**Employees tab (new — core admin feature):**
- Table of all employees: name, email, department, role, avatar
- **Add employee** — form: full name, email, role (admin/department_lead/member/teacher), department assignment
- **Edit employee** — change name, email, role, department assignment
- **Remove employee** — with confirmation (unassigns from all tasks)
- **Department assignment** — dropdown to move employee between departments
- **Bulk department assignment** — select multiple employees, assign to department
- Store: `addProfile()`, `updateProfile()`, `deleteProfile()` mutations in taskStore

**Task Periods tab:**
- List all periods with name, date range, active indicator
- Create/edit/delete periods (moved from Phase 6 into Settings)

**Preferences tab:**
- Theme toggle (dark/light)
- Default view on load
- Items per page

---

## Dependencies to Install

| Phase | Packages |
|-------|----------|
| Router | `react-router-dom` |
| 1.3 | `@dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities` |
| 4 | `recharts` |
| 10.4 | `@react-pdf/renderer` or `jspdf` (TBD) |

**Already installed (no action needed):** `date-fns` (used heavily in Calendar phase), `lucide-react`, `@tiptap/*` packages.

---

## What's Explicitly Out of Scope

- Supabase / any backend integration
- Authentication / login / roles enforcement
- Real-time sync
- File uploads to cloud storage
- Email notifications
- AI features
- Google Drive integration
- QuickBooks integration
- Gantt chart view
- Time tracking
- Team chat
