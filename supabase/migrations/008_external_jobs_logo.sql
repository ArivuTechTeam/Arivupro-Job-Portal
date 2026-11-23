-- =============================================================================
-- ArivuPro Finance Career Portal — Add logo_url to external_jobs
-- Run after 007_arivupro_batches.sql
-- Purpose: store company logos fetched during scraping; reuse for same company
-- =============================================================================

alter table external_jobs
  add column if not exists logo_url text;

-- Index so the scraper can quickly look up existing logos by company name
create index if not exists idx_external_jobs_company_logo
  on external_jobs (company)
  where logo_url is not null;
