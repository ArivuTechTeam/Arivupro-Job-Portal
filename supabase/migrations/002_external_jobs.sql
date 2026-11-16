-- =============================================================================
-- ArivuPro Finance Career Portal — External Jobs Table
-- Run after 001_initial_schema.sql
-- =============================================================================

-- External Jobs: scraped from free sources (caclubindia, icai_*, buddingca, etc.)
create table if not exists external_jobs (
  id                  uuid        primary key default gen_random_uuid(),
  source              text        not null,
  external_id         text        not null,
  title               text        not null,
  company             text        not null default '',
  location            text        not null default '',
  stipend             integer,
  duration            text,
  courses             text[],
  job_type            text        not null default 'job',
  apply_url           text        not null default '',
  description         text,
  is_remote           boolean     not null default false,
  posted_at           timestamptz not null default now(),
  is_active           boolean     not null default true,
  content_fingerprint text,
  raw_data            text,
  experience_level    text,
  created_at          timestamptz not null default now(),

  unique (source, external_id)
);

create index if not exists idx_ext_jobs_fingerprint on external_jobs (content_fingerprint);
create index if not exists idx_ext_jobs_active_posted on external_jobs (is_active, posted_at desc);
create index if not exists idx_ext_jobs_source       on external_jobs (source);
create index if not exists idx_ext_jobs_job_type     on external_jobs (job_type);

-- Row Level Security
alter table external_jobs enable row level security;

drop policy if exists "public read active external jobs" on external_jobs;
create policy "public read active external jobs"
  on external_jobs for select
  using (is_active = true);

drop policy if exists "service role full access external_jobs" on external_jobs;
create policy "service role full access external_jobs"
  on external_jobs for all
  using (auth.role() = 'service_role');
