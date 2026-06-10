create table if not exists public.mental_seesaws (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  description text,
  context text,
  final_decision text,
  next_action text,
  is_public boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.mental_seesaw_items (
  id uuid primary key default gen_random_uuid(),
  seesaw_id uuid not null references public.mental_seesaws(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  kind text not null check (kind in ('positive', 'negative')),
  content text not null,
  weight integer not null default 3 check (weight between 1 and 6),
  relief_method text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.mental_seesaw_suggestions (
  id uuid primary key default gen_random_uuid(),
  seesaw_id uuid not null references public.mental_seesaws(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  body text not null,
  created_at timestamptz not null default now()
);

drop trigger if exists mental_seesaws_set_updated_at on public.mental_seesaws;
create trigger mental_seesaws_set_updated_at before update on public.mental_seesaws
for each row execute function public.set_updated_at();

drop trigger if exists mental_seesaw_items_set_updated_at on public.mental_seesaw_items;
create trigger mental_seesaw_items_set_updated_at before update on public.mental_seesaw_items
for each row execute function public.set_updated_at();

alter table public.mental_seesaws enable row level security;
alter table public.mental_seesaw_items enable row level security;
alter table public.mental_seesaw_suggestions enable row level security;

drop policy if exists "visible mental seesaws are readable" on public.mental_seesaws;
create policy "visible mental seesaws are readable" on public.mental_seesaws
for select using (is_public = true or auth.uid() = user_id);

drop policy if exists "users can create own mental seesaws" on public.mental_seesaws;
create policy "users can create own mental seesaws" on public.mental_seesaws
for insert with check (auth.uid() = user_id);

drop policy if exists "users can update own mental seesaws" on public.mental_seesaws;
create policy "users can update own mental seesaws" on public.mental_seesaws
for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "visible mental seesaw items are readable" on public.mental_seesaw_items;
create policy "visible mental seesaw items are readable" on public.mental_seesaw_items
for select using (
  exists (
    select 1 from public.mental_seesaws
    where mental_seesaws.id = mental_seesaw_items.seesaw_id
      and (mental_seesaws.is_public = true or mental_seesaws.user_id = auth.uid())
  )
);

drop policy if exists "owners can create mental seesaw items" on public.mental_seesaw_items;
create policy "owners can create mental seesaw items" on public.mental_seesaw_items
for insert with check (
  auth.uid() = user_id
  and exists (
    select 1 from public.mental_seesaws
    where mental_seesaws.id = mental_seesaw_items.seesaw_id
      and mental_seesaws.user_id = auth.uid()
  )
);

drop policy if exists "owners can update mental seesaw items" on public.mental_seesaw_items;
create policy "owners can update mental seesaw items" on public.mental_seesaw_items
for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "owners can delete mental seesaw items" on public.mental_seesaw_items;
create policy "owners can delete mental seesaw items" on public.mental_seesaw_items
for delete using (auth.uid() = user_id);

drop policy if exists "visible mental seesaw suggestions are readable" on public.mental_seesaw_suggestions;
create policy "visible mental seesaw suggestions are readable" on public.mental_seesaw_suggestions
for select using (
  exists (
    select 1 from public.mental_seesaws
    where mental_seesaws.id = mental_seesaw_suggestions.seesaw_id
      and (mental_seesaws.is_public = true or mental_seesaws.user_id = auth.uid())
  )
);

drop policy if exists "authenticated users can suggest mental seesaw views" on public.mental_seesaw_suggestions;
create policy "authenticated users can suggest mental seesaw views" on public.mental_seesaw_suggestions
for insert with check (
  auth.uid() = user_id
  and exists (
    select 1 from public.mental_seesaws
    where mental_seesaws.id = mental_seesaw_suggestions.seesaw_id
      and (mental_seesaws.is_public = true or mental_seesaws.user_id = auth.uid())
  )
);

create index if not exists mental_seesaws_updated_at_idx on public.mental_seesaws(updated_at desc);
create index if not exists mental_seesaw_items_seesaw_id_idx on public.mental_seesaw_items(seesaw_id);
create index if not exists mental_seesaw_suggestions_seesaw_id_idx on public.mental_seesaw_suggestions(seesaw_id);
