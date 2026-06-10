update public.ideas
set status = case
  when status = 'public' then 'active'
  when status in ('hidden', 'deleted') then 'archived'
  when status in ('active', 'completed', 'archived') then status
  else 'active'
end;

alter table public.ideas
alter column status set default 'active';

alter table public.ideas
drop constraint if exists ideas_status_check;

alter table public.ideas
add constraint ideas_status_check check (status in ('active', 'completed', 'archived'));

drop policy if exists "public ideas are readable" on public.ideas;

create policy "public ideas are readable" on public.ideas
for select using (status in ('active', 'completed') or auth.uid() = user_id);
