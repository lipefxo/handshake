-- Team access incremental migration (idempotent)

-- Workspaces and team access
CREATE TABLE IF NOT EXISTS workspaces (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL DEFAULT 'My Workspace',
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS workspace_members (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id uuid REFERENCES workspaces(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  role text NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'member')),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('active', 'pending')),
  invited_at timestamptz DEFAULT now(),
  UNIQUE(workspace_id, email)
);

CREATE INDEX IF NOT EXISTS idx_workspace_members_workspace_id ON workspace_members(workspace_id);
CREATE INDEX IF NOT EXISTS idx_workspace_members_user_id ON workspace_members(user_id);
CREATE INDEX IF NOT EXISTS idx_workspace_members_email ON workspace_members(lower(email));

ALTER TABLE workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE workspace_members ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Members can read their workspaces" ON workspaces;
CREATE POLICY "Members can read their workspaces"
  ON workspaces FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM workspace_members wm
      WHERE wm.workspace_id = workspaces.id
        AND wm.user_id = auth.uid()
        AND wm.status = 'active'
    )
  );

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
  USING (
    EXISTS (
      SELECT 1 FROM workspace_members wm
      WHERE wm.workspace_id = workspaces.id
        AND wm.user_id = auth.uid()
        AND wm.role = 'owner'
        AND wm.status = 'active'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM workspace_members wm
      WHERE wm.workspace_id = workspaces.id
        AND wm.user_id = auth.uid()
        AND wm.role = 'owner'
        AND wm.status = 'active'
    )
  );

DROP POLICY IF EXISTS "Members can read workspace members" ON workspace_members;
CREATE POLICY "Members can read workspace members"
  ON workspace_members FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM workspace_members own
      WHERE own.workspace_id = workspace_members.workspace_id
        AND own.user_id = auth.uid()
        AND own.status = 'active'
    )
  );

DROP POLICY IF EXISTS "Owners can invite workspace members" ON workspace_members;
CREATE POLICY "Owners can invite workspace members"
  ON workspace_members FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM workspace_members own
      WHERE own.workspace_id = workspace_members.workspace_id
        AND own.user_id = auth.uid()
        AND own.role = 'owner'
        AND own.status = 'active'
    )
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
  USING (
    EXISTS (
      SELECT 1 FROM workspace_members own
      WHERE own.workspace_id = workspace_members.workspace_id
        AND own.user_id = auth.uid()
        AND own.role = 'owner'
        AND own.status = 'active'
    )
  );

DROP POLICY IF EXISTS "Owners can manage workspace members" ON workspace_members;
CREATE POLICY "Owners can manage workspace members"
  ON workspace_members FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM workspace_members own
      WHERE own.workspace_id = workspace_members.workspace_id
        AND own.user_id = auth.uid()
        AND own.role = 'owner'
        AND own.status = 'active'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM workspace_members own
      WHERE own.workspace_id = workspace_members.workspace_id
        AND own.user_id = auth.uid()
        AND own.role = 'owner'
        AND own.status = 'active'
    )
  );

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

-- Move proposals ownership to workspaces
ALTER TABLE proposals
  ADD COLUMN IF NOT EXISTS workspace_id uuid REFERENCES workspaces(id) ON DELETE CASCADE;

DO $$
DECLARE
  owner_row RECORD;
  owner_workspace_id uuid;
BEGIN
  FOR owner_row IN
    SELECT DISTINCT user_id
    FROM proposals
    WHERE user_id IS NOT NULL
  LOOP
    SELECT wm.workspace_id
    INTO owner_workspace_id
    FROM workspace_members wm
    WHERE wm.user_id = owner_row.user_id
      AND wm.role = 'owner'
      AND wm.status = 'active'
    LIMIT 1;

    IF owner_workspace_id IS NULL THEN
      INSERT INTO workspaces (created_by, name)
      VALUES (owner_row.user_id, 'My Workspace')
      RETURNING id INTO owner_workspace_id;

      INSERT INTO workspace_members (workspace_id, user_id, email, role, status)
      SELECT
        owner_workspace_id,
        owner_row.user_id,
        COALESCE(u.email, ''),
        'owner',
        'active'
      FROM auth.users u
      WHERE u.id = owner_row.user_id;
    END IF;

    UPDATE proposals
    SET workspace_id = owner_workspace_id
    WHERE user_id = owner_row.user_id
      AND workspace_id IS NULL;
  END LOOP;
END $$;

DROP POLICY IF EXISTS "Users can manage their own proposals" ON proposals;
DROP POLICY IF EXISTS "Workspace members can manage workspace proposals" ON proposals;
CREATE POLICY "Workspace members can manage workspace proposals"
  ON proposals FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM workspace_members wm
      WHERE wm.workspace_id = proposals.workspace_id
        AND wm.user_id = auth.uid()
        AND wm.status = 'active'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM workspace_members wm
      WHERE wm.workspace_id = proposals.workspace_id
        AND wm.user_id = auth.uid()
        AND wm.status = 'active'
    )
  );
