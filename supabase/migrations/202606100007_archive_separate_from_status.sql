alter table public.ideas
add column if not exists archived_at timestamptz;

update public.ideas
set archived_at = coalesce(archived_at, hidden_at, now()),
    status = 'active'
where status in ('archived', 'hidden', 'deleted');

update public.ideas
set status = case
  when status = 'public' then 'active'
  when status in ('active', 'completed') then status
  else 'active'
end;

alter table public.ideas
alter column status set default 'active';

alter table public.ideas
drop constraint if exists ideas_status_check;

alter table public.ideas
add constraint ideas_status_check check (status in ('active', 'completed'));

drop policy if exists "public ideas are readable" on public.ideas;

create policy "public ideas are readable" on public.ideas
for select using (archived_at is null or auth.uid() = user_id);

create index if not exists ideas_archived_status_created_at_idx
on public.ideas(archived_at, status, created_at desc);
