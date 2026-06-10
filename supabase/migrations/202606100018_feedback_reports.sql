create table if not exists public.feedback_reports (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete set null,
  type text not null check (type in ('bug', 'question', 'improvement', 'other')),
  content text not null check (length(trim(content)) > 0),
  page_url text,
  contact text,
  created_at timestamptz not null default now()
);

grant insert on table public.feedback_reports to anon, authenticated;

alter table public.feedback_reports enable row level security;

drop policy if exists "anyone can create feedback reports" on public.feedback_reports;
create policy "anyone can create feedback reports" on public.feedback_reports
for insert with check (
  user_id is null
  or auth.uid() = user_id
);

create index if not exists feedback_reports_created_at_idx
on public.feedback_reports(created_at desc);
