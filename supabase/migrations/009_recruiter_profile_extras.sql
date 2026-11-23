-- =============================================================================
-- ArivuPro Finance Career Portal — Recruiter profile extra fields
-- Run after 006_recruiter_logo.sql
-- =============================================================================

alter table recruiter_profiles
  add column if not exists company_summary  text,
  add column if not exists founded_year     int,
  add column if not exists company_size     text,
  add column if not exists firm_type        text;

-- company_domain, office_address, linkedin_page already exist from migration 003
-- logo_url already exists from migration 006
-- No destructive changes — safe to re-run
