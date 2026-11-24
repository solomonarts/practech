-- Minimal per-user table used by the Next.js Supabase server page.
create table public.todos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade default auth.uid(),
  name text not null check (char_length(trim(name)) between 1 and 240),
  created_at timestamptz not null default now()
);

create index todos_user_created_idx on public.todos(user_id,created_at desc);
alter table public.todos enable row level security;

create policy todos_read_own on public.todos for select to authenticated
using(user_id=auth.uid());
create policy todos_insert_own on public.todos for insert to authenticated
with check(user_id=auth.uid());
create policy todos_update_own on public.todos for update to authenticated
using(user_id=auth.uid()) with check(user_id=auth.uid());
create policy todos_delete_own on public.todos for delete to authenticated
using(user_id=auth.uid());

grant select,insert,update,delete on public.todos to authenticated;
