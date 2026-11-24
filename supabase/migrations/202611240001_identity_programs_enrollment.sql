-- Identity, roles, programs, and active enrollment limits.
create extension if not exists pgcrypto;

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null default '',
  role text not null default 'student' check (role in ('student','tutor','admin')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.handle_new_auth_user()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'full_name', ''))
  on conflict (id) do nothing;
  return new;
end;
$$;
create trigger on_auth_user_created after insert on auth.users
for each row execute function public.handle_new_auth_user();

create or replace function public.is_staff()
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('admin','tutor'));
$$;
create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin');
$$;

create table public.programs (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  discipline text not null,
  description text not null default '',
  active boolean not null default true,
  created_at timestamptz not null default now()
);
insert into public.programs(slug,name,discipline) values
 ('mechanical','Mechanical Engineering','Mechanical'),
 ('electrical','Electrical Engineering','Electrical'),
 ('civil','Civil and Structural Engineering','Civil'),
 ('mechatronics','Mechatronics and Robotics','Mechatronics')
on conflict (slug) do nothing;

create table public.program_enrollments (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.profiles(id) on delete cascade,
  program_id uuid not null references public.programs(id),
  status text not null default 'active' check (status in ('active','completed','withdrawn')),
  enrolled_at timestamptz not null default now(),
  completed_at timestamptz,
  unique(student_id, program_id)
);
create index program_enrollments_student_status_idx on public.program_enrollments(student_id,status);

create or replace function public.enforce_two_active_enrollments()
returns trigger language plpgsql security definer set search_path = '' as $$
declare active_count integer;
begin
  if new.status = 'active' then
    perform pg_advisory_xact_lock(hashtextextended(new.student_id::text, 19));
    select count(*) into active_count from public.program_enrollments e
      where e.student_id = new.student_id and e.status = 'active' and e.id is distinct from new.id;
    if active_count >= 2 then raise exception 'Students may have at most two active program enrollments.' using errcode = '23514'; end if;
  end if;
  return new;
end;
$$;
create trigger enforce_two_active_enrollments before insert or update of status,student_id on public.program_enrollments
for each row execute function public.enforce_two_active_enrollments();
