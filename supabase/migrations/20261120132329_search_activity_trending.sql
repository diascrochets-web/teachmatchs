create table public.search_activity (
  visitor_id uuid not null,
  category text not null check (category in ('search', 'job', 'location', 'school')),
  term text not null check (
    char_length(term) between 2 and 100
    and term = lower(btrim(term))
  ),
  event_date date not null default current_date,
  created_at timestamptz not null default now(),
  primary key (visitor_id, category, term, event_date)
);

create index search_activity_recent_category_idx
  on public.search_activity (category, created_at desc);

alter table public.search_activity enable row level security;
revoke all on public.search_activity from anon, authenticated;
grant insert (visitor_id, category, term)
  on public.search_activity to anon, authenticated;

create policy "Visitors can record anonymous trend activity"
  on public.search_activity
  for insert
  to anon, authenticated
  with check (
    event_date = current_date
    and created_at <= now()
    and created_at >= now() - interval '1 minute'
  );

create or replace function public.get_trending_activity()
returns table (category text, term text, visitors bigint)
language sql
stable
security definer
set search_path = ''
as $$
  with activity_counts as (
    select
      search_activity.category,
      search_activity.term,
      count(distinct search_activity.visitor_id) as visitors
    from public.search_activity
    where search_activity.created_at >= now() - interval '30 days'
    group by search_activity.category, search_activity.term
    having count(distinct search_activity.visitor_id) >= 2
  ), ranked_activity as (
    select
      activity_counts.category,
      activity_counts.term,
      activity_counts.visitors,
      row_number() over (
        partition by activity_counts.category
        order by activity_counts.visitors desc, activity_counts.term asc
      ) as rank_in_category
    from activity_counts
  )
  select ranked_activity.category, ranked_activity.term, ranked_activity.visitors
  from ranked_activity
  where ranked_activity.rank_in_category <= 6
  order by ranked_activity.category, ranked_activity.visitors desc, ranked_activity.term asc;
$$;

revoke all on function public.get_trending_activity() from public;
grant execute on function public.get_trending_activity() to anon, authenticated;
