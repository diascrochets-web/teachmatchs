-- Candidate-facing features and school hiring workflow.
alter table public.profiles add column if not exists is_admin boolean not null default false;

create table public.saved_jobs (
  teacher_id uuid not null references public.teacher_profiles (id) on delete cascade,
  job_id uuid not null references public.jobs (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (teacher_id, job_id)
);

create table public.job_alerts (
  id uuid primary key default gen_random_uuid(),
  teacher_id uuid not null references public.teacher_profiles (id) on delete cascade,
  keywords text not null check (char_length(trim(keywords)) between 2 and 120),
  location text not null default '' check (char_length(location) <= 120),
  frequency text not null default 'daily' check (frequency in ('daily', 'weekly')),
  is_active boolean not null default true,
  last_sent_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.teacher_resumes (
  teacher_id uuid primary key references public.teacher_profiles (id) on delete cascade,
  object_path text not null unique,
  original_filename text not null check (char_length(original_filename) <= 255),
  mime_type text not null check (mime_type in ('application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document')),
  file_size integer not null check (file_size between 1 and 10485760),
  updated_at timestamptz not null default now(),
  constraint teacher_resume_path_owned check (split_part(object_path, '/', 1) = teacher_id::text)
);

create table public.application_messages (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null references public.applications (id) on delete cascade,
  sender_id uuid not null references public.profiles (id) on delete cascade,
  recipient_id uuid not null references public.profiles (id) on delete cascade,
  body text not null check (char_length(trim(body)) between 1 and 4000),
  created_at timestamptz not null default now(),
  read_at timestamptz,
  constraint application_message_participants_distinct check (sender_id <> recipient_id)
);

create index application_messages_thread_idx on public.application_messages (application_id, created_at);

create table public.interviews (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null references public.applications (id) on delete cascade,
  created_by uuid not null references public.profiles (id) on delete cascade,
  scheduled_at timestamptz not null,
  duration_minutes integer not null default 30 check (duration_minutes between 15 and 180),
  meeting_url text not null check (meeting_url ~ '^https://'),
  notes text check (notes is null or char_length(notes) <= 1000),
  status text not null default 'scheduled' check (status in ('scheduled', 'completed', 'cancelled')),
  created_at timestamptz not null default now()
);

create table public.user_notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  category text not null check (category in ('application', 'message', 'interview', 'review', 'system')),
  title text not null check (char_length(title) between 1 and 140),
  body text not null check (char_length(body) between 1 and 500),
  href text not null default '/dashboard' check (href like '/%'),
  created_at timestamptz not null default now(),
  read_at timestamptz
);

create index user_notifications_inbox_idx on public.user_notifications (user_id, created_at desc);

create table public.school_reviews (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.school_profiles (id) on delete cascade,
  teacher_id uuid not null references public.teacher_profiles (id) on delete cascade,
  application_id uuid not null unique references public.applications (id) on delete cascade,
  rating smallint not null check (rating between 1 and 5),
  title text not null check (char_length(trim(title)) between 4 and 120),
  body text not null check (char_length(trim(body)) between 20 and 3000),
  status text not null default 'pending' check (status in ('pending', 'published', 'rejected')),
  created_at timestamptz not null default now()
);

create table public.school_review_reports (
  id uuid primary key default gen_random_uuid(),
  review_id uuid not null references public.school_reviews (id) on delete cascade,
  reporter_id uuid not null references public.profiles (id) on delete cascade,
  reason text not null check (char_length(trim(reason)) between 8 and 500),
  created_at timestamptz not null default now(),
  unique (review_id, reporter_id)
);

alter table public.saved_jobs enable row level security;
alter table public.job_alerts enable row level security;
alter table public.teacher_resumes enable row level security;
alter table public.application_messages enable row level security;
alter table public.interviews enable row level security;
alter table public.user_notifications enable row level security;
alter table public.school_reviews enable row level security;
alter table public.school_review_reports enable row level security;

grant select, insert, delete on public.saved_jobs to authenticated;
grant select, insert, update, delete on public.job_alerts to authenticated;
grant select, insert, update, delete on public.teacher_resumes to authenticated;
grant select, insert, update on public.application_messages to authenticated;
grant select, insert, update on public.interviews to authenticated;
grant select, insert, update on public.user_notifications to authenticated;
grant select, insert on public.school_reviews to authenticated;
grant update on public.school_reviews to authenticated;
grant select, insert, update on public.school_review_reports to authenticated;
grant select on public.school_reviews to anon;

create policy "Teachers manage their saved jobs" on public.saved_jobs
  for all to authenticated
  using (teacher_id = (select auth.uid()))
  with check (teacher_id = (select auth.uid()));

create policy "Teachers manage their job alerts" on public.job_alerts
  for all to authenticated
  using (teacher_id = (select auth.uid()))
  with check (teacher_id = (select auth.uid()));

create policy "Teachers manage their resume metadata" on public.teacher_resumes
  for all to authenticated
  using (teacher_id = (select auth.uid()))
  with check (teacher_id = (select auth.uid()));

create policy "Application participants read messages" on public.application_messages
  for select to authenticated
  using (exists (
    select 1 from public.applications a join public.jobs j on j.id = a.job_id
    where a.id = application_id and (a.teacher_id = (select auth.uid()) or j.school_id = (select auth.uid()))
  ));

create policy "Application participants send messages" on public.application_messages
  for insert to authenticated
  with check (
    sender_id = (select auth.uid()) and exists (
      select 1 from public.applications a join public.jobs j on j.id = a.job_id
      where a.id = application_id and (
        (sender_id = a.teacher_id and recipient_id = j.school_id) or
        (sender_id = j.school_id and recipient_id = a.teacher_id)
      )
    )
  );

create policy "Recipients mark messages read" on public.application_messages
  for update to authenticated
  using (recipient_id = (select auth.uid()))
  with check (recipient_id = (select auth.uid()));

create policy "Application participants read interviews" on public.interviews
  for select to authenticated
  using (exists (
    select 1 from public.applications a join public.jobs j on j.id = a.job_id
    where a.id = application_id and (a.teacher_id = (select auth.uid()) or j.school_id = (select auth.uid()))
  ));

create policy "Application participants schedule interviews" on public.interviews
  for insert to authenticated
  with check (created_by = (select auth.uid()) and exists (
    select 1 from public.applications a join public.jobs j on j.id = a.job_id
    where a.id = application_id and (a.teacher_id = (select auth.uid()) or j.school_id = (select auth.uid()))
  ));

create policy "Interview participants update interviews" on public.interviews
  for update to authenticated
  using (exists (
    select 1 from public.applications a join public.jobs j on j.id = a.job_id
    where a.id = application_id and (a.teacher_id = (select auth.uid()) or j.school_id = (select auth.uid()))
  ))
  with check (created_by = (select auth.uid()) or exists (
    select 1 from public.applications a join public.jobs j on j.id = a.job_id
    where a.id = application_id and (a.teacher_id = (select auth.uid()) or j.school_id = (select auth.uid()))
  ));

create policy "Users read their notifications" on public.user_notifications
  for select to authenticated using (user_id = (select auth.uid()));
create policy "Participants create notifications" on public.user_notifications
  for insert to authenticated with check (
    user_id = (select auth.uid()) or exists (
      select 1 from public.applications a join public.jobs j on j.id = a.job_id
      where (a.teacher_id = user_notifications.user_id and j.school_id = (select auth.uid()))
         or (j.school_id = user_notifications.user_id and a.teacher_id = (select auth.uid()))
    )
  );
create policy "Users update their notifications" on public.user_notifications
  for update to authenticated using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

create policy "Anyone can read published school reviews" on public.school_reviews
  for select to anon, authenticated using (status = 'published');
create policy "Teachers read their own school reviews" on public.school_reviews
  for select to authenticated using (teacher_id = (select auth.uid()));
create policy "Admins read school reviews for moderation" on public.school_reviews
  for select to authenticated using (
    exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.is_admin)
  );
create policy "Teachers submit verified school reviews" on public.school_reviews
  for insert to authenticated with check (
    teacher_id = (select auth.uid()) and status = 'pending' and exists (
      select 1 from public.applications a join public.jobs j on j.id = a.job_id
      where a.id = application_id and a.teacher_id = (select auth.uid()) and j.school_id = school_id
    )
  );
create policy "Admins moderate school reviews" on public.school_reviews
  for update to authenticated
  using (exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.is_admin))
  with check (exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.is_admin));

create policy "Users report school reviews" on public.school_review_reports
  for insert to authenticated with check (reporter_id = (select auth.uid()));
create policy "Reporters read their reports" on public.school_review_reports
  for select to authenticated using (
    reporter_id = (select auth.uid()) or exists (
      select 1 from public.profiles p where p.id = (select auth.uid()) and p.is_admin
    )
  );
create policy "Admins update review reports" on public.school_review_reports
  for update to authenticated
  using (exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.is_admin))
  with check (exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.is_admin));

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('teacher-cvs', 'teacher-cvs', false, 10485760,
  array['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'])
on conflict (id) do update set public = false, file_size_limit = 10485760,
  allowed_mime_types = excluded.allowed_mime_types;

create policy "Teachers upload their own CVs" on storage.objects
  for insert to authenticated with check (
    bucket_id = 'teacher-cvs' and (storage.foldername(name))[1] = (select auth.uid())::text
  );
create policy "Teachers read their own CVs" on storage.objects
  for select to authenticated using (
    bucket_id = 'teacher-cvs' and (storage.foldername(name))[1] = (select auth.uid())::text
  );
create policy "Schools read CVs from their applicants" on storage.objects
  for select to authenticated using (
    bucket_id = 'teacher-cvs' and exists (
      select 1 from public.applications a join public.jobs j on j.id = a.job_id
      where a.teacher_id::text = (storage.foldername(name))[1] and j.school_id = (select auth.uid())
    )
  );
create policy "Teachers update their own CVs" on storage.objects
  for update to authenticated using (
    bucket_id = 'teacher-cvs' and (storage.foldername(name))[1] = (select auth.uid())::text
  ) with check (
    bucket_id = 'teacher-cvs' and (storage.foldername(name))[1] = (select auth.uid())::text
  );
create policy "Teachers delete their own CVs" on storage.objects
  for delete to authenticated using (
    bucket_id = 'teacher-cvs' and (storage.foldername(name))[1] = (select auth.uid())::text
  );
