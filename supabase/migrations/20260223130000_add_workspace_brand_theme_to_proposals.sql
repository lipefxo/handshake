-- Add workspace_brand_theme to proposals so public viewers always get the
-- brand theme without depending solely on the edge function.
ALTER TABLE proposals
  ADD COLUMN IF NOT EXISTS workspace_brand_theme jsonb;

-- Backfill from the workspaces table for all existing proposals.
UPDATE proposals p
SET workspace_brand_theme = w.brand_theme
FROM workspaces w
WHERE p.workspace_id = w.id
  AND w.brand_theme IS NOT NULL
  AND w.brand_theme != '{}'::jsonb;
