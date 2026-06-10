alter table public.ideas
alter column status set default 'active';

alter table public.ideas
drop constraint if exists ideas_status_check;

alter table public.ideas
add constraint ideas_status_check check (status in ('active', 'completed', 'archived'));

update public.ideas
set status = 'archived',
    updated_at = now()
where archived_at is not null
  and status in ('active', 'completed');

drop policy if exists "public ideas are readable" on public.ideas;

create policy "public ideas are readable" on public.ideas
for select using (status in ('active', 'completed') or auth.uid() = user_id);

drop policy if exists "authors can delete archived ideas" on public.ideas;

create policy "authors can delete archived ideas" on public.ideas
for delete using (auth.uid() = user_id and status = 'archived');

grant select, insert, update, delete on table public.ideas to authenticated;

create index if not exists ideas_status_created_at_idx
on public.ideas(status, created_at desc);
