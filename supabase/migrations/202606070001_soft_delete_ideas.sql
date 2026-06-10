alter table public.ideas
add column if not exists status text not null default 'public',
add column if not exists hidden_at timestamptz,
add column if not exists delete_scheduled_at timestamptz;

alter table public.ideas
drop constraint if exists ideas_status_check;

alter table public.ideas
add constraint ideas_status_check check (status in ('public', 'hidden', 'deleted'));

drop policy if exists "ideas are public" on public.ideas;
drop policy if exists "public ideas are readable" on public.ideas;
drop policy if exists "authors can delete own ideas" on public.ideas;

create policy "public ideas are readable" on public.ideas
for select using (status = 'public' or auth.uid() = user_id);

create index if not exists ideas_status_created_at_idx on public.ideas(status, created_at desc);
