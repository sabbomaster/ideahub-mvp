drop policy if exists "authors can update own ideas" on public.ideas;

create policy "authors can update own ideas" on public.ideas
for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop trigger if exists ideas_set_updated_at on public.ideas;

create trigger ideas_set_updated_at before update on public.ideas
for each row execute function public.set_updated_at();
