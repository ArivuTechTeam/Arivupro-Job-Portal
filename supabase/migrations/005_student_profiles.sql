-- =============================================================================
-- ArivuPro Finance Career Portal — Student Profiles + Saved Jobs
-- Run after 004_recruiter_jobs.sql
-- Purpose: persist student profile data to DB; track saved jobs server-side
-- =============================================================================

-- -------------------------
-- STUDENT PROFILES
-- One row per authenticated student (auth.users FK)
-- -------------------------
create table if not exists student_profiles (
  id                        uuid primary key references auth.users(id) on delete cascade,
  full_name                 text,
  phone                     text,
  primary_course            text,
  current_level             text,
  qualifications_completed  text[]        not null default '{}',
  articleship_months        int           not null default 0,
  key_skills                text[]        not null default '{}',
  preferred_locations       text[]        not null default '{}',
  expected_salary_lpa       text,
  target_roles              text[]        not null default '{}',
  about_bio                 text,
  resume_url                text,
  arivupro_student_id       text,
  enrollment_cohort         text,
  verified_student          boolean       not null default false,
  created_at                timestamptz   not null default now(),
  updated_at                timestamptz   not null default now()
);

create index if not exists idx_student_profiles_course on student_profiles(primary_course);

-- Auto-update updated_at
drop trigger if exists trg_student_profiles_updated_at on student_profiles;
create trigger trg_student_profiles_updated_at
  before update on student_profiles
  for each row execute function update_updated_at();

-- RLS: students can only read/write their own row
alter table student_profiles enable row level security;

drop policy if exists "student_read_own_profile" on student_profiles;
create policy "student_read_own_profile"
  on student_profiles for select
  using (auth.uid() = id);

drop policy if exists "student_write_own_profile" on student_profiles;
create policy "student_write_own_profile"
  on student_profiles for all
  using (auth.uid() = id)
  with check (auth.uid() = id);

drop policy if exists "service_role_full_access_student_profiles" on student_profiles;
create policy "service_role_full_access_student_profiles"
  on student_profiles for all
  using (auth.role() = 'service_role');

-- -------------------------
-- SAVED JOBS
-- Students save both internal (jobs table) and external (external_jobs table) jobs
-- -------------------------
create table if not exists saved_jobs (
  id                uuid          primary key default gen_random_uuid(),
  user_id           uuid          not null references auth.users(id) on delete cascade,
  -- One of these is set, not both
  job_id            uuid          references jobs(id) on delete cascade,
  external_job_id   uuid          references external_jobs(id) on delete cascade,
  -- Denormalized for fast display without join
  job_title         text          not null default '',
  company           text          not null default '',
  location          text          not null default '',
  job_type          text          not null default 'job',
  source            text          not null default '',
  apply_url         text          not null default '',
  saved_at          timestamptz   not null default now(),

  -- Prevent saving the same job twice
  constraint saved_jobs_internal_unique unique (user_id, job_id),
  constraint saved_jobs_external_unique unique (user_id, external_job_id),
  -- At least one job reference must be set
  constraint saved_jobs_has_ref check (job_id is not null or external_job_id is not null)
);

create index if not exists idx_saved_jobs_user    on saved_jobs(user_id);
create index if not exists idx_saved_jobs_saved   on saved_jobs(saved_at desc);

-- RLS: students can only read/write their own saved jobs
alter table saved_jobs enable row level security;

drop policy if exists "student_manage_own_saved_jobs" on saved_jobs;
create policy "student_manage_own_saved_jobs"
  on saved_jobs for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "service_role_full_access_saved_jobs" on saved_jobs;
create policy "service_role_full_access_saved_jobs"
  on saved_jobs for all
  using (auth.role() = 'service_role');

-- -------------------------
-- STUDENT APPLICATIONS — add user_id FK so students can query their own
-- -------------------------
alter table student_leads
  add column if not exists user_id uuid references auth.users(id) on delete set null;

create index if not exists idx_student_leads_user_id on student_leads(user_id);

-- Allow students to read their own applications (by user_id)
drop policy if exists "student_read_own_applications" on student_leads;
create policy "student_read_own_applications"
  on student_leads for select
  using (auth.uid() = user_id);
