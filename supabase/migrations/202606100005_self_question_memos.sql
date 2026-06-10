drop policy if exists "visible mental seesaw suggestions are readable" on public.mental_seesaw_suggestions;
drop policy if exists "authenticated users can suggest mental seesaw views" on public.mental_seesaw_suggestions;
drop policy if exists "owners can read self question memos" on public.mental_seesaw_suggestions;
drop policy if exists "owners can create self question memos" on public.mental_seesaw_suggestions;
drop policy if exists "owners can update self question memos" on public.mental_seesaw_suggestions;
drop policy if exists "owners can delete self question memos" on public.mental_seesaw_suggestions;

create policy "owners can read self question memos" on public.mental_seesaw_suggestions
for select using (
  exists (
    select 1 from public.mental_seesaws
    where mental_seesaws.id = mental_seesaw_suggestions.seesaw_id
      and mental_seesaws.user_id = auth.uid()
  )
);

create policy "owners can create self question memos" on public.mental_seesaw_suggestions
for insert with check (
  auth.uid() = user_id
  and exists (
    select 1 from public.mental_seesaws
    where mental_seesaws.id = mental_seesaw_suggestions.seesaw_id
      and mental_seesaws.user_id = auth.uid()
  )
);

create policy "owners can update self question memos" on public.mental_seesaw_suggestions
for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "owners can delete self question memos" on public.mental_seesaw_suggestions
for delete using (auth.uid() = user_id);
