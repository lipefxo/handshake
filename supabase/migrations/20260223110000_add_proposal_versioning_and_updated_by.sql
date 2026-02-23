ALTER TABLE proposals
  ADD COLUMN IF NOT EXISTS updated_by uuid REFERENCES auth.users(id) ON DELETE SET NULL;

CREATE TABLE IF NOT EXISTS proposal_versions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  proposal_id uuid REFERENCES proposals(id) ON DELETE CASCADE NOT NULL,
  version_number integer NOT NULL,
  title text NOT NULL,
  partner_name text NOT NULL,
  slides jsonb NOT NULL DEFAULT '[]'::jsonb,
  theme_id text,
  brand_overrides jsonb DEFAULT '{}'::jsonb,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE (proposal_id, version_number)
);

CREATE INDEX IF NOT EXISTS idx_proposal_versions_proposal_id
  ON proposal_versions(proposal_id);
CREATE INDEX IF NOT EXISTS idx_proposal_versions_created_at
  ON proposal_versions(created_at DESC);

ALTER TABLE proposal_versions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Workspace members can read proposal versions" ON proposal_versions;
CREATE POLICY "Workspace members can read proposal versions"
  ON proposal_versions FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM proposals p
      WHERE p.id = proposal_versions.proposal_id
        AND public.is_workspace_member(p.workspace_id)
    )
  );

DROP POLICY IF EXISTS "Workspace members can insert proposal versions" ON proposal_versions;
CREATE POLICY "Workspace members can insert proposal versions"
  ON proposal_versions FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM proposals p
      WHERE p.id = proposal_versions.proposal_id
        AND public.is_workspace_member(p.workspace_id)
    )
  );

DROP POLICY IF EXISTS "Workspace members can delete proposal versions" ON proposal_versions;
CREATE POLICY "Workspace members can delete proposal versions"
  ON proposal_versions FOR DELETE
  USING (
    EXISTS (
      SELECT 1
      FROM proposals p
      WHERE p.id = proposal_versions.proposal_id
        AND public.is_workspace_member(p.workspace_id)
    )
  );
