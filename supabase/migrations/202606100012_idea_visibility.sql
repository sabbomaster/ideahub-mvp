alter table public.ideas
add column if not exists visibility text not null default 'public';

alter table public.ideas
drop constraint if exists ideas_visibility_check;

alter table public.ideas
add constraint ideas_visibility_check
check (visibility in ('public', 'private'));

update public.ideas
set visibility = 'private'
where source = 'mental_seesaw';

drop policy if exists "public ideas are readable" on public.ideas;

create policy "public ideas are readable" on public.ideas
for select using ((visibility = 'public' and status in ('active', 'completed')) or auth.uid() = user_id);

drop policy if exists "comments are public" on public.comments;

create policy "comments are visible with their ideas" on public.comments
for select using (
  exists (
    select 1
    from public.ideas
    where ideas.id = comments.idea_id
      and (
        (ideas.visibility = 'public' and ideas.status in ('active', 'completed'))
        or ideas.user_id = auth.uid()
      )
  )
);

drop policy if exists "authenticated users can comment" on public.comments;
drop policy if exists "authenticated users can comment on visible ideas" on public.comments;

create policy "authenticated users can comment on visible ideas" on public.comments
for insert with check (
  auth.uid() = user_id
  and exists (
    select 1
    from public.ideas
    where ideas.id = comments.idea_id
      and ideas.status in ('active', 'completed')
      and (ideas.visibility = 'public' or ideas.user_id = auth.uid())
  )
);

drop policy if exists "likes are public" on public.likes;

create policy "likes are visible with their targets" on public.likes
for select using (
  (
    target_type = 'idea'
    and exists (
      select 1 from public.ideas
      where ideas.id = likes.target_id
        and (
          (ideas.visibility = 'public' and ideas.status in ('active', 'completed'))
          or ideas.user_id = auth.uid()
        )
    )
  )
  or (
    target_type = 'comment'
    and exists (
      select 1 from public.comments
      join public.ideas on ideas.id = comments.idea_id
      where comments.id = likes.target_id
        and (
          (ideas.visibility = 'public' and ideas.status in ('active', 'completed'))
          or ideas.user_id = auth.uid()
        )
    )
  )
);

drop policy if exists "authenticated users can like" on public.likes;

create policy "authenticated users can like visible targets" on public.likes
for insert with check (
  auth.uid() = user_id
  and (
    (
      target_type = 'idea'
      and exists (
        select 1 from public.ideas
        where ideas.id = likes.target_id
          and ideas.status in ('active', 'completed')
          and (ideas.visibility = 'public' or ideas.user_id = auth.uid())
      )
    )
    or (
      target_type = 'comment'
      and exists (
        select 1 from public.comments
        join public.ideas on ideas.id = comments.idea_id
        where comments.id = likes.target_id
          and ideas.status in ('active', 'completed')
          and (ideas.visibility = 'public' or ideas.user_id = auth.uid())
      )
    )
  )
);

drop policy if exists "executions are public" on public.executions;

create policy "executions are visible with their ideas" on public.executions
for select using (
  user_id = auth.uid()
  or exists (
    select 1
    from public.ideas
    where ideas.id = executions.idea_id
      and (
        (ideas.visibility = 'public' and ideas.status in ('active', 'completed'))
        or ideas.user_id = auth.uid()
      )
  )
);

drop policy if exists "users can create permitted executions" on public.executions;

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
          and ideas.visibility = 'public'
          and ideas.source <> 'mental_seesaw'
          and ideas.execution_permission = 'public'
        )
      )
  )
);

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
    and status in ('active', 'completed')
    and visibility = 'public';

  if target_owner is not null and target_owner <> auth.uid() then
    perform public.add_credit(target_owner, 3);
  end if;
end;
$$;

grant select, insert, update, delete on table public.ideas to authenticated;
grant select on table public.ideas to anon;

create or replace function public.credit_for_like()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  target_owner uuid;
begin
  if new.target_type = 'idea' then
    select user_id into target_owner
    from public.ideas
    where id = new.target_id
      and visibility = 'public'
      and status in ('active', 'completed');
  elsif new.target_type = 'comment' then
    select comments.user_id into target_owner
    from public.comments
    join public.ideas on ideas.id = comments.idea_id
    where comments.id = new.target_id
      and ideas.visibility = 'public'
      and ideas.status in ('active', 'completed');
  end if;

  if target_owner is not null and target_owner <> new.user_id then
    perform public.add_credit(target_owner, 1);
  end if;

  return new;
end;
$$;
