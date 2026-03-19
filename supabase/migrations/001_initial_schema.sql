-- VE Task Manager — Initial Schema
-- Run this in Supabase SQL Editor to create all tables

-- Companies (multi-tenant support)
CREATE TABLE companies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  school_year text,
  description text,
  branding jsonb,
  created_at timestamptz DEFAULT now()
);

-- Departments
CREATE TABLE departments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  name text NOT NULL,
  abbreviation text NOT NULL,
  color text,
  sort_order int DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Profiles (users/employees)
CREATE TABLE profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  department_id uuid REFERENCES departments(id) ON DELETE SET NULL,
  full_name text NOT NULL,
  email text,
  role text DEFAULT 'member' CHECK (role IN ('admin', 'department_lead', 'member', 'teacher')),
  avatar_url text,
  created_at timestamptz DEFAULT now()
);

-- Task Periods
CREATE TABLE task_periods (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  name text NOT NULL,
  start_date date,
  end_date date,
  is_active boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Tasks
CREATE TABLE tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  task_period_id uuid REFERENCES task_periods(id) ON DELETE SET NULL,
  department_id uuid REFERENCES departments(id) ON DELETE SET NULL,
  task_code text NOT NULL,
  title text NOT NULL,
  description text,
  category text NOT NULL DEFAULT 'department' CHECK (category IN ('department', 'inter_department', 'trade_show', 'competition')),
  priority text DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'critical')),
  status text DEFAULT 'not_started' CHECK (status IN ('not_started', 'in_progress', 'in_review', 'completed', 'carried_over')),
  due_date date,
  planned_completion date,
  actual_completion timestamptz,
  responsibility_note text,
  hub_path text,
  is_optional boolean DEFAULT false,
  is_high_priority boolean DEFAULT false,
  carried_from_period uuid REFERENCES task_periods(id),
  sort_order int DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Task Assignees (many-to-many)
CREATE TABLE task_assignees (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id uuid NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  profile_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  is_primary boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  UNIQUE(task_id, profile_id)
);

-- Task Department Links (for inter-department tasks)
CREATE TABLE task_departments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id uuid NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  department_id uuid NOT NULL REFERENCES departments(id) ON DELETE CASCADE,
  role_description text,
  created_at timestamptz DEFAULT now(),
  UNIQUE(task_id, department_id)
);

-- Checklist Items
CREATE TABLE checklist_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id uuid NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  label text NOT NULL,
  required_evidence text,
  evidence_value text,
  evidence_type text DEFAULT 'text' CHECK (evidence_type IN ('text', 'link', 'date', 'teacher_observation', 'file')),
  planned_completion date,
  actual_completion timestamptz,
  is_completed boolean DEFAULT false,
  completed_by uuid REFERENCES profiles(id),
  sort_order int DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Comments / Activity Log
CREATE TABLE task_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id uuid NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  profile_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Calendar Events
CREATE TABLE calendar_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  event_type text CHECK (event_type IN ('trade_show', 'competition', 'deadline', 'meeting', 'no_school')),
  start_date date NOT NULL,
  end_date date,
  related_task_id uuid REFERENCES tasks(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now()
);

-- Print Requests
CREATE TABLE print_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  item_name text NOT NULL,
  link_to_pdf text,
  requested_by uuid REFERENCES profiles(id),
  department_id uuid REFERENCES departments(id),
  quantity int,
  sided text CHECK (sided IN ('single', 'double')),
  paper_type text CHECK (paper_type IN ('plain', 'cardstock', 'sticker', 'other')),
  notes text,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'printed', 'delivered')),
  created_at timestamptz DEFAULT now()
);

-- ─── Indexes ────────────────────────────────────────────────────────────────

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
CREATE INDEX idx_departments_company ON departments(company_id);
CREATE INDEX idx_profiles_company ON profiles(company_id);
CREATE INDEX idx_profiles_department ON profiles(department_id);
CREATE INDEX idx_task_comments_task ON task_comments(task_id);
CREATE INDEX idx_print_requests_company ON print_requests(company_id);

-- ─── Row Level Security ─────────────────────────────────────────────────────

ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_periods ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_assignees ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE checklist_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE calendar_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE print_requests ENABLE ROW LEVEL SECURITY;

-- For development: allow all access for authenticated AND anonymous users
-- Replace these with proper company-scoped policies for production
CREATE POLICY "Allow all for authenticated" ON companies FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for authenticated" ON departments FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for authenticated" ON profiles FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for authenticated" ON task_periods FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for authenticated" ON tasks FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for authenticated" ON task_assignees FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for authenticated" ON task_departments FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for authenticated" ON checklist_items FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for authenticated" ON task_comments FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for authenticated" ON calendar_events FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for authenticated" ON print_requests FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Anonymous access (anon key, no auth required — development only)
CREATE POLICY "Allow all for anon" ON companies FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for anon" ON departments FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for anon" ON profiles FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for anon" ON task_periods FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for anon" ON tasks FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for anon" ON task_assignees FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for anon" ON task_departments FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for anon" ON checklist_items FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for anon" ON task_comments FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for anon" ON calendar_events FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for anon" ON print_requests FOR ALL TO anon USING (true) WITH CHECK (true);

-- ─── Auto-update updated_at trigger ─────────────────────────────────────────

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tasks_updated_at
  BEFORE UPDATE ON tasks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ─── Seed Data: Siply Company ───────────────────────────────────────────────

INSERT INTO companies (id, name, school_year, description) VALUES
  ('00000000-0000-0000-0000-000000000001', 'Siply', '2025-26', 'VE hydration ecosystem company (S-Corp, Tustin CA)');

INSERT INTO departments (id, company_id, name, abbreviation, color, sort_order) VALUES
  ('00000000-0000-0000-0001-000000000001', '00000000-0000-0000-0000-000000000001', 'Administration', 'AD', '#4F46E5', 0),
  ('00000000-0000-0000-0001-000000000002', '00000000-0000-0000-0000-000000000001', 'Accounting & Finance', 'AF', '#059669', 1),
  ('00000000-0000-0000-0001-000000000003', '00000000-0000-0000-0000-000000000001', 'Branding & Design', 'BD', '#D97706', 2),
  ('00000000-0000-0000-0001-000000000004', '00000000-0000-0000-0000-000000000001', 'Digital Operations', 'DO', '#7C3AED', 3),
  ('00000000-0000-0000-0001-000000000005', '00000000-0000-0000-0000-000000000001', 'Human Resources', 'HR', '#DC2626', 4),
  ('00000000-0000-0000-0001-000000000006', '00000000-0000-0000-0000-000000000001', 'Marketing', 'MK', '#2563EB', 5),
  ('00000000-0000-0000-0001-000000000007', '00000000-0000-0000-0000-000000000001', 'Sales & Product Development', 'SP', '#0891B2', 6);

INSERT INTO task_periods (id, company_id, name, start_date, end_date, is_active) VALUES
  ('00000000-0000-0000-0002-000000000001', '00000000-0000-0000-0000-000000000001', 'Period 1 (Sep/Oct)', '2025-09-02', '2025-10-31', false),
  ('00000000-0000-0000-0002-000000000002', '00000000-0000-0000-0000-000000000001', 'Period 2 (Nov/Dec)', '2025-11-03', '2025-12-19', false),
  ('00000000-0000-0000-0002-000000000003', '00000000-0000-0000-0000-000000000001', 'Period 3 (Jan/Feb)', '2026-01-06', '2026-02-27', true);

INSERT INTO profiles (id, company_id, department_id, full_name, email, role) VALUES
  ('00000000-0000-0000-0003-000000000001', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0001-000000000001', 'Maya Chen', 'maya@siply.ve', 'department_lead'),
  ('00000000-0000-0000-0003-000000000002', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0001-000000000001', 'Jordan Rivera', 'jordan@siply.ve', 'member'),
  ('00000000-0000-0000-0003-000000000003', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0001-000000000002', 'Alex Kim', 'alex@siply.ve', 'department_lead'),
  ('00000000-0000-0000-0003-000000000004', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0001-000000000002', 'Priya Patel', 'priya@siply.ve', 'member'),
  ('00000000-0000-0000-0003-000000000005', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0001-000000000003', 'Sam Torres', 'sam@siply.ve', 'department_lead'),
  ('00000000-0000-0000-0003-000000000006', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0001-000000000003', 'Riley Brooks', 'riley@siply.ve', 'member'),
  ('00000000-0000-0000-0003-000000000007', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0001-000000000004', 'Taylor Nguyen', 'taylor@siply.ve', 'department_lead'),
  ('00000000-0000-0000-0003-000000000008', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0001-000000000004', 'Casey Johnson', 'casey@siply.ve', 'member'),
  ('00000000-0000-0000-0003-000000000009', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0001-000000000005', 'Morgan Lee', 'morgan@siply.ve', 'department_lead'),
  ('00000000-0000-0000-0003-000000000010', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0001-000000000005', 'Jamie Garcia', 'jamie@siply.ve', 'member'),
  ('00000000-0000-0000-0003-000000000011', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0001-000000000006', 'Drew Martinez', 'drew@siply.ve', 'department_lead'),
  ('00000000-0000-0000-0003-000000000012', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0001-000000000006', 'Avery Singh', 'avery@siply.ve', 'member'),
  ('00000000-0000-0000-0003-000000000013', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0001-000000000007', 'Quinn Wright', 'quinn@siply.ve', 'department_lead'),
  ('00000000-0000-0000-0003-000000000014', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0001-000000000007', 'Blake Foster', 'blake@siply.ve', 'member'),
  ('00000000-0000-0000-0003-000000000015', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0001-000000000001', 'Ms. Thompson', 'thompson@tustin.k12.ca.us', 'teacher');
