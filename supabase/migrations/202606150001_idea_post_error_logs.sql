create table if not exists public.idea_post_error_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete set null,
  email text,
  title_length integer not null default 0,
  body_length integer not null default 0,
  category text,
  visibility text,
  execution_permission text,
  error_message text not null,
  stack_trace text,
  occurred_at timestamptz not null default now()
);

alter table public.idea_post_error_logs enable row level security;

drop policy if exists "users can create own idea post error logs" on public.idea_post_error_logs;
create policy "users can create own idea post error logs" on public.idea_post_error_logs
for insert with check (auth.uid() = user_id);

create index if not exists idea_post_error_logs_occurred_at_idx
on public.idea_post_error_logs(occurred_at desc);

create index if not exists idea_post_error_logs_user_occurred_at_idx
on public.idea_post_error_logs(user_id, occurred_at desc);
