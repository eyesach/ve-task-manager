-- Fix checklist_items RLS: allow any authenticated member in the same company
-- to insert/update/delete checklist items.
-- The previous policy was too restrictive — it blocked department members who
-- weren't explicitly assigned to the parent task.

-- INSERT: any authenticated user in the same company
DROP POLICY IF EXISTS "checklist_items_insert" ON checklist_items;
CREATE POLICY "checklist_items_insert"
  ON checklist_items FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM tasks
      WHERE tasks.id = checklist_items.task_id
        AND tasks.company_id = public.user_company_id()
    )
  );

-- UPDATE: any authenticated user in the same company
DROP POLICY IF EXISTS "checklist_items_update" ON checklist_items;
CREATE POLICY "checklist_items_update"
  ON checklist_items FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM tasks
      WHERE tasks.id = checklist_items.task_id
        AND tasks.company_id = public.user_company_id()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM tasks
      WHERE tasks.id = checklist_items.task_id
        AND tasks.company_id = public.user_company_id()
    )
  );

-- DELETE: any authenticated user in the same company
DROP POLICY IF EXISTS "checklist_items_delete" ON checklist_items;
CREATE POLICY "checklist_items_delete"
  ON checklist_items FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM tasks
      WHERE tasks.id = checklist_items.task_id
        AND tasks.company_id = public.user_company_id()
    )
  );
