-- =============================================================================
-- ArivuPro Finance Career Portal — Initial Schema
-- Run this in Supabase Dashboard → SQL Editor
-- =============================================================================

-- -------------------------
-- ENUMS
-- -------------------------
do $$ begin
  create type job_type as enum ('full-time', 'internship', 'articleship', 'trainee');
exception when duplicate_object then null; end $$;

do $$ begin
  create type workplace_type as enum ('onsite', 'hybrid', 'remote');
exception when duplicate_object then null; end $$;

do $$ begin
  create type job_status as enum ('draft', 'active', 'closed', 'expired');
exception when duplicate_object then null; end $$;

do $$ begin
  create type application_stage as enum (
    'applied', 'arivupro_review', 'recruiter_screen',
    'technical_round', 'partner_interview', 'offer_released', 'placed', 'declined'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type lead_status as enum ('new', 'contacted', 'qualified', 'converted', 'rejected');
exception when duplicate_object then null; end $$;

do $$ begin
  create type sync_status as enum ('running', 'ok', 'error');
exception when duplicate_object then null; end $$;

do $$ begin
  create type crm_sync_status as enum ('synced', 'pending', 'syncing');
exception when duplicate_object then null; end $$;

do $$ begin
  create type verification_status as enum ('verified', 'pending', 'mou_partner');
exception when duplicate_object then null; end $$;

do $$ begin
  create type admin_role as enum ('super_admin', 'admin', 'counselor');
exception when duplicate_object then null; end $$;

-- -------------------------
-- JOBS TABLE
-- -------------------------
create table if not exists jobs (
  id                    uuid primary key default gen_random_uuid(),
  title                 text not null,
  company               text not null,
  logo_url              text,
  location              text not null,
  city                  text,
  workplace_type        workplace_type not null default 'onsite',
  job_type              job_type not null default 'full-time',
  experience_level      text not null default '0-1 yr (Fresher)',
  min_experience_years  int not null default 0,
  salary_text           text,
  salary_min_lpa        numeric(6,2),
  salary_max_lpa        numeric(6,2),
  stipend_monthly       int,                      -- for internship/articleship (₹)
  duration              text,                     -- e.g. "2 years", "6 months"
  qualifications        text[] not null default '{}',
  mandatory_skills      text[] not null default '{}',
  good_to_have_skills   text[] not null default '{}',
  description           text,
  key_responsibilities  text[] not null default '{}',
  department            text,
  source                text not null default 'arivupro_exclusive',
  source_url            text,
  external_id           text,                     -- id from external source
  content_fingerprint   text,                     -- SHA256 for dedup
  arivupro_exclusive    boolean not null default false,
  is_urgent             boolean not null default false,
  is_featured           boolean not null default false,
  status                job_status not null default 'draft',
  posted_date           timestamptz not null default now(),
  deadline_date         timestamptz,
  applicants_count      int not null default 0,
  crm_drive_code        text,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now(),

  -- Dedup constraint: same external job can't appear twice from same source
  unique (source, external_id)
);

create index if not exists idx_jobs_status       on jobs(status);
create index if not exists idx_jobs_job_type     on jobs(job_type);
create index if not exists idx_jobs_source       on jobs(source);
create index if not exists idx_jobs_posted_date  on jobs(posted_date desc);
create index if not exists idx_jobs_fingerprint  on jobs(content_fingerprint);

-- -------------------------
-- STUDENT LEADS (Applications)
-- -------------------------
create table if not exists student_leads (
  id                  uuid primary key default gen_random_uuid(),
  job_id              uuid references jobs(id) on delete set null,
  job_title           text,
  company             text,
  student_name        text not null,
  student_email       text not null,
  student_phone       text not null,
  student_id          text,
  primary_course      text,
  resume_url          text,
  ai_match_score      int,
  match_grade         text,
  stage               application_stage not null default 'applied',
  status              lead_status not null default 'new',
  assigned_counselor  text,
  interview_date      timestamptz,
  interview_notes     text,
  crm_lead_id         text,
  crm_sync_status     crm_sync_status not null default 'pending',
  notes               text,
  timeline            jsonb not null default '[]',
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

create index if not exists idx_student_leads_job_id on student_leads(job_id);
create index if not exists idx_student_leads_stage  on student_leads(stage);
create index if not exists idx_student_leads_status on student_leads(status);
create index if not exists idx_student_leads_email  on student_leads(student_email);

-- -------------------------
-- COMPANY LEADS (Recruiters)
-- -------------------------
create table if not exists company_leads (
  id                  uuid primary key default gen_random_uuid(),
  company_name        text not null,
  legal_name          text,
  website             text,
  contact_person      text not null,
  work_email          text not null,
  phone               text,
  industry            text,
  cin_or_gstin        text,
  verification_status verification_status not null default 'pending',
  active_jobs_count   int not null default 0,
  notes               text,
  status              lead_status not null default 'new',
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

create index if not exists idx_company_leads_status on company_leads(status);
create index if not exists idx_company_leads_email  on company_leads(work_email);

-- -------------------------
-- SYNC RUNS (Scraper audit log)
-- -------------------------
create table if not exists sync_runs (
  id          uuid primary key default gen_random_uuid(),
  source      text not null,
  started_at  timestamptz not null default now(),
  finished_at timestamptz,
  status      sync_status not null default 'running',
  fetched     int not null default 0,
  created     int not null default 0,
  updated     int not null default 0,
  duplicates  int not null default 0,
  skipped     int not null default 0,
  error_msg   text
);

create index if not exists idx_sync_runs_source on sync_runs(source);
create index if not exists idx_sync_runs_started on sync_runs(started_at desc);

-- -------------------------
-- ADMIN USERS
-- -------------------------
create table if not exists admin_users (
  id         uuid primary key references auth.users(id) on delete cascade,
  email      text not null unique,
  name       text not null,
  role       admin_role not null default 'admin',
  created_at timestamptz not null default now()
);

-- -------------------------
-- AUTO-UPDATE updated_at
-- -------------------------
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_jobs_updated_at on jobs;
create trigger trg_jobs_updated_at
  before update on jobs
  for each row execute function update_updated_at();

drop trigger if exists trg_student_leads_updated_at on student_leads;
create trigger trg_student_leads_updated_at
  before update on student_leads
  for each row execute function update_updated_at();

drop trigger if exists trg_company_leads_updated_at on company_leads;
create trigger trg_company_leads_updated_at
  before update on company_leads
  for each row execute function update_updated_at();

-- -------------------------
-- STORAGE BUCKETS
-- -------------------------
insert into storage.buckets (id, name, public)
values
  ('resumes',   'resumes',   false),
  ('job-logos', 'job-logos', true),
  ('job-docs',  'job-docs',  false)
on conflict (id) do nothing;

-- -------------------------
-- ROW LEVEL SECURITY
-- -------------------------

-- Jobs: public can read active jobs, only service role can write
alter table jobs enable row level security;

drop policy if exists "public read active jobs" on jobs;
create policy "public read active jobs"
  on jobs for select
  using (status = 'active');

drop policy if exists "service role full access jobs" on jobs;
create policy "service role full access jobs"
  on jobs for all
  using (auth.role() = 'service_role');

-- Student leads: only service role (admin) can read, public can insert
alter table student_leads enable row level security;

drop policy if exists "public can apply" on student_leads;
create policy "public can apply"
  on student_leads for insert
  with check (true);

drop policy if exists "service role full access student_leads" on student_leads;
create policy "service role full access student_leads"
  on student_leads for all
  using (auth.role() = 'service_role');

-- Company leads: same as student leads
alter table company_leads enable row level security;

drop policy if exists "public can register company" on company_leads;
create policy "public can register company"
  on company_leads for insert
  with check (true);

drop policy if exists "service role full access company_leads" on company_leads;
create policy "service role full access company_leads"
  on company_leads for all
  using (auth.role() = 'service_role');

-- Sync runs: service role only
alter table sync_runs enable row level security;

drop policy if exists "service role full access sync_runs" on sync_runs;
create policy "service role full access sync_runs"
  on sync_runs for all
  using (auth.role() = 'service_role');

-- Admin users: authenticated admins can read their own row
alter table admin_users enable row level security;

drop policy if exists "admin can read own record" on admin_users;
create policy "admin can read own record"
  on admin_users for select
  using (auth.uid() = id);

drop policy if exists "service role full access admin_users" on admin_users;
create policy "service role full access admin_users"
  on admin_users for all
  using (auth.role() = 'service_role');

-- Storage policies
drop policy if exists "public read job logos" on storage.objects;
create policy "public read job logos"
  on storage.objects for select
  using (bucket_id = 'job-logos');

drop policy if exists "service role upload logos" on storage.objects;
create policy "service role upload logos"
  on storage.objects for insert
  with check (bucket_id = 'job-logos' and auth.role() = 'service_role');

drop policy if exists "service role read resumes" on storage.objects;
create policy "service role read resumes"
  on storage.objects for select
  using (bucket_id = 'resumes' and auth.role() = 'service_role');

drop policy if exists "public upload resumes" on storage.objects;
create policy "public upload resumes"
  on storage.objects for insert
  with check (bucket_id = 'resumes');

drop policy if exists "service role read job docs" on storage.objects;
create policy "service role read job docs"
  on storage.objects for select
  using (bucket_id = 'job-docs' and auth.role() = 'service_role');

drop policy if exists "public upload job docs" on storage.objects;
create policy "public upload job docs"
  on storage.objects for insert
  with check (bucket_id = 'job-docs');
