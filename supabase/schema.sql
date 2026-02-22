-- ============================================================
-- Handshake — Supabase Schema
-- Run this in the Supabase SQL Editor
-- ============================================================

-- Proposals table
create table proposals (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  slug text unique not null,
  title text not null,
  partner_name text not null,
  status text default 'draft' check (status in ('draft', 'published')),
  slides jsonb not null default '[]'::jsonb,
  theme_id text default 'dark-minimal',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Indexes
create index idx_proposals_user_id on proposals(user_id);
create index idx_proposals_slug on proposals(slug);

-- Row Level Security
alter table proposals enable row level security;

-- Users can CRUD their own proposals
create policy "Users can manage their own proposals"
  on proposals for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Anyone can read published proposals (public presentation URLs)
create policy "Published proposals are publicly readable"
  on proposals for select
  using (status = 'published');

-- Auto-update updated_at
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger proposals_updated_at
  before update on proposals
  for each row execute function update_updated_at();

-- ============================================================
-- Migrate legacy "theme" JSONB → "theme_id" text column
-- Safe to re-run: every statement is idempotent.
-- ============================================================

ALTER TABLE proposals ADD COLUMN IF NOT EXISTS theme_id text DEFAULT 'dark-minimal';

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'proposals' AND column_name = 'theme'
  ) THEN
    UPDATE proposals
      SET theme_id = theme->>'id'
      WHERE theme IS NOT NULL
        AND theme->>'id' IS NOT NULL
        AND (theme_id IS NULL OR theme_id = 'dark-minimal');

    ALTER TABLE proposals DROP COLUMN theme;
  END IF;
END $$;

-- ============================================================
-- Sharing controls on proposals
-- ============================================================

ALTER TABLE proposals
  ADD COLUMN IF NOT EXISTS visibility text DEFAULT 'public'
    CHECK (visibility IN ('public', 'password', 'email_gated')),
  ADD COLUMN IF NOT EXISTS access_password text,
  ADD COLUMN IF NOT EXISTS expires_at timestamptz,
  ADD COLUMN IF NOT EXISTS brand_overrides jsonb DEFAULT '{}'::jsonb;

-- ============================================================
-- Short share links
-- ============================================================

ALTER TABLE proposals
  ADD COLUMN IF NOT EXISTS short_code text UNIQUE;

CREATE INDEX IF NOT EXISTS idx_proposals_short_code ON proposals(short_code);

UPDATE proposals
SET short_code = substr(replace(gen_random_uuid()::text, '-', ''), 1, 8)
WHERE short_code IS NULL;

ALTER TABLE proposals
  ALTER COLUMN short_code SET NOT NULL;

-- Lead capture for email-gated proposals
CREATE TABLE IF NOT EXISTS proposal_leads (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  proposal_id uuid REFERENCES proposals(id) ON DELETE CASCADE NOT NULL,
  email text NOT NULL,
  accessed_at timestamptz DEFAULT now(),
  UNIQUE(proposal_id, email)
);

ALTER TABLE proposal_leads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read leads for their proposals"
  ON proposal_leads FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM proposals
      WHERE proposals.id = proposal_leads.proposal_id
        AND proposals.user_id = auth.uid()
    )
  );

CREATE POLICY "Anyone can submit a lead"
  ON proposal_leads FOR INSERT
  WITH CHECK (true);

-- ============================================================
-- Waitlist (landing page email capture)
-- ============================================================

create table if not exists waitlist (
  id uuid default gen_random_uuid() primary key,
  email text unique not null,
  source text default 'landing_page',
  created_at timestamptz default now()
);

alter table waitlist enable row level security;

create policy "Anyone can join waitlist"
  on waitlist for insert
  with check (true);

create policy "No public reads on waitlist"
  on waitlist for select
  using (false);

-- ============================================================
-- Storage
-- ============================================================

-- Bucket for proposal assets (logos, images, GIFs)
insert into storage.buckets (id, name, public)
values ('proposal-assets', 'proposal-assets', true);

-- Authenticated users can upload to their own folder
create policy "Users can upload to their own folder"
  on storage.objects for insert
  with check (
    bucket_id = 'proposal-assets'
    and auth.role() = 'authenticated'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- Anyone can read assets (used in public proposals)
create policy "Public read access for proposal assets"
  on storage.objects for select
  using (bucket_id = 'proposal-assets');

-- Users can update/delete their own assets
create policy "Users can manage their own assets"
  on storage.objects for all
  using (
    bucket_id = 'proposal-assets'
    and auth.uid()::text = (storage.foldername(name))[1]
  );
