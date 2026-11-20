grant update on public.applications to authenticated;

create policy "Schools update application stages for their jobs" on public.applications
  for update to authenticated
  using (exists (
    select 1 from public.jobs j
    where j.id = applications.job_id and j.school_id = (select auth.uid())
  ))
  with check (exists (
    select 1 from public.jobs j
    where j.id = applications.job_id and j.school_id = (select auth.uid())
  ));

create policy "Schools read teacher profiles of their applicants" on public.teacher_profiles
  for select to authenticated
  using (id = (select auth.uid()) or exists (
    select 1 from public.applications a join public.jobs j on j.id = a.job_id
    where a.teacher_id = teacher_profiles.id and j.school_id = (select auth.uid())
  ));

create policy "Schools read contact names of their applicants" on public.profiles
  for select to authenticated
  using (id = (select auth.uid()) or exists (
    select 1 from public.applications a join public.jobs j on j.id = a.job_id
    where a.teacher_id = profiles.id and j.school_id = (select auth.uid())
  ));
