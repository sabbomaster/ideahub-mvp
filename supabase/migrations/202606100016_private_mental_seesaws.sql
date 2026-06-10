drop policy if exists "visible mental seesaws are readable" on public.mental_seesaws;
drop policy if exists "owners can read mental seesaws" on public.mental_seesaws;
create policy "owners can read mental seesaws" on public.mental_seesaws
for select using (auth.uid() = user_id);

drop policy if exists "users can delete own mental seesaws" on public.mental_seesaws;
create policy "users can delete own mental seesaws" on public.mental_seesaws
for delete using (auth.uid() = user_id);

drop policy if exists "visible mental seesaw items are readable" on public.mental_seesaw_items;
drop policy if exists "owners can read mental seesaw items" on public.mental_seesaw_items;
create policy "owners can read mental seesaw items" on public.mental_seesaw_items
for select using (
  exists (
    select 1
    from public.mental_seesaws
    where mental_seesaws.id = mental_seesaw_items.seesaw_id
      and mental_seesaws.user_id = auth.uid()
  )
);

drop policy if exists "visible mental seesaw suggestions are readable" on public.mental_seesaw_suggestions;
drop policy if exists "authenticated users can suggest mental seesaw views" on public.mental_seesaw_suggestions;
drop policy if exists "owners can read self question memos" on public.mental_seesaw_suggestions;
create policy "owners can read self question memos" on public.mental_seesaw_suggestions
for select using (
  exists (
    select 1
    from public.mental_seesaws
    where mental_seesaws.id = mental_seesaw_suggestions.seesaw_id
      and mental_seesaws.user_id = auth.uid()
  )
);

drop policy if exists "owners can create self question memos" on public.mental_seesaw_suggestions;
create policy "owners can create self question memos" on public.mental_seesaw_suggestions
for insert with check (
  auth.uid() = user_id
  and exists (
    select 1
    from public.mental_seesaws
    where mental_seesaws.id = mental_seesaw_suggestions.seesaw_id
      and mental_seesaws.user_id = auth.uid()
  )
);

create index if not exists mental_seesaws_user_updated_at_idx
on public.mental_seesaws(user_id, updated_at desc);
