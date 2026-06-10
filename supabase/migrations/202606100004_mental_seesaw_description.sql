alter table public.mental_seesaws
add column if not exists description text;

update public.mental_seesaws
set description = context
where description is null
  and context is not null;
