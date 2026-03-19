# VE Task Manager — Implementation Plan

> **Created:** 2026-03-17
> **Current State:** Phase 1 foundation ~90% complete (core UI, task list, detail panel, checklist, filtering, dark theme all working with mock data)
> **Next Priority:** Complete remaining Phase 1 gaps, then Phase 2+

---

## Current State Summary

### What's Built & Working
- **App Shell & Layout** — Collapsible sidebar, top bar, responsive design
- **Department Navigation** — 7 departments + special sections (Inter-Dept, Trade Shows, Competitions)
- **Task List View** — Full filtering by status, priority, search; sorted display with all metadata
- **Task Detail Panel** — Right slide-over with metadata, description, assignees, checklist
- **Checklist & Evidence** — Evidence types (text, link, date, teacher observation), progress bar, completion toggle
- **Status Management** — Editable dropdowns on row and detail panel, updates Zustand store
- **Common Components** — StatusChip, PriorityBadge, AvatarGroup, ProgressBar
- **Dark Theme** — Custom design system with department colors, status colors, editorial aesthetic
- **Mock Data** — 23 tasks, 15 profiles, 50+ checklist items, 35 assignee mappings
- **State Management** — 3 Zustand stores (task, filter, ui) well-structured

### What's Missing or Incomplete
Listed below in implementation order.

---

## Phase 1 Completion: Foundation Gaps

### 1.1 — Task CRUD Operations
**Status:** Only read + status change exist. No create, edit, or delete.

- [ ] **Task Creation Modal** — Form with: title, task code, department, category, priority, due date, description, responsibility note, assignees
- [ ] **Task Edit Mode** — Make TaskDetail fields editable (title, description, due date, priority, category, responsibility note)
- [ ] **Task Delete** — Soft delete or hard delete with confirmation dialog
- [ ] **Task Code Auto-Generation** — When creating a task, suggest next code based on department + period (e.g., `AD 3.6` if `AD 3.5` exists)
- [ ] **Assignee Management** — Add/remove assignees from task detail panel, set primary assignee

### 1.2 — Checklist CRUD
**Status:** Can toggle completion, but cannot add, edit, delete, or reorder items.

- [ ] **Add Checklist Item** — Inline form at bottom of checklist: label, required evidence, evidence type
- [ ] **Edit Checklist Item** — Click to edit label, evidence requirement, evidence type
- [ ] **Delete Checklist Item** — Remove with confirmation
- [ ] **Reorder Checklist Items** — Drag handle or up/down arrows to change sort_order
- [ ] **Inline Evidence Editing** — Click evidence cell to enter/edit the actual evidence value (link, text, date)
- [ ] **Teacher Observation Stamp** — Button for teacher-role users to stamp date/time as evidence

### 1.3 — Board View (Kanban)
**Status:** Toggle exists in TopBar, viewMode state exists, but no board component.

- [ ] **Install @dnd-kit** — `@dnd-kit/core`, `@dnd-kit/sortable`, `@dnd-kit/utilities`
- [ ] **TaskBoard Component** — Kanban columns for each status (Not Started → In Progress → In Review → Completed → Carried Over)
- [ ] **TaskCard Component** — Compact card for board view (code, title, assignees, priority, checklist progress)
- [ ] **Drag-and-Drop Status Change** — Drag cards between columns to update status
- [ ] **Wire ViewMode Toggle** — Switch between TaskList and TaskBoard in MainContent

### 1.4 — Comments / Activity
**Status:** Type defined, no UI.

- [ ] **TaskComments Component** — Thread display in TaskDetail panel below checklist
- [ ] **Add Comment Form** — Text input with submit, shows user avatar + name
- [ ] **Comment Store** — Add comments array to taskStore, add/delete mutations
- [ ] **Mock Comment Data** — Seed a few comments on existing tasks

### 1.5 — Minor Fixes & Polish
- [ ] **Deduplicate searchQuery** — Remove from uiStore, use only filterStore.searchQuery
- [ ] **Assignee Filter** — TopBar has no assignee dropdown yet; add it using profiles list
- [ ] **Empty Board State** — Handle empty columns gracefully in board view
- [ ] **Loading Skeleton States** — Add shimmer/skeleton components for when data loads (prep for Supabase)

---

## Phase 2: Rich Text & Enhanced Editing -- COMPLETED 2026-03-17

### 2.1 — Rich Text Editor (Tiptap)
- [x] **Install Tiptap** — `@tiptap/react`, `@tiptap/starter-kit`, `@tiptap/extension-link`, `@tiptap/extension-placeholder`, `@tiptap/extension-underline`
- [x] **RichTextEditor Component** — Full toolbar (bold, italic, underline, strike, code, headings, lists, blockquote, links, divider, undo/redo)
- [x] **Integrate in TaskDetail** — Edit/View toggle with RichTextEditor and RichTextViewer
- [x] **Read-Only Mode** — RichTextViewer component renders Tiptap content without toolbar
- [x] **Store Integration** — `updateTaskDescription` mutation in taskStore
- [x] **Mock Data Upgraded** — 10 task descriptions converted to rich HTML (lists, headings, blockquotes, bold, links)
- [x] **Tiptap CSS** — Full styling for editor, viewer, placeholder, links, headings, lists, blockquotes, code
- [ ] **Integrate in Task Creation** — Use for description field in create modal (blocked by Phase 1.1)
- [ ] **Sanitize HTML** — Ensure stored HTML is safe (deferred to Phase 8 Supabase integration)

---

## Phase 3: Calendar & Events

### 3.1 — Calendar View
- [ ] **Calendar Grid Component** — Monthly view with day cells
- [ ] **Calendar Navigation** — Previous/next month, today button, month/year selector
- [ ] **Task Due Dates on Calendar** — Show task pills on their due dates with department color coding
- [ ] **Calendar Events** — Trade shows, competitions, no-school days, meetings as colored event pills
- [ ] **Event Creation Modal** — Create calendar events with type, dates, description, related task
- [ ] **Day Detail Popover** — Click a day to see all tasks/events in a popover or side panel
- [ ] **Click-Through to Task** — Click a task pill on calendar to open TaskDetail

### 3.2 — Calendar Event Store
- [ ] **Add calendarEvents to Store** — Array + CRUD operations
- [ ] **Mock Calendar Data** — Trade show dates, competition deadlines, school holidays
- [ ] **Event-Task Linking** — related_task_id field connecting events to tasks

---

## Phase 4: Dashboard & Analytics

### 4.1 — Dashboard View
- [ ] **Install Recharts** — `recharts`
- [ ] **DashboardView Component** — Replace current "all tasks" view with a proper dashboard
- [ ] **Department Progress Cards** — 7 cards showing completion % with progress rings/bars
- [ ] **Upcoming Deadlines Widget** — Next 7/14/30 day deadlines, sorted by urgency
- [ ] **Overdue Tasks Alert** — Red alert panel listing all overdue incomplete tasks
- [ ] **Task Status Distribution** — Pie or bar chart showing task count by status
- [ ] **Recent Activity Feed** — Latest status changes, checklist completions, comments

### 4.2 — Department-Level Stats
- [ ] **DepartmentProgress Component** — Detailed stats per department (total tasks, completed, in progress, overdue)
- [ ] **Checklist Completion Rate** — Per-department evidence tracking progress
- [ ] **Carried-Over Tasks Tracker** — Visual indicator of tasks rolled from previous periods
- [ ] **Completion Trends** — Line chart showing tasks completed over time (by week)

---

## Phase 5: Inter-Department & Cross-Functional

### 5.1 — Inter-Department Task View
- [ ] **Enhanced Inter-Department View** — Show all ID-coded tasks with department role assignments
- [ ] **Department Role Grid** — For each ID task, show which departments are involved and their specific roles
- [ ] **Task-Department Role Editing** — Add/edit department role assignments (e.g., "CO - Coordinate", "MK - Develop Plan")
- [ ] **Cross-Department Progress** — Show completion by department for shared tasks

### 5.2 — Trade Show Hub
- [ ] **Trade Show Hub Page** — Group all TS-coded tasks, show timeline of trade show dates
- [ ] **Trade Show Event Cards** — Date, location, tasks needed, readiness status
- [ ] **Pre-Show Checklist** — Aggregated checklist across all TS tasks

### 5.3 — Competition Hub
- [ ] **Competition Hub Page** — Group competition tasks with submission deadlines
- [ ] **Competition Cards** — Name, deadline, required deliverables, completion status
- [ ] **Submission Tracker** — What's submitted, what's pending, what's overdue

---

## Phase 6: Task Periods & Carry-Over

### 6.1 — Task Period Management
- [ ] **Task Period Selector** — Dropdown/tabs to switch between periods (e.g., Period 1, Period 2, Period 3)
- [ ] **Period CRUD** — Create new periods with name, start/end dates
- [ ] **Activate Period** — Set which period is currently active
- [ ] **Period-Filtered Views** — All views filter by active period

### 6.2 — Carry-Over System
- [ ] **End-of-Period Review** — View showing all incomplete tasks when a period ends
- [ ] **Bulk Carry-Over** — Select tasks to carry to next period, auto-set status to "carried_over"
- [ ] **Carried-Over Task Linking** — Link original task to new period's copy via carried_from_period
- [ ] **Carry-Over Badge** — Visual indicator showing which period a task was carried from

---

## Phase 7: Print Requests

### 7.1 — Print Request System
- [ ] **PrintRequestsView Component** — Table/list of all print requests with status tracking
- [ ] **Print Request Form** — Item name, PDF link, department, quantity, sided, paper type, notes
- [ ] **Status Workflow** — Pending → Approved → Printed → Delivered
- [ ] **Print Queue for Teachers** — Teacher view to approve/manage print requests
- [ ] **Print Request Store** — Zustand store with CRUD operations
- [ ] **Mock Print Request Data** — Seed data for development

---

## Phase 8: Supabase Integration

> **Note:** Per CLAUDE.md — Supabase is READ-ONLY by default. Do NOT run migrations or write to Supabase unless explicitly instructed.

### 8.1 — Client Setup
- [ ] **Install @supabase/supabase-js**
- [ ] **Create lib/supabase.ts** — Initialize client with env vars (VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY)
- [ ] **Environment Config** — .env.local template with Supabase credentials
- [ ] **Type Generation** — Generate TypeScript types from Supabase schema (or map existing types)

### 8.2 — Database Migration Scripts
- [ ] **Write SQL migrations** — All tables from CLAUDE.md schema (companies, departments, profiles, task_periods, tasks, task_assignees, task_departments, checklist_items, task_comments, calendar_events, print_requests)
- [ ] **Create indexes** — All indexes from CLAUDE.md
- [ ] **Seed data script** — Departments, initial task period, sample tasks matching mock data
- [ ] **Row Level Security policies** — Company-scoped, role-based (teacher > dept_lead > member)

### 8.3 — Data Hooks (Replace Mock Data)
- [ ] **useTasks Hook** — Fetch tasks with filters, create/update/delete tasks
- [ ] **useChecklist Hook** — Fetch/create/update/delete checklist items for a task
- [ ] **useCalendar Hook** — Fetch calendar events with date range filtering
- [ ] **useProfiles Hook** — Fetch profiles for the current company
- [ ] **usePrintRequests Hook** — Fetch/create/update print requests

### 8.4 — Realtime Subscriptions
- [ ] **useRealtime Hook** — Subscribe to task changes, checklist updates, comments
- [ ] **Optimistic Updates** — Update UI immediately, reconcile with server response
- [ ] **Conflict Resolution** — Handle concurrent edits gracefully
- [ ] **Connection Status Indicator** — Show online/offline/syncing status

### 8.5 — Transition from Mock to Live Data
- [ ] **Feature Flag** — Toggle between mock data and Supabase (for development flexibility)
- [ ] **Store Refactor** — Update Zustand stores to use Supabase hooks as data source
- [ ] **Error Handling** — Toast notifications for failed operations
- [ ] **Loading States** — Skeleton UI while data loads

---

## Phase 9: Authentication & Multi-User

### 9.1 — Auth Setup
- [ ] **Supabase Auth Config** — Enable email/password + Google OAuth in Supabase dashboard
- [ ] **Login Page** — Email/password form + Google sign-in button
- [ ] **Auth Store** — Current user, session, company context
- [ ] **Auth Guard** — Redirect unauthenticated users to login
- [ ] **Session Persistence** — Auto-refresh tokens, handle expiry

### 9.2 — Role-Based Access
- [ ] **Role Detection** — Read role from profiles table (admin, teacher, department_lead, member)
- [ ] **View Restrictions** — Department leads see their dept + shared; members see assigned + dept
- [ ] **Edit Restrictions** — Members can only edit tasks assigned to them
- [ ] **Teacher Powers** — Can see/edit everything, stamp teacher observations
- [ ] **Admin Powers** — Can manage periods, departments, users

### 9.3 — User Management
- [ ] **User Profile Page** — Edit name, avatar, department assignment
- [ ] **Company Invite System** — Invite new users by email, assign role + department
- [ ] **User List (Admin)** — View all users, change roles, reassign departments

---

## Phase 10: Polish & Advanced Features

### 10.1 — Search
- [ ] **Global Search** — Search across tasks, checklists, comments, calendar events
- [ ] **Search Results Page** — Grouped by type with click-through
- [ ] **Keyboard Shortcut** — Cmd/Ctrl+K to open search

### 10.2 — Keyboard Shortcuts
- [ ] **j/k Navigation** — Move up/down in task list
- [ ] **Enter** — Open selected task detail
- [ ] **Escape** — Close detail panel
- [ ] **s** — Quick status change cycle
- [ ] **n** — New task
- [ ] **?** — Show shortcuts help overlay

### 10.3 — Responsive / Mobile
- [ ] **Mobile Sidebar** — Hamburger menu with overlay sidebar
- [ ] **Mobile Task List** — Compact card layout for narrow screens
- [ ] **Mobile Task Detail** — Full-screen modal instead of slide-over
- [ ] **Touch-Friendly Controls** — Larger tap targets for checkboxes, dropdowns

### 10.4 — Export & Import
- [ ] **Export Department Log to PDF** — Generate PDF matching original doc format
- [ ] **Export Progress Report** — PDF with charts, completion stats
- [ ] **Import from CSV** — Upload CSV to bulk-create tasks
- [ ] **Import from Google Sheets** — Migration helper for existing VE task docs

### 10.5 — Task Templates
- [ ] **Template System** — Save task structures as templates (title, checklist items, evidence types)
- [ ] **Bulk Create from Template** — Apply template to create tasks for a new period
- [ ] **Department-Specific Templates** — Pre-built templates for common department tasks

### 10.6 — Notifications (In-App)
- [ ] **Notification Center** — Bell icon in TopBar with dropdown
- [ ] **Assignment Notifications** — When assigned to a task
- [ ] **Deadline Reminders** — Tasks due within 3 days
- [ ] **Status Change Alerts** — When a task you're assigned to changes status
- [ ] **Comment Mentions** — When mentioned in a comment

### 10.7 — Settings Page
- [ ] **Company Settings** — Name, school year, branding colors
- [ ] **Department Management** — Add/edit/reorder departments
- [ ] **Period Management** — Create/edit task periods (could also live here)
- [ ] **User Preferences** — Theme toggle (dark/light), default view, notification prefs

---

## Dependency Installation Roadmap

| Phase | Packages to Install |
|-------|-------------------|
| 1.3 | `@dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities` |
| 2.1 | `@tiptap/react @tiptap/starter-kit @tiptap/extension-link @tiptap/extension-placeholder` |
| 4.1 | `recharts` |
| 8.1 | `@supabase/supabase-js` |
| 10.4 | TBD — PDF library (e.g., `@react-pdf/renderer` or `jspdf`) |

React Router is **not currently needed** — the view-based navigation pattern works well for this app's complexity. Can revisit if URL-based routing becomes necessary.

---

## Recommended Build Order

**Immediate (get the app fully usable with mock data):**
1. Phase 1.1 — Task CRUD (create/edit/delete)
2. Phase 1.2 — Checklist CRUD (add/edit/reorder/evidence editing)
3. Phase 1.3 — Board View (Kanban with drag-and-drop)
4. Phase 1.4 — Comments
5. Phase 1.5 — Polish fixes

**Short-term (complete feature set):**
6. Phase 2 — Rich Text (Tiptap)
7. Phase 3 — Calendar
8. Phase 4 — Dashboard & Analytics
9. Phase 5 — Inter-Dept & Cross-Functional hubs
10. Phase 6 — Task Periods & Carry-Over
11. Phase 7 — Print Requests

**Backend integration (make it real):**
12. Phase 8 — Supabase Integration
13. Phase 9 — Authentication & Roles

**Final polish:**
14. Phase 10 — Search, keyboard shortcuts, export, templates, notifications, settings
