-- Migration 011: track external job clicks per student
-- Run manually in the Supabase dashboard (service-role writes, no insert policy needed).

create table if not exists student_external_applications (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid not null references auth.users(id) on delete cascade,
  external_job_id  uuid not null references external_jobs(id) on delete cascade,
  job_title        text,
  company          text,
  location         text,
  apply_url        text not null,
  opened_at        timestamptz not null default now(),
  constraint student_external_apps_unique unique (user_id, external_job_id)
);

alter table student_external_applications enable row level security;

create policy "student reads own external applications"
  on student_external_applications
  for select
  using (auth.uid() = user_id);
