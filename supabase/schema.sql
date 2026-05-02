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

-- Baseline policy; tightened after sharing columns are added
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
  ADD COLUMN IF NOT EXISTS brand_overrides jsonb DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS workspace_brand_theme jsonb;

DROP POLICY IF EXISTS "Published proposals are publicly readable" ON proposals;
DROP POLICY IF EXISTS "Public published proposals are readable" ON proposals;
-- Restrict to the anon role only: authenticated workspace members already have
-- access via "Workspace members can manage workspace proposals", and allowing
-- authenticated users to read published proposals from any workspace would let
-- them see content from other workspaces in the admin interface.
CREATE POLICY "Public published proposals are readable"
  ON proposals FOR SELECT
  TO anon
  USING (
    status = 'published'
    AND visibility = 'public'
    AND (expires_at IS NULL OR expires_at > now())
  );

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

DROP POLICY IF EXISTS "Users can read leads for their proposals" ON proposal_leads;
CREATE POLICY "Workspace members can read leads for their proposals"
  ON proposal_leads FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM proposals
      WHERE proposals.id = proposal_leads.proposal_id
        AND public.is_workspace_member(proposals.workspace_id)
    )
  );

CREATE POLICY "Anyone can submit a lead"
  ON proposal_leads FOR INSERT
  WITH CHECK (true);

-- Access sessions for gated proposals
CREATE TABLE IF NOT EXISTS proposal_access_sessions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  proposal_id uuid REFERENCES proposals(id) ON DELETE CASCADE NOT NULL,
  session_token text UNIQUE NOT NULL,
  access_type text NOT NULL CHECK (access_type IN ('password', 'email')),
  email text,
  expires_at timestamptz NOT NULL,
  created_at timestamptz DEFAULT now(),
  last_accessed_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_proposal_access_sessions_proposal_id
  ON proposal_access_sessions(proposal_id);
CREATE INDEX IF NOT EXISTS idx_proposal_access_sessions_session_token
  ON proposal_access_sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_proposal_access_sessions_expires_at
  ON proposal_access_sessions(expires_at);
CREATE UNIQUE INDEX IF NOT EXISTS idx_proposal_access_sessions_email_unique
  ON proposal_access_sessions(proposal_id, email)
  WHERE access_type = 'email' AND email IS NOT NULL;

ALTER TABLE proposal_access_sessions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Workspace members can read access sessions" ON proposal_access_sessions;
CREATE POLICY "Workspace members can read access sessions"
  ON proposal_access_sessions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM proposals
      WHERE proposals.id = proposal_access_sessions.proposal_id
        AND public.is_workspace_member(proposals.workspace_id)
    )
  );

DROP POLICY IF EXISTS "Workspace members can delete access sessions" ON proposal_access_sessions;
CREATE POLICY "Workspace members can delete access sessions"
  ON proposal_access_sessions FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM proposals
      WHERE proposals.id = proposal_access_sessions.proposal_id
        AND public.is_workspace_member(proposals.workspace_id)
    )
  );

-- Access attempts for rate limiting and audits
CREATE TABLE IF NOT EXISTS proposal_access_attempts (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  proposal_id uuid REFERENCES proposals(id) ON DELETE CASCADE NOT NULL,
  attempt_type text NOT NULL CHECK (attempt_type IN ('password', 'email')),
  success boolean NOT NULL,
  ip_address text,
  email text,
  user_agent text,
  reason text,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_proposal_access_attempts_proposal_id
  ON proposal_access_attempts(proposal_id);
CREATE INDEX IF NOT EXISTS idx_proposal_access_attempts_created_at
  ON proposal_access_attempts(created_at);
CREATE INDEX IF NOT EXISTS idx_proposal_access_attempts_ip_created_at
  ON proposal_access_attempts(ip_address, created_at);

ALTER TABLE proposal_access_attempts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Workspace members can read access attempts" ON proposal_access_attempts;
CREATE POLICY "Workspace members can read access attempts"
  ON proposal_access_attempts FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM proposals
      WHERE proposals.id = proposal_access_attempts.proposal_id
        AND public.is_workspace_member(proposals.workspace_id)
    )
  );

CREATE OR REPLACE FUNCTION public.cleanup_expired_proposal_access_data()
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  DELETE FROM proposal_access_sessions
  WHERE expires_at < now() - interval '7 days';

  DELETE FROM proposal_access_attempts
  WHERE created_at < now() - interval '30 days';
$$;

-- ============================================================
-- Workspaces and team access
-- ============================================================

CREATE TABLE IF NOT EXISTS workspaces (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL DEFAULT 'My Workspace',
  company_name text NOT NULL DEFAULT '',
  brand_theme jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE workspaces ADD COLUMN IF NOT EXISTS company_name text NOT NULL DEFAULT '';
ALTER TABLE workspaces ADD COLUMN IF NOT EXISTS brand_theme jsonb NOT NULL DEFAULT '{}'::jsonb;

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

CREATE OR REPLACE FUNCTION public.bootstrap_workspace(
  owner_name text,
  owner_email text
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  caller_id uuid := auth.uid();
  new_workspace_id uuid;
BEGIN
  IF caller_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Already has a workspace — return it.
  SELECT wm.workspace_id INTO new_workspace_id
  FROM public.workspace_members wm
  WHERE wm.user_id = caller_id
    AND wm.status = 'active'
  LIMIT 1;

  IF new_workspace_id IS NOT NULL THEN
    RETURN new_workspace_id;
  END IF;

  INSERT INTO public.workspaces (created_by, name)
  VALUES (caller_id, COALESCE(NULLIF(trim(owner_name), ''), 'My') || '''s Workspace')
  RETURNING id INTO new_workspace_id;

  INSERT INTO public.workspace_members (workspace_id, user_id, email, role, status)
  VALUES (new_workspace_id, caller_id, lower(trim(owner_email)), 'owner', 'active');

  RETURN new_workspace_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.activate_pending_invites_for_user(
+  target_user_id uuid,
+  target_email text
+)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  activated integer;
BEGIN
  IF target_user_id IS NULL OR target_email IS NULL OR target_email = '' THEN
    RETURN 0;
  END IF;

  IF target_user_id != auth.uid() THEN
    RAISE EXCEPTION 'Cannot activate invites for another user';
  END IF;

  UPDATE public.workspace_members
  SET user_id = target_user_id,
      status = 'active'
  WHERE user_id IS NULL
    AND status = 'pending'
    AND lower(email) = lower(target_email);

  GET DIAGNOSTICS activated = ROW_COUNT;
  RETURN activated;
END;
$$;

DROP POLICY IF EXISTS "Members can read their workspaces" ON workspaces;
CREATE POLICY "Members can read their workspaces"
  ON workspaces FOR SELECT
  USING (
    public.is_workspace_member(id)
    OR created_by = auth.uid()
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
  USING (public.is_workspace_owner(id))
  WITH CHECK (public.is_workspace_owner(id));

DROP POLICY IF EXISTS "Members can read workspace members" ON workspace_members;
CREATE POLICY "Members can read workspace members"
  ON workspace_members FOR SELECT
  USING (public.is_workspace_member(workspace_id));

CREATE OR REPLACE FUNCTION public.is_workspace_creator(target_workspace_id uuid, target_user_id uuid DEFAULT auth.uid())
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.workspaces w
    WHERE w.id = target_workspace_id
      AND w.created_by = target_user_id
  );
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
      AND public.is_workspace_creator(workspace_id)
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
    AND lower(email) = public.current_user_email()
  )
  WITH CHECK (
    user_id = auth.uid()
    AND status = 'active'
    AND lower(email) = public.current_user_email()
  );

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
      VALUES (
        owner_row.user_id,
        'My Workspace'
      )
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
CREATE POLICY "Workspace members can manage workspace proposals"
  ON proposals FOR ALL
  USING (public.is_workspace_member(workspace_id))
  WITH CHECK (public.is_workspace_member(workspace_id));

ALTER TABLE proposals
  ADD COLUMN IF NOT EXISTS updated_by uuid REFERENCES auth.users(id) ON DELETE SET NULL;

-- ============================================================
-- Proposal version snapshots
-- ============================================================

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

-- ============================================================
-- Propagate company name to all workspace proposals
-- ============================================================

CREATE OR REPLACE FUNCTION public.update_workspace_company_name(
  target_workspace_id uuid,
  new_company_name text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_workspace_owner(target_workspace_id) THEN
    RAISE EXCEPTION 'Only workspace owners can update the company name';
  END IF;

  UPDATE proposals
  SET brand_overrides = COALESCE(brand_overrides, '{}'::jsonb) || jsonb_build_object('companyName', new_company_name)
  WHERE workspace_id = target_workspace_id;
END;
$$;

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
-- Proposal Analytics
-- ============================================================

CREATE TABLE IF NOT EXISTS proposal_views (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  proposal_id uuid REFERENCES proposals(id) ON DELETE CASCADE NOT NULL,
  visitor_id text NOT NULL,
  session_id text UNIQUE NOT NULL,
  device_type text CHECK (device_type IN ('desktop', 'mobile', 'tablet')),
  browser text,
  os text,
  country text,
  city text,
  referrer text,
  user_agent text,
  slides_total int NOT NULL DEFAULT 0,
  max_slide_reached int NOT NULL DEFAULT 0,
  duration_ms int NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_proposal_views_proposal_id ON proposal_views(proposal_id);
CREATE INDEX IF NOT EXISTS idx_proposal_views_created_at ON proposal_views(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_proposal_views_visitor_id ON proposal_views(visitor_id);

ALTER TABLE proposal_views ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Workspace members can read proposal views"
  ON proposal_views FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM proposals
      WHERE proposals.id = proposal_views.proposal_id
        AND public.is_workspace_member(proposals.workspace_id)
    )
  );

CREATE TABLE IF NOT EXISTS proposal_slide_events (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  view_id uuid REFERENCES proposal_views(id) ON DELETE CASCADE NOT NULL,
  proposal_id uuid REFERENCES proposals(id) ON DELETE CASCADE NOT NULL,
  slide_index int NOT NULL,
  slide_type text,
  dwell_time_ms int NOT NULL DEFAULT 0,
  entered_at timestamptz NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_proposal_slide_events_view_id ON proposal_slide_events(view_id);
CREATE INDEX IF NOT EXISTS idx_proposal_slide_events_proposal_id ON proposal_slide_events(proposal_id);

ALTER TABLE proposal_slide_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Workspace members can read proposal slide events"
  ON proposal_slide_events FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM proposals
      WHERE proposals.id = proposal_slide_events.proposal_id
        AND public.is_workspace_member(proposals.workspace_id)
    )
  );

CREATE OR REPLACE FUNCTION public.cleanup_old_proposal_slide_events()
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  DELETE FROM proposal_slide_events
  WHERE entered_at < now() - interval '90 days';
$$;

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

-- ============================================================
-- Stripe billing — workspace subscriptions
-- ============================================================

CREATE TABLE IF NOT EXISTS workspace_subscriptions (
  workspace_id            UUID PRIMARY KEY REFERENCES workspaces(id) ON DELETE CASCADE,
  stripe_customer_id      TEXT NOT NULL UNIQUE,
  stripe_subscription_id  TEXT UNIQUE,
  plan_tier               TEXT NOT NULL DEFAULT 'free'
                            CHECK (plan_tier IN ('free', 'pro', 'team')),
  status                  TEXT NOT NULL DEFAULT 'inactive'
                            CHECK (status IN (
                              'inactive', 'trialing', 'active', 'past_due',
                              'canceled', 'incomplete', 'incomplete_expired',
                              'unpaid', 'paused'
                            )),
  price_id                TEXT,
  current_period_end      TIMESTAMPTZ,
  cancel_at_period_end    BOOLEAN NOT NULL DEFAULT false,
  trial_end               TIMESTAMPTZ,
  latest_event_id         TEXT,
  latest_event_at         TIMESTAMPTZ,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ws_subs_stripe_customer_id
  ON workspace_subscriptions(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_ws_subs_stripe_subscription_id
  ON workspace_subscriptions(stripe_subscription_id);

ALTER TABLE workspace_subscriptions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Members can read workspace subscription"
  ON workspace_subscriptions;
CREATE POLICY "Members can read workspace subscription"
  ON workspace_subscriptions FOR SELECT
  USING (public.is_workspace_member(workspace_id));

DROP TRIGGER IF EXISTS workspace_subscriptions_updated_at ON workspace_subscriptions;
CREATE TRIGGER workspace_subscriptions_updated_at
  BEFORE UPDATE ON workspace_subscriptions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TABLE IF NOT EXISTS stripe_webhook_events (
  event_id     TEXT PRIMARY KEY,
  type         TEXT NOT NULL,
  received_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE stripe_webhook_events ENABLE ROW LEVEL SECURITY;
-- No policies: service-role only.

CREATE OR REPLACE FUNCTION public.workspace_plan_tier(target_workspace_id UUID)
RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (
      SELECT plan_tier
      FROM workspace_subscriptions
      WHERE workspace_id = target_workspace_id
        AND status IN ('trialing', 'active', 'past_due')
    ),
    'free'
  );
$$;
