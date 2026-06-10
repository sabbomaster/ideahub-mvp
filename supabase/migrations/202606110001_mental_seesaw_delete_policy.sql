alter table public.mental_seesaws enable row level security;

drop policy if exists "users can delete own mental seesaws" on public.mental_seesaws;
create policy "users can delete own mental seesaws" on public.mental_seesaws
for delete using (auth.uid() = user_id);

grant select, insert, update, delete on table public.mental_seesaws to authenticated;
