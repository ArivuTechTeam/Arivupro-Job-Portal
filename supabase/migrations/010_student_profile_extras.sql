-- =============================================================================
-- ArivuPro Finance Career Portal — Student profile extra fields
-- Run after 005_student_profiles.sql
-- =============================================================================

alter table student_profiles
  add column if not exists attempt_count         text,          -- 'first' | 'second' | 'multiple'
  add column if not exists icitss_completed      boolean        not null default false,
  add column if not exists articleship_firm      text,          -- e.g. "Deloitte India"
  add column if not exists articleship_firm_type text,          -- 'Big 4' | 'Mid-tier' | 'Small firm'
  add column if not exists articleship_areas     text[]         not null default '{}',
  add column if not exists graduation_percent    text,          -- e.g. "78.5"
  add column if not exists twelfth_percent       text,          -- 10+2 percentage
  add column if not exists graduation_degree     text,          -- e.g. "B.Com"
  add column if not exists graduation_college    text,
  add column if not exists graduation_year       int,
  add column if not exists joining_availability  text,          -- e.g. "Immediate" | "1 month" | "2 months"
  add column if not exists willing_to_relocate   boolean        not null default true,
  add column if not exists linkedin_url          text,
  add column if not exists work_experience       jsonb          not null default '[]',
  add column if not exists internship_experience jsonb          not null default '[]',
  add column if not exists projects              jsonb          not null default '[]',
  add column if not exists certifications        jsonb          not null default '[]';

-- work_experience row shape:  { company, role, start_month, end_month, description }
-- internship_experience row:  { company, role, start_month, end_month, stipend, description }
-- projects row:               { title, role, outcome, url }
-- certifications row:         { name, issuer, year }
