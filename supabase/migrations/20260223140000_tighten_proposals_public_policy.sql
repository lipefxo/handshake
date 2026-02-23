-- Tighten the "Public published proposals are readable" policy so that only the
-- anon (unauthenticated) role can use it.  Authenticated workspace members
-- already have full access through "Workspace members can manage workspace
-- proposals", so restricting the public policy to anon removes the path that
-- let a logged-in user from ANY workspace read another workspace's published
-- proposals via a plain SELECT without a workspace_id filter.

DROP POLICY IF EXISTS "Public published proposals are readable" ON proposals;
CREATE POLICY "Public published proposals are readable"
  ON proposals FOR SELECT
  TO anon
  USING (
    status = 'published'
    AND visibility = 'public'
    AND (expires_at IS NULL OR expires_at > now())
  );
