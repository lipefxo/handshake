-- Fix invited-user acceptance checks to avoid JWT-email-only dependency.

CREATE OR REPLACE FUNCTION public.current_user_email()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, auth
AS $$
  SELECT lower(COALESCE(
    (SELECT u.email FROM auth.users u WHERE u.id = auth.uid()),
    auth.jwt() ->> 'email',
    ''
  ));
$$;

DROP POLICY IF EXISTS "Owners can invite workspace members" ON workspace_members;
CREATE POLICY "Owners can invite workspace members"
  ON workspace_members FOR INSERT
  WITH CHECK (
    public.is_workspace_owner(workspace_id)
    OR (
      role = 'owner'
      AND status = 'active'
      AND user_id = auth.uid()
      AND lower(email) = public.current_user_email()
      AND EXISTS (
        SELECT 1 FROM workspaces w
        WHERE w.id = workspace_members.workspace_id
          AND w.created_by = auth.uid()
      )
    )
  );

DROP POLICY IF EXISTS "Invited users can accept invitations" ON workspace_members;
CREATE POLICY "Invited users can accept invitations"
  ON workspace_members FOR UPDATE
  USING (
    status = 'pending'
    AND user_id IS NULL
    AND lower(email) = public.current_user_email()
  )
  WITH CHECK (
    user_id = auth.uid()
    AND status = 'active'
    AND lower(email) = public.current_user_email()
  );
