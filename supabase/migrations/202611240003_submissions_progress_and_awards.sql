-- Content review records, learner progress, attempts, tutor messages, and certificates.
create table public.content_submissions (
  id uuid primary key default gen_random_uuid(),
  content_type text not null check (content_type in ('module','session','model')),
  program_id uuid not null references public.programs(id) on delete cascade,
  target_id uuid,
  author_id uuid not null references public.profiles(id),
  status text not null default 'submitted' check (status in ('submitted','technical_review','educational_review','simulation_validation','approved','published','revision_requested','rejected')),
  payload jsonb not null default '{}'::jsonb,
  review_note text not null default '',
  reviewed_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index content_submissions_queue_idx on public.content_submissions(status,created_at desc);
create table public.content_reviews (
  id uuid primary key default gen_random_uuid(),
  submission_id uuid not null references public.content_submissions(id) on delete cascade,
  reviewer_id uuid not null references public.profiles(id),
  decision text not null check (decision in ('technical_review','educational_review','simulation_validation','approved','published','revision_requested','rejected')),
  note text not null default '',
  created_at timestamptz not null default now()
);

create table public.lesson_progress (
  student_id uuid not null references public.profiles(id) on delete cascade,
  lesson_id uuid not null references public.learning_lessons(id) on delete cascade,
  completed_at timestamptz not null default now(),
  primary key(student_id,lesson_id)
);
create table public.assessment_attempts (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.profiles(id) on delete cascade,
  session_id uuid not null references public.practical_sessions(id) on delete cascade,
  score numeric(5,2) not null check(score between 0 and 100),
  submission jsonb not null default '{}'::jsonb,
  graded_at timestamptz not null default now()
);
create table public.tutor_interactions (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.profiles(id) on delete cascade,
  tutor_id uuid references public.profiles(id) on delete set null,
  subject text not null,
  message text not null,
  reply text,
  replied_at timestamptz,
  created_at timestamptz not null default now()
);
create table public.certificates (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.profiles(id) on delete cascade,
  program_id uuid not null references public.programs(id),
  certificate_code text not null unique default upper(encode(gen_random_bytes(8),'hex')),
  issued_at timestamptz not null default now(),
  unique(student_id,program_id)
);
