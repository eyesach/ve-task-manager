-- Fix collaborative updates: REPLICA IDENTITY FULL + missing RLS policies

-- ─── REPLICA IDENTITY FULL ─────────────────────────────────────────────────
-- Required for Supabase Realtime to send complete row data on UPDATE/DELETE events.
-- Without this, other users may receive incomplete payloads and miss changes.

ALTER TABLE tasks REPLICA IDENTITY FULL;
ALTER TABLE checklist_items REPLICA IDENTITY FULL;
ALTER TABLE task_assignees REPLICA IDENTITY FULL;
ALTER TABLE task_comments REPLICA IDENTITY FULL;
ALTER TABLE task_departments REPLICA IDENTITY FULL;
ALTER TABLE profiles REPLICA IDENTITY FULL;
ALTER TABLE task_periods REPLICA IDENTITY FULL;
ALTER TABLE calendar_events REPLICA IDENTITY FULL;
ALTER TABLE print_requests REPLICA IDENTITY FULL;

-- ─── Fix profiles UPDATE policy ────────────────────────────────────────────
-- Currently only profiles_update_own exists (id = auth.uid()), which blocks
-- teacher/admin/creator from updating other users' profiles (role, department, etc.)

DROP POLICY IF EXISTS "profiles_update_teacher_admin" ON profiles;
CREATE POLICY "profiles_update_teacher_admin"
  ON profiles FOR UPDATE TO authenticated
  USING (
    company_id = public.user_company_id()
    AND public.user_role() IN ('teacher', 'admin', 'creator')
  )
  WITH CHECK (
    company_id = public.user_company_id()
    AND public.user_role() IN ('teacher', 'admin', 'creator')
  );
