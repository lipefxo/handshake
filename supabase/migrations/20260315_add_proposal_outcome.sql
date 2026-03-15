-- Add outcome column to proposals table
ALTER TABLE proposals
  ADD COLUMN IF NOT EXISTS outcome TEXT NOT NULL DEFAULT 'active'
  CHECK (outcome IN ('active', 'won', 'lost', 'archived'));
