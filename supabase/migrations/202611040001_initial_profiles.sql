create type public.account_role as enum ('teacher', 'school');

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  role public.account_role not null,
  full_name text not null,
  email text not null,
  phone text,
  created_at timestamptz not null default now()
);

create table public.teacher_profiles (
  id uuid primary key references public.profiles (id) on delete cascade,
  state text not null,
  city text not null,
  qualification text,
  years_experience integer not null default 0 check (years_experience >= 0),
  subjects text[] not null default '{}'
);

create table public.school_profiles (
  id uuid primary key references public.profiles (id) on delete cascade,
  school_name text not null,
  school_type text not null check (school_type in ('primary', 'secondary', 'both', 'other')),
  state text not null,
  city text not null,
  verification_status text not null default 'pending'
    check (verification_status in ('pending', 'approved', 'rejected', 'suspended')),
  created_at timestamptz not null default now()
);

create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  new_role public.account_role;
  new_name text;
  new_state text;
  new_city text;
begin
  new_role := (new.raw_user_meta_data ->> 'account_type')::public.account_role;
  new_name := nullif(trim(new.raw_user_meta_data ->> 'full_name'), '');
  new_state := nullif(trim(new.raw_user_meta_data ->> 'state'), '');
  new_city := nullif(trim(new.raw_user_meta_data ->> 'city'), '');

  if new_role is null or new_name is null or new_state is null or new_city is null then
    raise exception 'Account type, name, state, and city are required';
  end if;

  insert into public.profiles (id, role, full_name, email, phone)
  values (
    new.id,
    new_role,
    new_name,
    new.email,
    nullif(trim(new.raw_user_meta_data ->> 'phone'), '')
  );

  if new_role = 'teacher' then
    insert into public.teacher_profiles (id, state, city, qualification, years_experience, subjects)
    values (
      new.id,
      new_state,
      new_city,
      nullif(trim(new.raw_user_meta_data ->> 'qualification'), ''),
      coalesce(nullif(new.raw_user_meta_data ->> 'years_experience', '')::integer, 0),
      coalesce(array(select jsonb_array_elements_text(new.raw_user_meta_data -> 'subjects')), '{}')
    );
  else
    insert into public.school_profiles (id, school_name, school_type, state, city)
    values (
      new.id,
      nullif(trim(new.raw_user_meta_data ->> 'school_name'), ''),
      new.raw_user_meta_data ->> 'school_type',
      new_state,
      new_city
    );
  end if;

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

alter table public.profiles enable row level security;
alter table public.teacher_profiles enable row level security;
alter table public.school_profiles enable row level security;

grant select on public.profiles, public.teacher_profiles, public.school_profiles to authenticated;
grant select on public.school_profiles to anon;

create policy "Users can read their own profile"
  on public.profiles for select to authenticated
  using ((select auth.uid()) = id);

create policy "Teachers can read their own teacher profile"
  on public.teacher_profiles for select to authenticated
  using ((select auth.uid()) = id);

create policy "Schools can read their own school profile"
  on public.school_profiles for select to authenticated
  using ((select auth.uid()) = id or verification_status = 'approved');
