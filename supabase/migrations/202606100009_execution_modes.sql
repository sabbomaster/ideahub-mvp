alter table public.ideas
add column if not exists status_before_archive text;

alter table public.ideas
drop constraint if exists ideas_status_before_archive_check;

alter table public.ideas
add constraint ideas_status_before_archive_check
check (status_before_archive is null or status_before_archive in ('active', 'completed'));

alter table public.ideas
add column if not exists source text not null default 'manual';

alter table public.ideas
drop constraint if exists ideas_source_check;

alter table public.ideas
add constraint ideas_source_check
check (source in ('manual', 'mental_seesaw'));

update public.ideas
set source = 'mental_seesaw'
where source = 'manual'
  and (title like '%再提案%' or body like '%メンタルシーソー%');

alter table public.executions
add column if not exists kind text not null default 'report';

alter table public.executions
drop constraint if exists executions_kind_check;

alter table public.executions
add constraint executions_kind_check
check (kind in ('self', 'report'));

grant select, insert, update, delete on table public.ideas to authenticated;
grant select, insert, update, delete on table public.executions to authenticated;
