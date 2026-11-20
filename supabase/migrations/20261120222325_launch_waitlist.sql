create table public.launch_waitlist (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  created_at timestamptz not null default now(),
  constraint launch_waitlist_email_normalized check (email = lower(btrim(email))),
  constraint launch_waitlist_email_length check (char_length(email) between 3 and 254),
  constraint launch_waitlist_email_unique unique (email)
);

alter table public.launch_waitlist enable row level security;

revoke all on table public.launch_waitlist from public, anon, authenticated, service_role;
grant insert on table public.launch_waitlist to service_role;
