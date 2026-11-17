-- ============================================================
-- ArivuPro Finance Career Portal — Scraper Tables
-- Run this in Supabase SQL Editor (Dashboard → SQL Editor → New Query)
-- ============================================================

-- External Jobs: scraped from free sources
CREATE TABLE IF NOT EXISTS external_jobs (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source              text NOT NULL,         -- caclubindia | icai_eirc | icai_sirc | ...
  external_id         text NOT NULL,         -- stable ID within that source
  title               text NOT NULL,
  company             text NOT NULL DEFAULT '',
  location            text NOT NULL DEFAULT '',
  stipend             integer NOT NULL DEFAULT 0,  -- monthly in INR, 0 = unknown
  duration            text NOT NULL DEFAULT '',
  courses             jsonb NOT NULL DEFAULT '[]', -- ["CA","ACCA",...]
  job_type            text NOT NULL DEFAULT 'job', -- 'articleship' | 'job'
  experience_level    text,                        -- 'fresher' | '0-1 year' | '1-3 years'
  apply_url           text NOT NULL DEFAULT '',
  description         text,
  is_remote           boolean NOT NULL DEFAULT false,
  posted_at           timestamptz NOT NULL DEFAULT now(),
  fetched_at          timestamptz NOT NULL DEFAULT now(),
  is_active           boolean NOT NULL DEFAULT true,
  content_fingerprint text,                        -- SHA-256 for cross-source dedup
  raw_data            text,

  UNIQUE (source, external_id)
);

CREATE INDEX IF NOT EXISTS idx_ext_jobs_source       ON external_jobs (source);
CREATE INDEX IF NOT EXISTS idx_ext_jobs_is_active    ON external_jobs (is_active);
CREATE INDEX IF NOT EXISTS idx_ext_jobs_job_type     ON external_jobs (job_type);
CREATE INDEX IF NOT EXISTS idx_ext_jobs_fingerprint  ON external_jobs (content_fingerprint);
CREATE INDEX IF NOT EXISTS idx_ext_jobs_posted_at    ON external_jobs (posted_at DESC);

-- sync_runs is already defined in 001_initial_schema.sql
-- Adding duration_ms column if it was not in the original schema
ALTER TABLE sync_runs ADD COLUMN IF NOT EXISTS duration_ms integer;

CREATE INDEX IF NOT EXISTS idx_sync_runs_source     ON sync_runs (source);
CREATE INDEX IF NOT EXISTS idx_sync_runs_started_at ON sync_runs (started_at DESC);

-- Expire jobs older than 45 days (run via pg_cron if available, else manual)
-- SELECT cron.schedule('expire-external-jobs', '0 2 * * *',
--   $$UPDATE external_jobs SET is_active = false
--     WHERE is_active = true AND posted_at < now() - interval '45 days'$$);
