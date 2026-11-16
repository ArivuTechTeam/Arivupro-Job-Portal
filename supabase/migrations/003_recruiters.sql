-- =============================================================================
-- ArivuPro Finance Career Portal — Recruiter Profiles
-- Run after 001_initial_schema.sql
-- =============================================================================

do $$ begin
  create type recruiter_approval_status as enum ('pending', 'approved', 'rejected');
exception when duplicate_object then null; end $$;

create table if not exists recruiter_profiles (
  id                  uuid primary key default gen_random_uuid(),
  auth_user_id        uuid unique references auth.users(id) on delete cascade,
  full_name           text not null,
  email               text not null,
  phone               text,
  company_name        text not null,
  company_website     text,
  company_domain      text,
  office_address      text,
  city                text,
  state               text,
  cin                 text,
  gstin               text,
  linkedin_page       text,
  approval_status     recruiter_approval_status not null default 'pending',
  approved_by         uuid references auth.users(id),
  approved_at         timestamptz,
  rejection_reason    text,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

create index if not exists idx_recruiter_profiles_auth_user on recruiter_profiles(auth_user_id);
create index if not exists idx_recruiter_profiles_status    on recruiter_profiles(approval_status);
create index if not exists idx_recruiter_profiles_email     on recruiter_profiles(email);

-- RLS: recruiters can read their own row; admins read all via service role
alter table recruiter_profiles enable row level security;

create policy "recruiter_read_own" on recruiter_profiles
  for select using (auth.uid() = auth_user_id);

-- Insert is handled server-side (service role) — no public insert policy needed
