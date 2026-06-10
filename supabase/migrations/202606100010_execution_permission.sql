alter table public.ideas
add column if not exists execution_permission text not null default 'public';

alter table public.ideas
drop constraint if exists ideas_execution_permission_check;

alter table public.ideas
add constraint ideas_execution_permission_check
check (execution_permission in ('owner_only', 'public'));

update public.ideas
set execution_permission = 'owner_only'
where source = 'mental_seesaw';

grant select, insert, update, delete on table public.ideas to authenticated;
