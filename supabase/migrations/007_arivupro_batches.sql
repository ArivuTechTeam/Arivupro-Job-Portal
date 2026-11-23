-- =============================================================================
-- ArivuPro Finance Career Portal — ArivuPro batch dates (live from website)
-- Run in Supabase Dashboard → SQL Editor after 006_recruiter_logo.sql
-- =============================================================================

-- -------------------------
-- TABLE
-- -------------------------
create table if not exists arivupro_batches (
  id           uuid primary key default gen_random_uuid(),
  course       text not null,          -- e.g. 'CA', 'CMA USA', 'ACCA', 'CS'
  level        text,                   -- e.g. 'foundation', 'intermediate', 'executive'
  city         text,                   -- e.g. 'Bengaluru', 'Chennai', 'Online'
  mode         text,                   -- e.g. 'f2f live', 'online'
  start_date   date not null,          -- parsed from data-start ISO attribute
  schedule     text,                   -- human schedule text e.g. "Mon-Sun 7:30 AM – 12:30 PM"
  batch_label  text,                   -- full pipe-split label from data-batch
  course_url   text,                   -- canonical arivupro.com course page URL
  scraped_at   timestamptz not null default now(),
  created_at   timestamptz not null default now()
);

-- Dedup: same course+city+start_date is one batch
create unique index if not exists uq_arivupro_batches
  on arivupro_batches (course, coalesce(city, ''), start_date);

-- Fast portal queries
create index if not exists idx_arivupro_batches_course
  on arivupro_batches (course);

create index if not exists idx_arivupro_batches_start
  on arivupro_batches (start_date);

-- -------------------------
-- RLS
-- -------------------------
alter table arivupro_batches enable row level security;

drop policy if exists "public read arivupro_batches" on arivupro_batches;
create policy "public read arivupro_batches"
  on arivupro_batches for select
  using (start_date >= current_date);  -- only future/today batches visible

drop policy if exists "service_role all arivupro_batches" on arivupro_batches;
create policy "service_role all arivupro_batches"
  on arivupro_batches for all
  to service_role
  using (true)
  with check (true);
