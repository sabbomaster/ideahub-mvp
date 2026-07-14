create table if not exists public.worry_organization_histories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  seesaw_id uuid not null references public.mental_seesaws(id) on delete cascade,
  initial_input text not null,
  mode text not null check (mode in ('gentle', 'deep')),
  question_answers jsonb not null default '[]'::jsonb,
  displayed_options jsonb not null default '[]'::jsonb,
  selected_option jsonb not null,
  idea_posted boolean not null default false,
  idea_id uuid references public.ideas(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint worry_history_question_answers_array check (jsonb_typeof(question_answers) = 'array'),
  constraint worry_history_displayed_options_array check (jsonb_typeof(displayed_options) = 'array'),
  constraint worry_history_selected_option_object check (jsonb_typeof(selected_option) = 'object')
);

create index if not exists worry_organization_histories_user_created_idx
on public.worry_organization_histories(user_id, created_at desc);

create index if not exists worry_organization_histories_seesaw_idx
on public.worry_organization_histories(seesaw_id);

alter table public.worry_organization_histories enable row level security;

drop policy if exists "users can read own worry histories" on public.worry_organization_histories;
create policy "users can read own worry histories" on public.worry_organization_histories
for select using (auth.uid() = user_id);

drop policy if exists "users can create own worry histories" on public.worry_organization_histories;
create policy "users can create own worry histories" on public.worry_organization_histories
for insert with check (
  auth.uid() = user_id
  and exists (
    select 1 from public.mental_seesaws
    where mental_seesaws.id = seesaw_id
      and mental_seesaws.user_id = auth.uid()
  )
);

drop policy if exists "users can update own worry histories" on public.worry_organization_histories;
create policy "users can update own worry histories" on public.worry_organization_histories
for update using (auth.uid() = user_id) with check (
  auth.uid() = user_id
  and exists (
    select 1 from public.mental_seesaws
    where mental_seesaws.id = seesaw_id
      and mental_seesaws.user_id = auth.uid()
  )
);

drop policy if exists "users can delete own worry histories" on public.worry_organization_histories;
create policy "users can delete own worry histories" on public.worry_organization_histories
for delete using (auth.uid() = user_id);

grant select, insert, update, delete on table public.worry_organization_histories to authenticated;
