create table if not exists public.comment_error_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete set null,
  idea_id uuid references public.ideas(id) on delete set null,
  body text,
  body_length integer not null default 0,
  error_code text,
  error_message text not null,
  occurred_at timestamptz not null default now()
);

alter table public.comment_error_logs enable row level security;

drop policy if exists "users can create own comment error logs" on public.comment_error_logs;
create policy "users can create own comment error logs" on public.comment_error_logs
for insert with check (auth.uid() = user_id);

create index if not exists comment_error_logs_occurred_at_idx
on public.comment_error_logs(occurred_at desc);

create index if not exists comment_error_logs_user_occurred_at_idx
on public.comment_error_logs(user_id, occurred_at desc);

create index if not exists comment_error_logs_idea_occurred_at_idx
on public.comment_error_logs(idea_id, occurred_at desc);
