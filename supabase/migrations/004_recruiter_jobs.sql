-- Add recruiter_profile_id to jobs table so recruiter-posted jobs can be filtered by owner
alter table jobs
  add column if not exists recruiter_profile_id uuid references recruiter_profiles(id) on delete set null;

create index if not exists idx_jobs_recruiter on jobs(recruiter_profile_id);
