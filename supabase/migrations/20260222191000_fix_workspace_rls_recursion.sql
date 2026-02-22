-- Fix workspace RLS recursion (42P17) by using SECURITY DEFINER helpers.

CREATE OR REPLACE FUNCTION public.is_workspace_member(target_workspace_id uuid, target_user_id uuid DEFAULT auth.uid())
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.workspace_members wm
    WHERE wm.workspace_id = target_workspace_id
      AND wm.user_id = target_user_id
      AND wm.status = 'active'
  );
$$;

CREATE OR REPLACE FUNCTION public.is_workspace_owner(target_workspace_id uuid, target_user_id uuid DEFAULT auth.uid())
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.workspace_members wm
    WHERE wm.workspace_id = target_workspace_id
      AND wm.user_id = target_user_id
      AND wm.role = 'owner'
      AND wm.status = 'active'
  );
$$;

DROP POLICY IF EXISTS "Members can read their workspaces" ON workspaces;
CREATE POLICY "Members can read their workspaces"
  ON workspaces FOR SELECT
  USING (public.is_workspace_member(id));

DROP POLICY IF EXISTS "Users can create their own workspaces" ON workspaces;
CREATE POLICY "Users can create their own workspaces"
  ON workspaces FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND created_by = auth.uid()
  );

DROP POLICY IF EXISTS "Owners can update their workspaces" ON workspaces;
CREATE POLICY "Owners can update their workspaces"
  ON workspaces FOR UPDATE
  USING (public.is_workspace_owner(id))
  WITH CHECK (public.is_workspace_owner(id));

DROP POLICY IF EXISTS "Members can read workspace members" ON workspace_members;
CREATE POLICY "Members can read workspace members"
  ON workspace_members FOR SELECT
  USING (public.is_workspace_member(workspace_id));

DROP POLICY IF EXISTS "Owners can invite workspace members" ON workspace_members;
CREATE POLICY "Owners can invite workspace members"
  ON workspace_members FOR INSERT
  WITH CHECK (
    public.is_workspace_owner(workspace_id)
    OR (
      role = 'owner'
      AND status = 'active'
      AND user_id = auth.uid()
      AND lower(email) = lower(COALESCE(auth.jwt() ->> 'email', ''))
      AND EXISTS (
        SELECT 1 FROM workspaces w
        WHERE w.id = workspace_members.workspace_id
          AND w.created_by = auth.uid()
      )
    )
  );

DROP POLICY IF EXISTS "Owners can remove workspace members" ON workspace_members;
CREATE POLICY "Owners can remove workspace members"
  ON workspace_members FOR DELETE
  USING (public.is_workspace_owner(workspace_id));

DROP POLICY IF EXISTS "Owners can manage workspace members" ON workspace_members;
CREATE POLICY "Owners can manage workspace members"
  ON workspace_members FOR UPDATE
  USING (public.is_workspace_owner(workspace_id))
  WITH CHECK (public.is_workspace_owner(workspace_id));

DROP POLICY IF EXISTS "Invited users can accept invitations" ON workspace_members;
CREATE POLICY "Invited users can accept invitations"
  ON workspace_members FOR UPDATE
  USING (
    status = 'pending'
    AND user_id IS NULL
    AND lower(email) = lower(COALESCE(auth.jwt() ->> 'email', ''))
  )
  WITH CHECK (
    user_id = auth.uid()
    AND status = 'active'
    AND lower(email) = lower(COALESCE(auth.jwt() ->> 'email', ''))
  );

DROP POLICY IF EXISTS "Users can manage their own proposals" ON proposals;
DROP POLICY IF EXISTS "Workspace members can manage workspace proposals" ON proposals;
CREATE POLICY "Workspace members can manage workspace proposals"
  ON proposals FOR ALL
  USING (public.is_workspace_member(workspace_id))
  WITH CHECK (public.is_workspace_member(workspace_id));
