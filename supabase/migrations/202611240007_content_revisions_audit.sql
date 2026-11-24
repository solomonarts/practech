-- Keep reviewable content history and privileged account changes for quality and licensing traceability.
create table public.content_revisions (
  id uuid primary key default gen_random_uuid(),
  program_id uuid references public.programs(id) on delete set null,
  content_table text not null check(content_table in ('learning_modules','learning_lessons','practical_sessions','model_assets')),
  content_id uuid not null,
  version integer not null default 1,
  change_type text not null check(change_type in ('insert','update','delete')),
  snapshot jsonb not null,
  changed_by uuid references public.profiles(id) on delete set null,
  changed_by_role text,
  changed_at timestamptz not null default now()
);
create index content_revisions_lookup_idx on public.content_revisions(content_table,content_id,changed_at desc);
create index content_revisions_program_idx on public.content_revisions(program_id,changed_at desc);

create table public.platform_audit_events (
  id uuid primary key default gen_random_uuid(),
  event_type text not null,
  actor_id uuid references public.profiles(id) on delete set null,
  target_type text not null,
  target_id uuid,
  before_data jsonb,
  after_data jsonb,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index platform_audit_events_created_idx on public.platform_audit_events(created_at desc);
create index platform_audit_events_target_idx on public.platform_audit_events(target_type,target_id,created_at desc);

create or replace function public.capture_content_revision()
returns trigger language plpgsql security definer set search_path = '' as $$
declare
  before_row jsonb;
  after_row jsonb;
  saved_row jsonb;
  saved_program uuid;
  saved_id uuid;
  saved_version integer;
  actor uuid;
  actor_role text;
  op text := lower(TG_OP);
begin
  if TG_OP <> 'INSERT' then before_row := to_jsonb(OLD); end if;
  if TG_OP <> 'DELETE' then after_row := to_jsonb(NEW); end if;
  if TG_OP='UPDATE' and before_row=after_row then return NEW; end if;
  saved_row := coalesce(after_row,before_row);
  saved_id := (saved_row->>'id')::uuid;
  saved_version := coalesce(nullif(saved_row->>'version','')::integer,1);
  if TG_TABLE_NAME='learning_lessons' then
    select m.program_id into saved_program from public.learning_modules m where m.id=(saved_row->>'module_id')::uuid;
  else
    saved_program := nullif(saved_row->>'program_id','')::uuid;
  end if;
  actor := auth.uid();
  select p.role into actor_role from public.profiles p where p.id=actor;
  if actor_role is null then actor_role := auth.role(); end if;
  insert into public.content_revisions(program_id,content_table,content_id,version,change_type,snapshot,changed_by,changed_by_role)
    values(saved_program,TG_TABLE_NAME,saved_id,saved_version,op,saved_row,actor,actor_role);
  insert into public.platform_audit_events(event_type,actor_id,target_type,target_id,before_data,after_data,details)
    values('content_'||op,actor,TG_TABLE_NAME,saved_id,before_row,after_row,jsonb_build_object('program_id',saved_program,'version',saved_version));
  if TG_OP='DELETE' then return OLD; end if;
  return NEW;
end;
$$;

create trigger revision_learning_modules after insert or update or delete on public.learning_modules for each row execute function public.capture_content_revision();
create trigger revision_learning_lessons after insert or update or delete on public.learning_lessons for each row execute function public.capture_content_revision();
create trigger revision_practical_sessions after insert or update or delete on public.practical_sessions for each row execute function public.capture_content_revision();
create trigger revision_model_assets after insert or update or delete on public.model_assets for each row execute function public.capture_content_revision();

create or replace function public.audit_program_staff_assignment()
returns trigger language plpgsql security definer set search_path = '' as $$
declare actor uuid := auth.uid();
begin
  if TG_OP='DELETE' then
    insert into public.platform_audit_events(event_type,actor_id,target_type,target_id,before_data)
      values('tutor_assignment_removed',actor,'program_staff_assignments',OLD.id,to_jsonb(OLD));
    return OLD;
  elsif TG_OP='UPDATE' then
    insert into public.platform_audit_events(event_type,actor_id,target_type,target_id,before_data,after_data)
      values('tutor_assignment_updated',actor,'program_staff_assignments',NEW.id,to_jsonb(OLD),to_jsonb(NEW));
    return NEW;
  else
    insert into public.platform_audit_events(event_type,actor_id,target_type,target_id,after_data)
      values('tutor_assigned_to_program',actor,'program_staff_assignments',NEW.id,to_jsonb(NEW));
    return NEW;
  end if;
end;
$$;
create trigger audit_program_staff_assignment after insert or update or delete on public.program_staff_assignments for each row execute function public.audit_program_staff_assignment();

alter table public.content_revisions enable row level security;
alter table public.platform_audit_events enable row level security;
create policy content_revisions_staff_read on public.content_revisions for select to authenticated
using(public.is_admin() or (program_id is not null and public.is_program_tutor(program_id)));
create policy audit_events_admin_read on public.platform_audit_events for select to authenticated using(public.is_admin());
grant select on public.content_revisions,public.platform_audit_events to authenticated;
revoke insert,update,delete on public.content_revisions,public.platform_audit_events from authenticated;
