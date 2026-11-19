create table public.jobs (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.school_profiles (id) on delete cascade,
  title text not null check (char_length(trim(title)) between 4 and 120),
  subject text not null check (char_length(trim(subject)) between 2 and 80),
  school_level text not null check (school_level in ('primary', 'secondary', 'both')),
  employment_type text not null default 'full-time'
    check (employment_type in ('full-time', 'part-time', 'contract')),
  state text not null,
  city text not null,
  salary_min integer check (salary_min is null or salary_min >= 0),
  salary_max integer check (salary_max is null or salary_max >= 0),
  description text not null check (char_length(trim(description)) between 30 and 5000),
  requirements text,
  application_deadline date,
  status text not null default 'draft' check (status in ('draft', 'published', 'closed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint jobs_salary_range_valid check (
    salary_min is null or salary_max is null or salary_max >= salary_min
  )
);

create index jobs_public_feed_idx on public.jobs (created_at desc)
  where status = 'published';
create index jobs_school_status_idx on public.jobs (school_id, status, created_at desc);

create table public.applications (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references public.jobs (id) on delete cascade,
  teacher_id uuid not null references public.teacher_profiles (id) on delete cascade,
  cover_note text check (cover_note is null or char_length(cover_note) <= 2000),
  status text not null default 'submitted'
    check (status in ('submitted', 'reviewing', 'interview', 'declined', 'accepted')),
  created_at timestamptz not null default now(),
  unique (job_id, teacher_id)
);

create index applications_job_idx on public.applications (job_id, created_at desc);
create index applications_teacher_idx on public.applications (teacher_id, created_at desc);

alter table public.jobs enable row level security;
alter table public.applications enable row level security;

grant select on public.jobs to anon, authenticated;
grant insert, update, delete on public.jobs to authenticated;
grant select, insert on public.applications to authenticated;

create policy "Anyone can view published jobs from approved schools"
  on public.jobs for select to anon, authenticated
  using (
    status = 'published'
    and exists (
      select 1 from public.school_profiles as schools
      where schools.id = school_id and schools.verification_status = 'approved'
    )
  );

create policy "Schools can view their own jobs"
  on public.jobs for select to authenticated
  using (school_id = (select auth.uid()));

create policy "Schools can create jobs for their school"
  on public.jobs for insert to authenticated
  with check (
    school_id = (select auth.uid())
    and exists (
      select 1 from public.school_profiles as schools
      where schools.id = (select auth.uid())
        and (status = 'draft' or schools.verification_status = 'approved')
    )
  );

create policy "Schools can update their own jobs"
  on public.jobs for update to authenticated
  using (school_id = (select auth.uid()))
  with check (
    school_id = (select auth.uid())
    and exists (
      select 1 from public.school_profiles as schools
      where schools.id = (select auth.uid())
        and (status = 'draft' or schools.verification_status = 'approved')
    )
  );

create policy "Schools can delete their own jobs"
  on public.jobs for delete to authenticated
  using (school_id = (select auth.uid()));

create policy "Teachers can view their own applications"
  on public.applications for select to authenticated
  using (teacher_id = (select auth.uid()));

create policy "Schools can view applications to their jobs"
  on public.applications for select to authenticated
  using (
    exists (
      select 1 from public.jobs
      where jobs.id = job_id and jobs.school_id = (select auth.uid())
    )
  );

create policy "Teachers can apply to published jobs"
  on public.applications for insert to authenticated
  with check (
    teacher_id = (select auth.uid())
    and exists (
      select 1 from public.jobs
      where jobs.id = job_id and jobs.status = 'published'
    )
  );
