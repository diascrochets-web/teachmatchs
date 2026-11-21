alter table public.launch_waitlist
  add column resend_synced_at timestamptz;

revoke all on table public.launch_waitlist from public, anon, authenticated, service_role;
grant select, insert, update on table public.launch_waitlist to service_role;

create table public.launch_campaign_send (
  id smallint primary key default 1 check (id = 1),
  status text not null default 'pending' check (status in ('pending', 'sending', 'sent', 'failed')),
  broadcast_id text,
  attempted_at timestamptz,
  sent_at timestamptz,
  last_error text,
  constraint launch_campaign_send_singleton check (id = 1)
);

insert into public.launch_campaign_send (id, status)
values (1, 'pending');

alter table public.launch_campaign_send enable row level security;
revoke all on table public.launch_campaign_send from public, anon, authenticated, service_role;
grant select, insert, update on table public.launch_campaign_send to service_role;
