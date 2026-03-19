# VE Task Manager — Claude Code Project Prompt

## Project Overview

Build **VE Task Manager**, a web-based task management system designed specifically for Virtual Enterprise (VE) high school business simulation companies. This replaces a Google Docs-based task tracking system with a purpose-built app that mirrors how VE companies organize work: by **department**, with **inter-department tasks**, **trade shows**, **competitions**, and **checklist-based evidence tracking**.

The primary user is **Siply**, a VE hydration ecosystem company (S-Corp, Tustin CA) with ~30 employees across 7 departments, but the system should work for any VE company.

---

## Tech Stack

- **Frontend:** React 18 + Vite + TypeScript + Tailwind CSS
- **State Management:** Zustand
- **Backend/DB:** Supabase (PostgreSQL + Auth + Row Level Security + Realtime)
- **Rich Text:** Tiptap (for task descriptions and notes)
- **Drag & Drop:** @dnd-kit/core
- **Date Handling:** date-fns
- **Icons:** Lucide React
- **Charts (later):** Recharts

---

## Database Design (Supabase)

### Core Tables

```sql
-- Companies (multi-tenant support)
companies (
  id uuid PK DEFAULT gen_random_uuid(),
  name text NOT NULL,              -- "Siply"
  school_year text,                -- "2025-26"
  description text,
  branding jsonb,                  -- {primary_color, secondary_color, logo_url}
  created_at timestamptz DEFAULT now()
)

-- Departments
departments (
  id uuid PK DEFAULT gen_random_uuid(),
  company_id uuid FK -> companies.id,
  name text NOT NULL,              -- "Administration"
  abbreviation text NOT NULL,      -- "AD"
  color text,                      -- hex color for visual coding
  sort_order int DEFAULT 0,
  created_at timestamptz DEFAULT now()
)

-- Users / Employees
profiles (
  id uuid PK FK -> auth.users.id,
  company_id uuid FK -> companies.id,
  department_id uuid FK -> departments.id,
  full_name text NOT NULL,
  email text,
  role text DEFAULT 'member',      -- 'admin' | 'department_lead' | 'member' | 'teacher'
  avatar_url text,
  created_at timestamptz DEFAULT now()
)

-- Task Periods (equivalent to month/task-period blocks like "Jan/Feb Tasks 25-26")
task_periods (
  id uuid PK DEFAULT gen_random_uuid(),
  company_id uuid FK -> companies.id,
  name text NOT NULL,              -- "Period 3 (Jan/Feb)"
  start_date date,
  end_date date,
  is_active boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
)

-- Tasks (the core unit)
tasks (
  id uuid PK DEFAULT gen_random_uuid(),
  company_id uuid FK -> companies.id,
  task_period_id uuid FK -> task_periods.id,
  department_id uuid FK -> departments.id NULL,  -- NULL for inter-department tasks
  
  -- Identity
  task_code text NOT NULL,          -- "AD 3.1", "ID 3.2", "TS 3.3", "AF 3.5"
  title text NOT NULL,              -- "Department Meeting and Task Assignment"
  description text,                 -- Rich text (Tiptap HTML)
  
  -- Classification
  category text NOT NULL DEFAULT 'department',  
  -- 'department' | 'inter_department' | 'trade_show' | 'competition'
  
  priority text DEFAULT 'normal',   -- 'low' | 'normal' | 'high' | 'critical'
  status text DEFAULT 'not_started', 
  -- 'not_started' | 'in_progress' | 'in_review' | 'completed' | 'carried_over'
  
  -- Dates
  due_date date,
  planned_completion date,
  actual_completion timestamptz,
  
  -- Responsibility
  responsibility_note text,         -- "All Team Members", "Both Chief Officers", etc.
  
  -- Metadata
  hub_path text,                    -- "Curriculum / Finance / Task 5 / ..."
  is_optional boolean DEFAULT false,
  is_high_priority boolean DEFAULT false,  -- maps to **HIGH PRIORITY** flags in doc
  carried_from_period uuid FK -> task_periods.id NULL,
  
  sort_order int DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
)

-- Task Assignees (many-to-many: tasks can have multiple assignees)
task_assignees (
  id uuid PK DEFAULT gen_random_uuid(),
  task_id uuid FK -> tasks.id ON DELETE CASCADE,
  profile_id uuid FK -> profiles.id,
  is_primary boolean DEFAULT false,  -- primary responsibility vs helper
  created_at timestamptz DEFAULT now(),
  UNIQUE(task_id, profile_id)
)

-- Task Department Links (for inter-department tasks touching multiple depts)
task_departments (
  id uuid PK DEFAULT gen_random_uuid(),
  task_id uuid FK -> tasks.id ON DELETE CASCADE,
  department_id uuid FK -> departments.id,
  role_description text,            -- "CO- Coordinate", "Marketing- Develop Year Long Plan"
  created_at timestamptz DEFAULT now(),
  UNIQUE(task_id, department_id)
)

-- Checklist Items (the evidence/completion tracking rows)
checklist_items (
  id uuid PK DEFAULT gen_random_uuid(),
  task_id uuid FK -> tasks.id ON DELETE CASCADE,
  
  label text NOT NULL,              -- "Business Plan Presentation Outline"
  required_evidence text,           -- "Doc Linked and saved in Drive"
  evidence_value text,              -- actual link, date, or note entered
  evidence_type text DEFAULT 'text', -- 'text' | 'link' | 'date' | 'teacher_observation' | 'file'
  
  planned_completion date,
  actual_completion timestamptz,
  is_completed boolean DEFAULT false,
  completed_by uuid FK -> profiles.id NULL,
  
  sort_order int DEFAULT 0,
  created_at timestamptz DEFAULT now()
)

-- Comments / Activity Log
task_comments (
  id uuid PK DEFAULT gen_random_uuid(),
  task_id uuid FK -> tasks.id ON DELETE CASCADE,
  profile_id uuid FK -> profiles.id,
  content text NOT NULL,
  created_at timestamptz DEFAULT now()
)

-- Calendar Events (trade shows, competitions, meetings, deadlines)
calendar_events (
  id uuid PK DEFAULT gen_random_uuid(),
  company_id uuid FK -> companies.id,
  title text NOT NULL,
  description text,
  event_type text,                  -- 'trade_show' | 'competition' | 'deadline' | 'meeting' | 'no_school'
  start_date date NOT NULL,
  end_date date,
  related_task_id uuid FK -> tasks.id NULL,
  created_at timestamptz DEFAULT now()
)

-- Print Requests (dedicated tracking like in the original doc)
print_requests (
  id uuid PK DEFAULT gen_random_uuid(),
  company_id uuid FK -> companies.id,
  item_name text NOT NULL,
  link_to_pdf text,
  requested_by uuid FK -> profiles.id,
  department_id uuid FK -> departments.id,
  quantity int,
  sided text,                       -- 'single' | 'double'
  paper_type text,                  -- 'plain' | 'cardstock' | 'sticker' | 'other'
  notes text,
  status text DEFAULT 'pending',    -- 'pending' | 'approved' | 'printed' | 'delivered'
  created_at timestamptz DEFAULT now()
)
```

### Indexes to Create
```sql
CREATE INDEX idx_tasks_company ON tasks(company_id);
CREATE INDEX idx_tasks_department ON tasks(department_id);
CREATE INDEX idx_tasks_period ON tasks(task_period_id);
CREATE INDEX idx_tasks_category ON tasks(category);
CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_tasks_due_date ON tasks(due_date);
CREATE INDEX idx_checklist_task ON checklist_items(task_id);
CREATE INDEX idx_task_assignees_task ON task_assignees(task_id);
CREATE INDEX idx_task_assignees_profile ON task_assignees(profile_id);
CREATE INDEX idx_calendar_company_date ON calendar_events(company_id, start_date);
```

### Row Level Security
- All tables filtered by `company_id`
- Teachers can see/edit everything in their company
- Department leads can edit their department tasks + view all
- Members can edit assigned tasks + view department tasks
- Inter-department tasks visible to all involved departments

---

## Application Structure

```
src/
├── components/
│   ├── layout/
│   │   ├── AppShell.tsx            # Main layout with sidebar + content
│   │   ├── Sidebar.tsx             # Navigation sidebar
│   │   └── TopBar.tsx              # Breadcrumbs, search, user menu
│   ├── tasks/
│   │   ├── TaskBoard.tsx           # Kanban board view (drag & drop)
│   │   ├── TaskList.tsx            # List/table view
│   │   ├── TaskCard.tsx            # Card component for board view
│   │   ├── TaskRow.tsx             # Row component for list view
│   │   ├── TaskDetail.tsx          # Full task detail panel/modal
│   │   ├── TaskChecklist.tsx       # Checklist with evidence tracking
│   │   ├── TaskComments.tsx        # Comment thread on task
│   │   ├── TaskFilters.tsx         # Filter bar (dept, status, priority, assignee)
│   │   └── TaskManagementLog.tsx   # Department task log view (mirrors the doc format)
│   ├── calendar/
│   │   ├── CalendarView.tsx        # Monthly calendar with events + deadlines
│   │   └── CalendarEvent.tsx       # Event card/popup
│   ├── dashboard/
│   │   ├── DashboardView.tsx       # Company-wide overview
│   │   ├── DepartmentProgress.tsx  # Per-department completion stats
│   │   └── UpcomingDeadlines.tsx   # Deadline ticker
│   ├── departments/
│   │   ├── DepartmentView.tsx      # Single department workspace
│   │   └── DepartmentSelector.tsx  # Department switcher
│   ├── print/
│   │   └── PrintRequestsView.tsx   # Print request tracker
│   └── common/
│       ├── Badge.tsx
│       ├── Avatar.tsx
│       ├── Modal.tsx
│       ├── RichTextEditor.tsx      # Tiptap wrapper
│       └── DatePicker.tsx
├── stores/
│   ├── taskStore.ts                # Zustand store for tasks
│   ├── filterStore.ts              # Active filters state
│   ├── uiStore.ts                  # Sidebar, modals, active view
│   └── authStore.ts                # Current user + company
├── hooks/
│   ├── useTasks.ts                 # Supabase queries for tasks
│   ├── useChecklist.ts             # Checklist CRUD
│   ├── useRealtime.ts              # Supabase realtime subscriptions
│   └── useCalendar.ts              # Calendar data
├── lib/
│   ├── supabase.ts                 # Supabase client init
│   ├── types.ts                    # TypeScript interfaces matching DB schema
│   └── constants.ts                # Status options, categories, dept colors
├── pages/
│   ├── Dashboard.tsx
│   ├── Department.tsx              # /department/:abbr
│   ├── InterDepartment.tsx         # /inter-department
│   ├── TradeShows.tsx              # /trade-shows
│   ├── Competitions.tsx            # /competitions
│   ├── Calendar.tsx                # /calendar
│   ├── PrintRequests.tsx           # /print-requests
│   └── Settings.tsx                # /settings
└── App.tsx                         # Router + providers
```

---

## Build Phases

### Phase 1: Foundation (Build First)
**Goal: Core data model, layout shell, basic task CRUD**

1. Initialize Vite + React + TypeScript + Tailwind project
2. Set up Supabase client and types
3. Create the AppShell layout with sidebar navigation
4. Build the department navigation (7 departments + ID + TS + Competitions)
5. Implement basic task list view with sorting
6. Task creation modal with all core fields
7. Task detail panel with description editing
8. Basic status management (not_started → in_progress → completed)

### Phase 2: Checklist & Evidence System
**Goal: The core differentiator — checklist items with evidence tracking**

1. Checklist component with add/edit/delete/reorder
2. Evidence type handling (text, link, date, teacher observation, file)
3. Planned vs actual completion dates per checklist item
4. Visual progress indicator (X of Y items complete)
5. "Mark as teacher observed" quick action
6. Bulk checklist operations

### Phase 3: Views & Filtering
**Goal: Multiple ways to see the same data**

1. Kanban board view with drag-and-drop status changes
2. List/table view with sortable columns
3. Task Management Log view (matches the original doc format per department)
4. Filter system: by department, status, priority, assignee, category, date range
5. Saved filter presets ("My Tasks", "High Priority", "Overdue", "This Department")
6. Group-by options (status, department, assignee, priority)

### Phase 4: Calendar & Events
**Goal: Unified calendar showing deadlines, events, trade shows**

1. Monthly calendar grid view
2. Calendar events (trade shows, competitions, no-school days, meetings)
3. Task due dates displayed on calendar
4. Week-by-week view matching the original doc's calendar format
5. Click-through from calendar event to related task

### Phase 5: Dashboard & Progress Tracking
**Goal: Company-wide and per-department visibility**

1. Company dashboard with department completion percentages
2. Per-department progress bars and stats
3. Upcoming deadlines widget (next 7/14/30 days)
4. Overdue tasks alert panel
5. Task completion trends over time (Recharts)
6. "Carried Over" tasks tracker (tasks not finished in previous period)

### Phase 6: Inter-Department & Cross-Functional
**Goal: Tasks that span departments with role assignments**

1. Inter-department task view showing all ID-coded tasks
2. Department role assignments per task (e.g., "CO- Coordinate", "MK- Develop Plan")
3. Trade show hub page grouping all TS-coded tasks
4. Competition hub page with submission deadlines and status
5. Cross-department task dependencies (visual indicators)

### Phase 7: Authentication & Multi-User
**Goal: Supabase Auth with role-based access**

1. Supabase Auth setup (email/password, Google OAuth)
2. Role-based views (teacher sees everything, dept leads see their dept + shared)
3. Row Level Security policies
4. User profile management
5. Assignment notifications (in-app)

### Phase 8: Print Requests & Utilities
**Goal: Supporting features from the original system**

1. Print request submission form
2. Print request queue with status tracking
3. Task period management (create, activate, carry over incomplete tasks)
4. Task templates for recurring department tasks
5. Bulk task creation from templates

### Phase 9: Polish & Advanced Features
**Goal: Production-ready refinements**

1. Search across all tasks, checklists, and comments
2. Keyboard shortcuts (j/k navigation, quick status change)
3. Dark mode
4. Mobile-responsive layout
5. Export to PDF (department task logs, progress reports)
6. Import from CSV/Google Sheets (migration helper)

---

## Department Configuration (Seed Data)

```typescript
const DEPARTMENTS = [
  { name: 'Administration', abbreviation: 'AD', color: '#4F46E5' },
  { name: 'Accounting & Finance', abbreviation: 'AF', color: '#059669' },
  { name: 'Branding & Design', abbreviation: 'BD', color: '#D97706' },
  { name: 'Digital Operations', abbreviation: 'DO', color: '#7C3AED' },
  { name: 'Human Resources', abbreviation: 'HR', color: '#DC2626' },
  { name: 'Marketing', abbreviation: 'MK', color: '#2563EB' },
  { name: 'Sales & Product Development', abbreviation: 'SP', color: '#0891B2' },
];

const TASK_CATEGORIES = [
  { value: 'department', label: 'Department Task' },
  { value: 'inter_department', label: 'Inter-Department (ID)' },
  { value: 'trade_show', label: 'Trade Show (TS)' },
  { value: 'competition', label: 'Competition' },
];

const TASK_STATUSES = [
  { value: 'not_started', label: 'Not Started', color: '#9CA3AF' },
  { value: 'in_progress', label: 'In Progress', color: '#3B82F6' },
  { value: 'in_review', label: 'In Review', color: '#F59E0B' },
  { value: 'completed', label: 'Completed', color: '#10B981' },
  { value: 'carried_over', label: 'Carried Over', color: '#EF4444' },
];

const EVIDENCE_TYPES = [
  { value: 'text', label: 'Text Note' },
  { value: 'link', label: 'Google Drive Link' },
  { value: 'date', label: 'Date & Time Record' },
  { value: 'teacher_observation', label: 'Teacher Observation' },
  { value: 'file', label: 'File Upload' },
];
```

---

## UI/UX Design Direction

### Aesthetic
- **Clean, functional, slightly bold.** Think Linear meets Notion — not Trello's toy-like aesthetic.
- Sidebar navigation with department color indicators
- Card-based task views with clear status chips and priority badges
- Checklist items rendered as a clean table with status toggles
- Calendar uses a muted grid with color-coded event pills

### Key UX Patterns
- **Department-first navigation:** Sidebar lists all departments. Clicking one shows only that department's tasks.
- **Quick filters bar** at the top of every view: Status | Priority | Assignee | Date Range
- **Task detail as slide-over panel** (not a full page) so context isn't lost
- **Checklist evidence inline editing** — click to add evidence directly in the checklist row
- **Drag-and-drop** for status changes in board view and checklist reordering
- **Color-coded department badges** on every task card for instant visual parsing
- **Progress rings** on department cards showing % complete

### Typography & Colors
- Use a clean sans-serif (Geist or similar)
- Department colors as accents, neutral grays for chrome
- Status colors: gray (not started), blue (in progress), amber (review), green (done), red (carried over)

---

## Important Implementation Notes

1. **Supabase is READ-ONLY by default.** Do NOT run migrations, write, update, or delete unless I explicitly say "run this migration" or "write to Supabase" in the conversation. Build the frontend with mock data first, then wire up Supabase when I'm ready.

2. **Task codes follow a strict pattern:** `{DEPT_ABBR} {PERIOD}.{SEQUENCE}` — e.g., `AD 3.1`, `AF 3.5`, `ID 3.2`, `TS 3.3`. The period number corresponds to the task period. This is a core identifier and should be prominent in the UI.

3. **Checklist items are NOT subtasks.** They are evidence/completion tracking rows with specific evidence requirements. Each row has: label, required evidence description, actual evidence value, planned completion, and actual completion. This is the most important feature of the app.

4. **"Carried Over" is a first-class status.** When a task period ends, incomplete tasks should be easy to mark as carried over and linked to the new period. The original docs explicitly call this out.

5. **Inter-department tasks have department role assignments.** For example, ID 3.6 (Hub Advertising) assigns different responsibilities to CO, Marketing, Accounting, Branding, Sales, and IT. Model this with the `task_departments` junction table.

6. **Teacher observations are a specific evidence type.** Many checklist items require "Teacher Observation — Record the date and time." This needs its own UI treatment (maybe a stamp/badge that a teacher-role user can apply).

7. **The app should feel fast.** Use optimistic updates, Supabase realtime for multi-user sync, and keep the bundle lean.

8. **Mobile-first is secondary.** This will primarily be used on school Chromebooks and laptops. Desktop-first design, but should be usable on tablet.

---

## What NOT to Build Yet (Future Phases — I'll Prompt These Later)

- File upload to Supabase Storage (Phase 8+)
- Email notifications (Phase 9+)
- AI-powered task suggestions or auto-assignment
- Google Drive integration for evidence links
- QuickBooks/financial system integration
- VE Hub API integration
- Team chat / real-time messaging
- Time tracking
- Gantt chart view
- Permission management UI (hard-code roles initially)
- Onboarding wizard for new companies
