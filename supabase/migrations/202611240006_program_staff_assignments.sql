-- Limit tutor editing to programs an administrator has assigned to them.
create table public.program_staff_assignments (
  id uuid primary key default gen_random_uuid(),
  program_id uuid not null references public.programs(id) on delete cascade,
  tutor_id uuid not null references public.profiles(id) on delete cascade,
  assigned_by uuid not null references public.profiles(id),
  assigned_at timestamptz not null default now(),
  unique(program_id,tutor_id)
);
create index program_staff_assignments_tutor_idx on public.program_staff_assignments(tutor_id,program_id);
create or replace function public.require_tutor_assignment_role()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if not exists(select 1 from public.profiles p where p.id=new.tutor_id and p.role='tutor') then
    raise exception 'Only tutor accounts can be assigned to a program.' using errcode='23514';
  end if;
  return new;
end;
$$;
create trigger require_tutor_assignment_role before insert or update of tutor_id on public.program_staff_assignments
for each row execute function public.require_tutor_assignment_role();
alter table public.program_staff_assignments enable row level security;

create or replace function public.is_program_tutor(target_program uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists(select 1 from public.program_staff_assignments a where a.program_id=target_program and a.tutor_id=auth.uid());
$$;
create or replace function public.can_tutor_student(target_student uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists(
    select 1 from public.program_staff_assignments a
    join public.program_enrollments e on e.program_id=a.program_id
    where a.tutor_id=auth.uid() and e.student_id=target_student and e.status in ('active','completed')
  );
$$;
create or replace function public.can_upload_model_path(target_path text)
returns boolean language plpgsql stable security definer set search_path = '' as $$
declare parts text[];
begin
  if public.is_admin() then return true; end if;
  parts := storage.foldername(target_path);
  if coalesce(array_length(parts,1),0)<1 or parts[1] !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' then return false; end if;
  return public.is_staff() and public.is_program_tutor(parts[1]::uuid);
end;
$$;
create or replace function public.protect_content_attribution()
returns trigger language plpgsql security definer set search_path = '' as $$
declare caller_role text;
begin
  select p.role into caller_role from public.profiles p where p.id=auth.uid();
  if caller_role is distinct from 'admin' and auth.role() is distinct from 'service_role' and (
    (TG_OP='INSERT' and new.author_id is distinct from auth.uid()) or
    (TG_OP='UPDATE' and new.author_id is distinct from old.author_id)
  ) then
    raise exception 'Only administrators can change content attribution.' using errcode='42501';
  end if;
  return new;
end;
$$;
create trigger protect_module_attribution before insert or update of author_id on public.learning_modules for each row execute function public.protect_content_attribution();
create trigger protect_session_attribution before insert or update of author_id on public.practical_sessions for each row execute function public.protect_content_attribution();
create trigger protect_model_attribution before insert or update of author_id on public.model_assets for each row execute function public.protect_content_attribution();

create policy program_assignments_read on public.program_staff_assignments for select to authenticated
using(tutor_id=auth.uid() or public.is_admin());
create policy program_assignments_admin_manage on public.program_staff_assignments for all to authenticated
using(public.is_admin()) with check(public.is_admin());

drop policy modules_staff_write on public.learning_modules;
create policy modules_staff_write on public.learning_modules for all to authenticated
using(public.is_admin() or (public.is_staff() and public.is_program_tutor(program_id)))
with check(public.is_admin() or (public.is_staff() and public.is_program_tutor(program_id)));

drop policy lessons_staff_write on public.learning_lessons;
create policy lessons_staff_write on public.learning_lessons for all to authenticated
using(public.is_admin() or (public.is_staff() and exists(select 1 from public.learning_modules m where m.id=module_id and public.is_program_tutor(m.program_id))))
with check(public.is_admin() or (public.is_staff() and exists(select 1 from public.learning_modules m where m.id=module_id and public.is_program_tutor(m.program_id))));

drop policy sessions_staff_write on public.practical_sessions;
create policy sessions_staff_write on public.practical_sessions for all to authenticated
using(public.is_admin() or (public.is_staff() and public.is_program_tutor(program_id)))
with check(public.is_admin() or (public.is_staff() and public.is_program_tutor(program_id)));

drop policy model_assets_staff_write on public.model_assets;
create policy model_assets_staff_write on public.model_assets for all to authenticated
using(public.is_admin() or (public.is_staff() and public.is_program_tutor(program_id)))
with check(public.is_admin() or (public.is_staff() and public.is_program_tutor(program_id)));

drop policy submissions_staff_insert on public.content_submissions;
create policy submissions_staff_insert on public.content_submissions for insert to authenticated
with check(author_id=auth.uid() and (public.is_admin() or (public.is_staff() and public.is_program_tutor(program_id))));

grant select,insert,update,delete on public.program_staff_assignments to authenticated;

drop policy model_storage_staff_upload on storage.objects;
create policy model_storage_staff_upload on storage.objects for insert to authenticated
with check(bucket_id='engineering-models' and public.can_upload_model_path(name));
drop policy model_storage_staff_update on storage.objects;
create policy model_storage_staff_update on storage.objects for update to authenticated
using(bucket_id='engineering-models' and public.can_upload_model_path(name))
with check(bucket_id='engineering-models' and public.can_upload_model_path(name));

drop policy progress_read on public.lesson_progress;
create policy progress_read on public.lesson_progress for select to authenticated using(
  student_id=auth.uid() or public.is_admin() or exists(
    select 1 from public.learning_lessons l join public.learning_modules m on m.id=l.module_id
    where l.id=lesson_id and public.is_program_tutor(m.program_id)
  )
);
drop policy attempts_read on public.assessment_attempts;
create policy attempts_read on public.assessment_attempts for select to authenticated using(
  student_id=auth.uid() or public.is_admin() or exists(
    select 1 from public.practical_sessions s where s.id=session_id and public.is_program_tutor(s.program_id)
  )
);
drop policy interactions_read on public.tutor_interactions;
create policy interactions_read on public.tutor_interactions for select to authenticated using(
  student_id=auth.uid() or public.is_admin() or (public.is_staff() and public.can_tutor_student(student_id))
);
drop policy interactions_tutor_update on public.tutor_interactions;
create policy interactions_tutor_update on public.tutor_interactions for update to authenticated
using(public.is_admin() or (public.is_staff() and public.can_tutor_student(student_id)))
with check(public.is_admin() or (public.is_staff() and public.can_tutor_student(student_id)));
