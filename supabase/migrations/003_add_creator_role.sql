-- Add 'creator' role — full teacher/admin permissions, but can be assigned to departments and tasks

-- ─── Update CHECK constraint on profiles ────────────────────────────────────
ALTER TABLE profiles DROP CONSTRAINT profiles_role_check;
ALTER TABLE profiles ADD CONSTRAINT profiles_role_check
  CHECK (role IN ('admin', 'department_lead', 'member', 'teacher', 'creator'));

-- ─── Drop and recreate RLS policies that reference ('teacher', 'admin') ─────

-- Profiles
DROP POLICY IF EXISTS "profiles_insert_teacher_admin" ON profiles;
CREATE POLICY "profiles_insert_teacher_admin"
  ON profiles FOR INSERT TO authenticated
  WITH CHECK (public.user_role() IN ('teacher', 'admin', 'creator'));

DROP POLICY IF EXISTS "profiles_delete_teacher_admin" ON profiles;
CREATE POLICY "profiles_delete_teacher_admin"
  ON profiles FOR DELETE TO authenticated
  USING (public.user_role() IN ('teacher', 'admin', 'creator'));

-- Task Periods
DROP POLICY IF EXISTS "task_periods_insert_teacher_admin" ON task_periods;
CREATE POLICY "task_periods_insert_teacher_admin"
  ON task_periods FOR INSERT TO authenticated
  WITH CHECK (public.user_role() IN ('teacher', 'admin', 'creator'));

DROP POLICY IF EXISTS "task_periods_update_teacher_admin" ON task_periods;
CREATE POLICY "task_periods_update_teacher_admin"
  ON task_periods FOR UPDATE TO authenticated
  USING (public.user_role() IN ('teacher', 'admin', 'creator'))
  WITH CHECK (public.user_role() IN ('teacher', 'admin', 'creator'));

DROP POLICY IF EXISTS "task_periods_delete_teacher_admin" ON task_periods;
CREATE POLICY "task_periods_delete_teacher_admin"
  ON task_periods FOR DELETE TO authenticated
  USING (public.user_role() IN ('teacher', 'admin', 'creator'));

-- Tasks
DROP POLICY IF EXISTS "tasks_insert" ON tasks;
CREATE POLICY "tasks_insert"
  ON tasks FOR INSERT TO authenticated
  WITH CHECK (
    company_id = public.user_company_id()
    AND (
      public.user_role() IN ('teacher', 'admin', 'creator')
      OR (
        public.user_role() = 'department_lead'
        AND (department_id = public.user_department_id() OR department_id IS NULL)
      )
    )
  );

DROP POLICY IF EXISTS "tasks_update" ON tasks;
CREATE POLICY "tasks_update"
  ON tasks FOR UPDATE TO authenticated
  USING (
    company_id = public.user_company_id()
    AND (
      public.user_role() IN ('teacher', 'admin', 'creator')
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

DROP POLICY IF EXISTS "tasks_delete" ON tasks;
CREATE POLICY "tasks_delete"
  ON tasks FOR DELETE TO authenticated
  USING (
    company_id = public.user_company_id()
    AND (
      public.user_role() IN ('teacher', 'admin', 'creator')
      OR (
        public.user_role() = 'department_lead'
        AND (department_id = public.user_department_id() OR department_id IS NULL)
      )
    )
  );

-- Checklist Items
DROP POLICY IF EXISTS "checklist_items_insert" ON checklist_items;
CREATE POLICY "checklist_items_insert"
  ON checklist_items FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM tasks
      WHERE tasks.id = checklist_items.task_id
        AND tasks.company_id = public.user_company_id()
        AND (
          public.user_role() IN ('teacher', 'admin', 'creator')
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

DROP POLICY IF EXISTS "checklist_items_update" ON checklist_items;
CREATE POLICY "checklist_items_update"
  ON checklist_items FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM tasks
      WHERE tasks.id = checklist_items.task_id
        AND tasks.company_id = public.user_company_id()
        AND (
          public.user_role() IN ('teacher', 'admin', 'creator')
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

DROP POLICY IF EXISTS "checklist_items_delete" ON checklist_items;
CREATE POLICY "checklist_items_delete"
  ON checklist_items FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM tasks
      WHERE tasks.id = checklist_items.task_id
        AND tasks.company_id = public.user_company_id()
        AND (
          public.user_role() IN ('teacher', 'admin', 'creator')
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

-- Task Assignees
DROP POLICY IF EXISTS "task_assignees_insert" ON task_assignees;
CREATE POLICY "task_assignees_insert"
  ON task_assignees FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM tasks
      WHERE tasks.id = task_assignees.task_id
        AND tasks.company_id = public.user_company_id()
        AND (
          public.user_role() IN ('teacher', 'admin', 'creator')
          OR (
            public.user_role() = 'department_lead'
            AND (tasks.department_id = public.user_department_id() OR tasks.department_id IS NULL)
          )
        )
    )
  );

DROP POLICY IF EXISTS "task_assignees_update" ON task_assignees;
CREATE POLICY "task_assignees_update"
  ON task_assignees FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM tasks
      WHERE tasks.id = task_assignees.task_id
        AND tasks.company_id = public.user_company_id()
        AND (
          public.user_role() IN ('teacher', 'admin', 'creator')
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

DROP POLICY IF EXISTS "task_assignees_delete" ON task_assignees;
CREATE POLICY "task_assignees_delete"
  ON task_assignees FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM tasks
      WHERE tasks.id = task_assignees.task_id
        AND tasks.company_id = public.user_company_id()
        AND (
          public.user_role() IN ('teacher', 'admin', 'creator')
          OR (
            public.user_role() = 'department_lead'
            AND (tasks.department_id = public.user_department_id() OR tasks.department_id IS NULL)
          )
        )
    )
  );

-- Task Departments
DROP POLICY IF EXISTS "task_departments_insert" ON task_departments;
CREATE POLICY "task_departments_insert"
  ON task_departments FOR INSERT TO authenticated
  WITH CHECK (
    public.user_role() IN ('teacher', 'admin', 'creator')
    AND EXISTS (
      SELECT 1 FROM tasks
      WHERE tasks.id = task_departments.task_id
        AND tasks.company_id = public.user_company_id()
    )
  );

DROP POLICY IF EXISTS "task_departments_update" ON task_departments;
CREATE POLICY "task_departments_update"
  ON task_departments FOR UPDATE TO authenticated
  USING (
    public.user_role() IN ('teacher', 'admin', 'creator')
    AND EXISTS (
      SELECT 1 FROM tasks
      WHERE tasks.id = task_departments.task_id
        AND tasks.company_id = public.user_company_id()
    )
  )
  WITH CHECK (
    public.user_role() IN ('teacher', 'admin', 'creator')
    AND EXISTS (
      SELECT 1 FROM tasks
      WHERE tasks.id = task_departments.task_id
        AND tasks.company_id = public.user_company_id()
    )
  );

DROP POLICY IF EXISTS "task_departments_delete" ON task_departments;
CREATE POLICY "task_departments_delete"
  ON task_departments FOR DELETE TO authenticated
  USING (
    public.user_role() IN ('teacher', 'admin', 'creator')
    AND EXISTS (
      SELECT 1 FROM tasks
      WHERE tasks.id = task_departments.task_id
        AND tasks.company_id = public.user_company_id()
    )
  );

-- Calendar Events
DROP POLICY IF EXISTS "calendar_events_insert_teacher_admin" ON calendar_events;
CREATE POLICY "calendar_events_insert_teacher_admin"
  ON calendar_events FOR INSERT TO authenticated
  WITH CHECK (
    company_id = public.user_company_id()
    AND public.user_role() IN ('teacher', 'admin', 'creator')
  );

DROP POLICY IF EXISTS "calendar_events_update_teacher_admin" ON calendar_events;
CREATE POLICY "calendar_events_update_teacher_admin"
  ON calendar_events FOR UPDATE TO authenticated
  USING (
    company_id = public.user_company_id()
    AND public.user_role() IN ('teacher', 'admin', 'creator')
  )
  WITH CHECK (
    company_id = public.user_company_id()
    AND public.user_role() IN ('teacher', 'admin', 'creator')
  );

DROP POLICY IF EXISTS "calendar_events_delete_teacher_admin" ON calendar_events;
CREATE POLICY "calendar_events_delete_teacher_admin"
  ON calendar_events FOR DELETE TO authenticated
  USING (
    company_id = public.user_company_id()
    AND public.user_role() IN ('teacher', 'admin', 'creator')
  );

-- Print Requests
DROP POLICY IF EXISTS "print_requests_update_teacher_admin" ON print_requests;
CREATE POLICY "print_requests_update_teacher_admin"
  ON print_requests FOR UPDATE TO authenticated
  USING (
    company_id = public.user_company_id()
    AND public.user_role() IN ('teacher', 'admin', 'creator')
  )
  WITH CHECK (
    company_id = public.user_company_id()
    AND public.user_role() IN ('teacher', 'admin', 'creator')
  );

DROP POLICY IF EXISTS "print_requests_delete_teacher_admin" ON print_requests;
CREATE POLICY "print_requests_delete_teacher_admin"
  ON print_requests FOR DELETE TO authenticated
  USING (
    company_id = public.user_company_id()
    AND public.user_role() IN ('teacher', 'admin', 'creator')
  );
