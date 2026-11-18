-- =============================================================================
-- ArivuPro Finance Career Portal — Add logo_url to recruiter_profiles
-- Run after 003_recruiters.sql
-- =============================================================================

alter table recruiter_profiles
  add column if not exists logo_url text;
