revoke execute on function public.add_credit(uuid, integer) from authenticated;

create or replace function public.credit_for_imagined_tip(target_idea_id uuid)
returns void
language plpgsql
security definer set search_path = public
as $$
declare
  target_owner uuid;
begin
  select user_id into target_owner
  from public.ideas
  where id = target_idea_id
    and status in ('active', 'completed');

  if target_owner is not null and target_owner <> auth.uid() then
    perform public.add_credit(target_owner, 3);
  end if;
end;
$$;

grant execute on function public.credit_for_imagined_tip(uuid) to authenticated;

revoke update on table public.profiles from authenticated;
grant update (username, display_name, bio, avatar_url) on table public.profiles to authenticated;
grant select, insert on table public.profiles to authenticated;
grant select on table public.profiles to anon;
grant select on table public.ideas to anon;
grant select on table public.comments to anon;
grant select on table public.likes to anon;
grant select on table public.executions to anon;
grant select, insert, update, delete on table public.comments to authenticated;
grant select, insert, delete on table public.likes to authenticated;
grant select, insert, delete on table public.executions to authenticated;
grant insert on table public.reports to authenticated;

drop policy if exists "authenticated users can report execution" on public.executions;
drop policy if exists "users can remove own executions" on public.executions;

create policy "users can create permitted executions" on public.executions
for insert with check (
  auth.uid() = user_id
  and exists (
    select 1
    from public.ideas
    where ideas.id = executions.idea_id
      and ideas.status in ('active', 'completed')
      and (
        (
          executions.kind = 'self'
          and ideas.user_id = auth.uid()
        )
        or (
          executions.kind = 'report'
          and ideas.user_id <> auth.uid()
          and ideas.source <> 'mental_seesaw'
          and ideas.execution_permission = 'public'
        )
      )
  )
);

create policy "users can remove own executions" on public.executions
for delete using (auth.uid() = user_id);

drop policy if exists "authenticated users can comment" on public.comments;

create policy "authenticated users can comment on visible ideas" on public.comments
for insert with check (
  auth.uid() = user_id
  and exists (
    select 1
    from public.ideas
    where ideas.id = comments.idea_id
      and ideas.status in ('active', 'completed')
  )
);
