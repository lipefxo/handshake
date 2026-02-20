-- ============================================================
-- Handshake — Security Hardening SQL
-- Run this in Supabase SQL Editor after schema.sql
-- ============================================================

-- ------------------------------------------------------------
-- 1) Proposals RLS: replace broad FOR ALL policy with explicit policies
-- ------------------------------------------------------------
drop policy if exists "Users can manage their own proposals" on public.proposals;
drop policy if exists "Published proposals are publicly readable" on public.proposals;
drop policy if exists "Users can read own proposals" on public.proposals;
drop policy if exists "Anyone can read published proposals" on public.proposals;
drop policy if exists "Users can create own proposals" on public.proposals;
drop policy if exists "Users can update own proposals" on public.proposals;
drop policy if exists "Users can delete own proposals" on public.proposals;

create policy "Users can read own proposals"
  on public.proposals
  for select
  using (auth.uid() = user_id);

create policy "Anyone can read published proposals"
  on public.proposals
  for select
  using (status = 'published');

create policy "Users can create own proposals"
  on public.proposals
  for insert
  with check (auth.uid() = user_id);

create policy "Users can update own proposals"
  on public.proposals
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete own proposals"
  on public.proposals
  for delete
  using (auth.uid() = user_id);

-- ------------------------------------------------------------
-- 2) Storage policies: explicit update/delete to owner folder only
-- ------------------------------------------------------------
drop policy if exists "Users can manage their own assets" on storage.objects;
drop policy if exists "Users can update their own files" on storage.objects;
drop policy if exists "Users can delete their own files" on storage.objects;

create policy "Users can update their own files"
  on storage.objects
  for update
  using (
    bucket_id = 'proposal-assets'
    and auth.role() = 'authenticated'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "Users can delete their own files"
  on storage.objects
  for delete
  using (
    bucket_id = 'proposal-assets'
    and auth.role() = 'authenticated'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- ------------------------------------------------------------
-- 3) Restrict signup to approved email domains
-- ------------------------------------------------------------
create or replace function public.check_allowed_email()
returns trigger
language plpgsql
security definer
as $$
declare
  allowed_domains text[] := array['securebags.com'];
  user_domain text;
begin
  user_domain := split_part(new.email, '@', 2);

  if not (user_domain = any(allowed_domains)) then
    raise exception 'Email domain not allowed: %', user_domain;
  end if;

  return new;
end;
$$;

drop trigger if exists enforce_email_domain on auth.users;
create trigger enforce_email_domain
  before insert on auth.users
  for each row
  execute function public.check_allowed_email();

-- ------------------------------------------------------------
-- 4) Deletion cleanup notification hook for storage cleanup worker
-- ------------------------------------------------------------
create or replace function public.cleanup_proposal_assets()
returns trigger
language plpgsql
security definer
as $$
begin
  perform pg_notify(
    'proposal_deleted',
    json_build_object(
      'user_id', old.user_id,
      'proposal_id', old.id
    )::text
  );
  return old;
end;
$$;

drop trigger if exists on_proposal_delete on public.proposals;
create trigger on_proposal_delete
  after delete on public.proposals
  for each row
  execute function public.cleanup_proposal_assets();
