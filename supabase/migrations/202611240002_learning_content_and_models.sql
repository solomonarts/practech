-- Modules, lessons, practical sessions, model assets, and publication controls.
create table public.learning_modules (
  id uuid primary key default gen_random_uuid(),
  program_id uuid not null references public.programs(id) on delete cascade,
  title text not null,
  description text not null default '',
  level text not null default '',
  status text not null default 'draft' check (status in ('draft','submitted','published','revision_requested','rejected','archived')),
  version integer not null default 1 check (version > 0),
  author_id uuid not null references public.profiles(id),
  updated_at timestamptz not null default now()
);
create table public.learning_lessons (
  id uuid primary key default gen_random_uuid(),
  module_id uuid not null references public.learning_modules(id) on delete cascade,
  title text not null,
  body text not null default '',
  position integer not null default 0,
  required boolean not null default true,
  created_at timestamptz not null default now()
);
create index learning_lessons_module_position_idx on public.learning_lessons(module_id,position);

create table public.practical_sessions (
  id uuid primary key default gen_random_uuid(),
  program_id uuid not null references public.programs(id) on delete cascade,
  module_id uuid references public.learning_modules(id) on delete set null,
  lesson_id uuid references public.learning_lessons(id) on delete set null,
  title text not null,
  description text not null default '',
  instructions jsonb not null default '{}'::jsonb,
  assessment_criteria jsonb not null default '{}'::jsonb,
  status text not null default 'draft' check (status in ('draft','submitted','published','revision_requested','rejected','archived')),
  version integer not null default 1 check (version > 0),
  author_id uuid not null references public.profiles(id),
  updated_at timestamptz not null default now()
);

create table public.model_assets (
  id uuid primary key default gen_random_uuid(),
  program_id uuid not null references public.programs(id) on delete cascade,
  module_id uuid references public.learning_modules(id) on delete set null,
  lesson_id uuid references public.learning_lessons(id) on delete set null,
  name text not null,
  description text not null default '',
  source text not null default '',
  license text not null default '',
  attribution text not null default '',
  commercial_use boolean not null default false,
  storage_path text not null,
  file_name text not null,
  file_format text not null,
  component_files jsonb not null default '[]'::jsonb,
  status text not null default 'submitted' check (status in ('draft','submitted','published','revision_requested','rejected','archived')),
  author_id uuid not null references public.profiles(id),
  updated_at timestamptz not null default now()
);

create or replace function public.prevent_non_admin_publish()
returns trigger language plpgsql security definer set search_path = '' as $$
declare caller_role text;
begin
  select p.role into caller_role from public.profiles p where p.id=auth.uid();
  if caller_role is distinct from 'admin' and auth.role() is distinct from 'service_role' and new.status='published' then
    raise exception 'Only administrators can publish learning content.' using errcode='42501';
  end if;
  return new;
end;
$$;
create trigger modules_admin_publish before insert or update of status on public.learning_modules for each row execute function public.prevent_non_admin_publish();
create trigger sessions_admin_publish before insert or update of status on public.practical_sessions for each row execute function public.prevent_non_admin_publish();
create trigger models_admin_publish before insert or update of status on public.model_assets for each row execute function public.prevent_non_admin_publish();

create or replace function public.student_enrolled_in(target_program uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists(select 1 from public.program_enrollments e where e.student_id=auth.uid() and e.program_id=target_program and e.status in ('active','completed'));
$$;
