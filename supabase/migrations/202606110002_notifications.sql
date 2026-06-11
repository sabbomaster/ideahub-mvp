create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  actor_id uuid references public.profiles(id) on delete set null,
  idea_id uuid not null references public.ideas(id) on delete cascade,
  type text not null check (type in ('comment', 'improvement', 'execution')),
  title text not null,
  body text,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

alter table public.notifications enable row level security;

grant select, insert, update, delete on table public.notifications to authenticated;

drop policy if exists "users can read own notifications" on public.notifications;
create policy "users can read own notifications" on public.notifications
for select using (auth.uid() = user_id);

drop policy if exists "users can create notifications for idea owners" on public.notifications;
create policy "users can create notifications for idea owners" on public.notifications
for insert with check (
  auth.uid() = actor_id
  and auth.uid() <> user_id
  and exists (
    select 1
    from public.ideas
    where ideas.id = notifications.idea_id
      and ideas.user_id = notifications.user_id
  )
);

drop policy if exists "users can update own notifications" on public.notifications;
create policy "users can update own notifications" on public.notifications
for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "users can delete own notifications" on public.notifications;
create policy "users can delete own notifications" on public.notifications
for delete using (auth.uid() = user_id);

create index if not exists notifications_user_created_at_idx
on public.notifications(user_id, created_at desc);

create index if not exists notifications_user_unread_idx
on public.notifications(user_id, read_at)
where read_at is null;
