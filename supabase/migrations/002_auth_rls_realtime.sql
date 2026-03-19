-- VE Task Manager — Production RLS Policies & Realtime
-- Replaces dev-mode "allow all" policies with proper company-scoped, role-based access

-- ─── Helper Functions ─────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.user_company_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT company_id FROM profiles WHERE id = auth.uid()
$$;

CREATE OR REPLACE FUNCTION public.user_role()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM profiles WHERE id = auth.uid()
$$;

CREATE OR REPLACE FUNCTION public.user_department_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT department_id FROM profiles WHERE id = auth.uid()
$$;

-- ─── Drop All Existing Dev Policies ──────────────────────────────────────────

DROP POLICY IF EXISTS "Allow all for authenticated" ON companies;
DROP POLICY IF EXISTS "Allow all for authenticated" ON departments;
DROP POLICY IF EXISTS "Allow all for authenticated" ON profiles;
DROP POLICY IF EXISTS "Allow all for authenticated" ON task_periods;
DROP POLICY IF EXISTS "Allow all for authenticated" ON tasks;
DROP POLICY IF EXISTS "Allow all for authenticated" ON task_assignees;
DROP POLICY IF EXISTS "Allow all for authenticated" ON task_departments;
DROP POLICY IF EXISTS "Allow all for authenticated" ON checklist_items;
DROP POLICY IF EXISTS "Allow all for authenticated" ON task_comments;
DROP POLICY IF EXISTS "Allow all for authenticated" ON calendar_events;
DROP POLICY IF EXISTS "Allow all for authenticated" ON print_requests;

DROP POLICY IF EXISTS "Allow all for anon" ON companies;
DROP POLICY IF EXISTS "Allow all for anon" ON departments;
DROP POLICY IF EXISTS "Allow all for anon" ON profiles;
DROP POLICY IF EXISTS "Allow all for anon" ON task_periods;
DROP POLICY IF EXISTS "Allow all for anon" ON tasks;
DROP POLICY IF EXISTS "Allow all for anon" ON task_assignees;
DROP POLICY IF EXISTS "Allow all for anon" ON task_departments;
DROP POLICY IF EXISTS "Allow all for anon" ON checklist_items;
DROP POLICY IF EXISTS "Allow all for anon" ON task_comments;
DROP POLICY IF EXISTS "Allow all for anon" ON calendar_events;
DROP POLICY IF EXISTS "Allow all for anon" ON print_requests;

-- ─── Companies ───────────────────────────────────────────────────────────────

CREATE POLICY "companies_select_own"
  ON companies FOR SELECT TO authenticated
  USING (id = public.user_company_id());

-- ─── Departments ─────────────────────────────────────────────────────────────

CREATE POLICY "departments_select_own_company"
  ON departments FOR SELECT TO authenticated
  USING (company_id = public.user_company_id());

-- ─── Profiles ────────────────────────────────────────────────────────────────

CREATE POLICY "profiles_select_own_company"
  ON profiles FOR SELECT TO authenticated
  USING (company_id = public.user_company_id());

CREATE POLICY "profiles_update_own"
  ON profiles FOR UPDATE TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

CREATE POLICY "profiles_insert_teacher_admin"
  ON profiles FOR INSERT TO authenticated
  WITH CHECK (public.user_role() IN ('teacher', 'admin'));

CREATE POLICY "profiles_delete_teacher_admin"
  ON profiles FOR DELETE TO authenticated
  USING (public.user_role() IN ('teacher', 'admin'));

-- ─── Task Periods ────────────────────────────────────────────────────────────

CREATE POLICY "task_periods_select_own_company"
  ON task_periods FOR SELECT TO authenticated
  USING (company_id = public.user_company_id());

CREATE POLICY "task_periods_insert_teacher_admin"
  ON task_periods FOR INSERT TO authenticated
  WITH CHECK (public.user_role() IN ('teacher', 'admin'));

CREATE POLICY "task_periods_update_teacher_admin"
  ON task_periods FOR UPDATE TO authenticated
  USING (public.user_role() IN ('teacher', 'admin'))
  WITH CHECK (public.user_role() IN ('teacher', 'admin'));

CREATE POLICY "task_periods_delete_teacher_admin"
  ON task_periods FOR DELETE TO authenticated
  USING (public.user_role() IN ('teacher', 'admin'));

-- ─── Tasks ───────────────────────────────────────────────────────────────────

CREATE POLICY "tasks_select_own_company"
  ON tasks FOR SELECT TO authenticated
  USING (company_id = public.user_company_id());

CREATE POLICY "tasks_insert"
  ON tasks FOR INSERT TO authenticated
  WITH CHECK (
    company_id = public.user_company_id()
    AND (
      public.user_role() IN ('teacher', 'admin')
      OR (
        public.user_role() = 'department_lead'
        AND (department_id = public.user_department_id() OR department_id IS NULL)
      )
    )
  );

CREATE POLICY "tasks_update"
  ON tasks FOR UPDATE TO authenticated
  USING (
    company_id = public.user_company_id()
    AND (
      public.user_role() IN ('teacher', 'admin')
      OR (
        public.user_role() = 'department_lead'
        AND (department_id = public.user_department_id() OR department_id IS NULL)
      )
      OR (
        public.user_role() = 'member'
        AND EXISTS (
          SELECT 1 FROM task_assignees
          WHERE task_assignees.task_id = tasks.id
            AND task_assignees.profile_id = auth.uid()
        )
      )
    )
  )
  WITH CHECK (company_id = public.user_company_id());

CREATE POLICY "tasks_delete"
  ON tasks FOR DELETE TO authenticated
  USING (
    company_id = public.user_company_id()
    AND (
      public.user_role() IN ('teacher', 'admin')
      OR (
        public.user_role() = 'department_lead'
        AND (department_id = public.user_department_id() OR department_id IS NULL)
      )
    )
  );

-- ─── Checklist Items ─────────────────────────────────────────────────────────

CREATE POLICY "checklist_items_select"
  ON checklist_items FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM tasks
      WHERE tasks.id = checklist_items.task_id
        AND tasks.company_id = public.user_company_id()
    )
  );

CREATE POLICY "checklist_items_insert"
  ON checklist_items FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM tasks
      WHERE tasks.id = checklist_items.task_id
        AND tasks.company_id = public.user_company_id()
        AND (
          public.user_role() IN ('teacher', 'admin')
          OR (
            public.user_role() = 'department_lead'
            AND (tasks.department_id = public.user_department_id() OR tasks.department_id IS NULL)
          )
          OR EXISTS (
            SELECT 1 FROM task_assignees
            WHERE task_assignees.task_id = tasks.id
              AND task_assignees.profile_id = auth.uid()
          )
        )
    )
  );

CREATE POLICY "checklist_items_update"
  ON checklist_items FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM tasks
      WHERE tasks.id = checklist_items.task_id
        AND tasks.company_id = public.user_company_id()
        AND (
          public.user_role() IN ('teacher', 'admin')
          OR (
            public.user_role() = 'department_lead'
            AND (tasks.department_id = public.user_department_id() OR tasks.department_id IS NULL)
          )
          OR EXISTS (
            SELECT 1 FROM task_assignees
            WHERE task_assignees.task_id = tasks.id
              AND task_assignees.profile_id = auth.uid()
          )
        )
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM tasks
      WHERE tasks.id = checklist_items.task_id
        AND tasks.company_id = public.user_company_id()
    )
  );

CREATE POLICY "checklist_items_delete"
  ON checklist_items FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM tasks
      WHERE tasks.id = checklist_items.task_id
        AND tasks.company_id = public.user_company_id()
        AND (
          public.user_role() IN ('teacher', 'admin')
          OR (
            public.user_role() = 'department_lead'
            AND (tasks.department_id = public.user_department_id() OR tasks.department_id IS NULL)
          )
          OR EXISTS (
            SELECT 1 FROM task_assignees
            WHERE task_assignees.task_id = tasks.id
              AND task_assignees.profile_id = auth.uid()
          )
        )
    )
  );

-- ─── Task Assignees ──────────────────────────────────────────────────────────

CREATE POLICY "task_assignees_select"
  ON task_assignees FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM tasks
      WHERE tasks.id = task_assignees.task_id
        AND tasks.company_id = public.user_company_id()
    )
  );

CREATE POLICY "task_assignees_insert"
  ON task_assignees FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM tasks
      WHERE tasks.id = task_assignees.task_id
        AND tasks.company_id = public.user_company_id()
        AND (
          public.user_role() IN ('teacher', 'admin')
          OR (
            public.user_role() = 'department_lead'
            AND (tasks.department_id = public.user_department_id() OR tasks.department_id IS NULL)
          )
        )
    )
  );

CREATE POLICY "task_assignees_update"
  ON task_assignees FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM tasks
      WHERE tasks.id = task_assignees.task_id
        AND tasks.company_id = public.user_company_id()
        AND (
          public.user_role() IN ('teacher', 'admin')
          OR (
            public.user_role() = 'department_lead'
            AND (tasks.department_id = public.user_department_id() OR tasks.department_id IS NULL)
          )
        )
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM tasks
      WHERE tasks.id = task_assignees.task_id
        AND tasks.company_id = public.user_company_id()
    )
  );

CREATE POLICY "task_assignees_delete"
  ON task_assignees FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM tasks
      WHERE tasks.id = task_assignees.task_id
        AND tasks.company_id = public.user_company_id()
        AND (
          public.user_role() IN ('teacher', 'admin')
          OR (
            public.user_role() = 'department_lead'
            AND (tasks.department_id = public.user_department_id() OR tasks.department_id IS NULL)
          )
        )
    )
  );

-- ─── Task Departments ────────────────────────────────────────────────────────

CREATE POLICY "task_departments_select"
  ON task_departments FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM tasks
      WHERE tasks.id = task_departments.task_id
        AND tasks.company_id = public.user_company_id()
    )
  );

CREATE POLICY "task_departments_insert"
  ON task_departments FOR INSERT TO authenticated
  WITH CHECK (
    public.user_role() IN ('teacher', 'admin')
    AND EXISTS (
      SELECT 1 FROM tasks
      WHERE tasks.id = task_departments.task_id
        AND tasks.company_id = public.user_company_id()
    )
  );

CREATE POLICY "task_departments_update"
  ON task_departments FOR UPDATE TO authenticated
  USING (
    public.user_role() IN ('teacher', 'admin')
    AND EXISTS (
      SELECT 1 FROM tasks
      WHERE tasks.id = task_departments.task_id
        AND tasks.company_id = public.user_company_id()
    )
  )
  WITH CHECK (
    public.user_role() IN ('teacher', 'admin')
    AND EXISTS (
      SELECT 1 FROM tasks
      WHERE tasks.id = task_departments.task_id
        AND tasks.company_id = public.user_company_id()
    )
  );

CREATE POLICY "task_departments_delete"
  ON task_departments FOR DELETE TO authenticated
  USING (
    public.user_role() IN ('teacher', 'admin')
    AND EXISTS (
      SELECT 1 FROM tasks
      WHERE tasks.id = task_departments.task_id
        AND tasks.company_id = public.user_company_id()
    )
  );

-- ─── Task Comments ───────────────────────────────────────────────────────────

CREATE POLICY "task_comments_select"
  ON task_comments FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM tasks
      WHERE tasks.id = task_comments.task_id
        AND tasks.company_id = public.user_company_id()
    )
  );

CREATE POLICY "task_comments_insert"
  ON task_comments FOR INSERT TO authenticated
  WITH CHECK (
    profile_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM tasks
      WHERE tasks.id = task_comments.task_id
        AND tasks.company_id = public.user_company_id()
    )
  );

CREATE POLICY "task_comments_delete"
  ON task_comments FOR DELETE TO authenticated
  USING (profile_id = auth.uid());

-- ─── Calendar Events ─────────────────────────────────────────────────────────

CREATE POLICY "calendar_events_select_own_company"
  ON calendar_events FOR SELECT TO authenticated
  USING (company_id = public.user_company_id());

CREATE POLICY "calendar_events_insert_teacher_admin"
  ON calendar_events FOR INSERT TO authenticated
  WITH CHECK (
    company_id = public.user_company_id()
    AND public.user_role() IN ('teacher', 'admin')
  );

CREATE POLICY "calendar_events_update_teacher_admin"
  ON calendar_events FOR UPDATE TO authenticated
  USING (
    company_id = public.user_company_id()
    AND public.user_role() IN ('teacher', 'admin')
  )
  WITH CHECK (
    company_id = public.user_company_id()
    AND public.user_role() IN ('teacher', 'admin')
  );

CREATE POLICY "calendar_events_delete_teacher_admin"
  ON calendar_events FOR DELETE TO authenticated
  USING (
    company_id = public.user_company_id()
    AND public.user_role() IN ('teacher', 'admin')
  );

-- ─── Print Requests ──────────────────────────────────────────────────────────

CREATE POLICY "print_requests_select_own_company"
  ON print_requests FOR SELECT TO authenticated
  USING (company_id = public.user_company_id());

CREATE POLICY "print_requests_insert"
  ON print_requests FOR INSERT TO authenticated
  WITH CHECK (company_id = public.user_company_id());

CREATE POLICY "print_requests_update_teacher_admin"
  ON print_requests FOR UPDATE TO authenticated
  USING (
    company_id = public.user_company_id()
    AND public.user_role() IN ('teacher', 'admin')
  )
  WITH CHECK (
    company_id = public.user_company_id()
    AND public.user_role() IN ('teacher', 'admin')
  );

CREATE POLICY "print_requests_delete_teacher_admin"
  ON print_requests FOR DELETE TO authenticated
  USING (
    company_id = public.user_company_id()
    AND public.user_role() IN ('teacher', 'admin')
  );

-- ─── Enable Realtime ─────────────────────────────────────────────────────────

ALTER PUBLICATION supabase_realtime ADD TABLE tasks, checklist_items,
  task_assignees, task_comments, task_departments, calendar_events,
  print_requests, profiles, task_periods, departments;
