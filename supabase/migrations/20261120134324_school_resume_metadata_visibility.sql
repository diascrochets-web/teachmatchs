create policy "Schools read resume metadata for their applicants" on public.teacher_resumes
  for select to authenticated using (
    teacher_id = (select auth.uid()) or exists (
      select 1 from public.applications a join public.jobs j on j.id = a.job_id
      where a.teacher_id = teacher_resumes.teacher_id and j.school_id = (select auth.uid())
    )
  );
