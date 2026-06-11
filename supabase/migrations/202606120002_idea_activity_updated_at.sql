create or replace function public.touch_idea_activity_updated_at()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  update public.ideas
  set updated_at = now()
  where id = new.idea_id;

  return new;
end;
$$;

drop trigger if exists comments_touch_idea_updated_at on public.comments;
create trigger comments_touch_idea_updated_at
after insert on public.comments
for each row execute function public.touch_idea_activity_updated_at();

drop trigger if exists executions_touch_idea_updated_at on public.executions;
create trigger executions_touch_idea_updated_at
after insert on public.executions
for each row execute function public.touch_idea_activity_updated_at();

create index if not exists ideas_visibility_status_updated_at_idx
on public.ideas(visibility, status, updated_at desc);
