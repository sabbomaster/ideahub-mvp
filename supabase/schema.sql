create extension if not exists "pgcrypto";

create type public.idea_type as enum ('rough', 'serious');
create type public.like_target_type as enum ('idea', 'comment');
create type public.report_target_type as enum ('idea', 'comment', 'profile');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique,
  display_name text,
  bio text,
  avatar_url text,
  credit_score integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.ideas (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  title text not null check (char_length(title) <= 120),
  body text not null,
  type public.idea_type not null default 'rough',
  status text not null default 'active' check (status in ('active', 'completed', 'archived')),
  status_before_archive text check (status_before_archive in ('active', 'completed')),
  source text not null default 'manual' check (source in ('manual', 'mental_seesaw')),
  visibility text not null default 'public' check (visibility in ('public', 'private')),
  execution_permission text not null default 'public' check (execution_permission in ('owner_only', 'public')),
  image_url text,
  image_urls text[] not null default '{}',
  archived_at timestamptz,
  hidden_at timestamptz,
  delete_scheduled_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.comments (
  id uuid primary key default gen_random_uuid(),
  idea_id uuid not null references public.ideas(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  body text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.likes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  target_type public.like_target_type not null,
  target_id uuid not null,
  created_at timestamptz not null default now(),
  unique (user_id, target_type, target_id)
);

create table public.executions (
  id uuid primary key default gen_random_uuid(),
  idea_id uuid not null references public.ideas(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  kind text not null default 'report' check (kind in ('self', 'report')),
  note text,
  created_at timestamptz not null default now(),
  unique (idea_id, user_id)
);

create table public.reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references public.profiles(id) on delete cascade,
  target_type public.report_target_type not null,
  target_id uuid not null,
  reason text not null,
  created_at timestamptz not null default now()
);

create table public.feedback_reports (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete set null,
  type text not null check (type in ('bug', 'question', 'improvement', 'other')),
  content text not null check (length(trim(content)) > 0),
  page_url text,
  contact text,
  created_at timestamptz not null default now()
);

create table public.mental_seesaws (
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

create table public.mental_seesaw_items (
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

create table public.mental_seesaw_suggestions (
  id uuid primary key default gen_random_uuid(),
  seesaw_id uuid not null references public.mental_seesaws(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  body text not null,
  created_at timestamptz not null default now()
);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_set_updated_at before update on public.profiles
for each row execute function public.set_updated_at();

create trigger ideas_set_updated_at before update on public.ideas
for each row execute function public.set_updated_at();

create trigger comments_set_updated_at before update on public.comments
for each row execute function public.set_updated_at();

create trigger mental_seesaws_set_updated_at before update on public.mental_seesaws
for each row execute function public.set_updated_at();

create trigger mental_seesaw_items_set_updated_at before update on public.mental_seesaw_items
for each row execute function public.set_updated_at();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, username, display_name)
  values (
    new.id,
    left(split_part(new.email, '@', 1), 24) || '-' || substr(new.id::text, 1, 8),
    coalesce(new.raw_user_meta_data ->> 'display_name', split_part(new.email, '@', 1))
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

insert into public.profiles (id, username, display_name)
select
  users.id,
  left(split_part(users.email, '@', 1), 24) || '-' || substr(users.id::text, 1, 8),
  split_part(users.email, '@', 1)
from auth.users
where not exists (
  select 1 from public.profiles where profiles.id = users.id
)
on conflict (id) do nothing;

create or replace function public.add_credit(target_user_id uuid, amount integer)
returns void
language sql
security definer set search_path = public
as $$
  update public.profiles
  set credit_score = greatest(0, credit_score + amount),
      updated_at = now()
  where id = target_user_id;
$$;

grant select, insert, update, delete on table public.ideas to authenticated;

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

create trigger likes_add_credit
after insert on public.likes
for each row execute function public.credit_for_like();

create or replace function public.credit_for_execution()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  perform public.add_credit(new.user_id, 5);
  return new;
end;
$$;

create trigger executions_add_credit
after insert on public.executions
for each row execute function public.credit_for_execution();

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

grant execute on function public.credit_for_imagined_tip(uuid) to authenticated;
grant select, insert on table public.profiles to authenticated;
grant update (username, display_name, bio, avatar_url) on table public.profiles to authenticated;
grant select on table public.profiles to anon;
grant select on table public.ideas to anon;
grant select on table public.comments to anon;
grant select on table public.likes to anon;
grant select on table public.executions to anon;
grant select, insert, update, delete on table public.comments to authenticated;
grant select, insert, delete on table public.likes to authenticated;
grant select, insert, delete on table public.executions to authenticated;
grant insert on table public.reports to authenticated;
grant insert on table public.feedback_reports to anon, authenticated;
grant usage on schema storage to anon, authenticated;
grant select on table storage.buckets to anon, authenticated;
grant select, insert, update, delete on table storage.objects to authenticated;
grant select on table storage.objects to anon;

alter table public.profiles enable row level security;
alter table public.ideas enable row level security;
alter table public.comments enable row level security;
alter table public.likes enable row level security;
alter table public.executions enable row level security;
alter table public.reports enable row level security;
alter table public.feedback_reports enable row level security;
alter table public.mental_seesaws enable row level security;
alter table public.mental_seesaw_items enable row level security;
alter table public.mental_seesaw_suggestions enable row level security;

create policy "profiles are public" on public.profiles
for select using (true);

create policy "users can update own profile" on public.profiles
for update using (auth.uid() = id) with check (auth.uid() = id);

create policy "users can insert own profile" on public.profiles
for insert with check (auth.uid() = id);

create policy "public ideas are readable" on public.ideas
for select using ((visibility = 'public' and status in ('active', 'completed')) or auth.uid() = user_id);

create policy "authenticated users can create ideas" on public.ideas
for insert with check (auth.uid() = user_id);

create policy "authors can update own ideas" on public.ideas
for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "authors can delete archived ideas" on public.ideas
for delete using (auth.uid() = user_id and status = 'archived');

create policy "comments are public" on public.comments
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

create policy "comment authors can update" on public.comments
for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "comment authors can delete" on public.comments
for delete using (auth.uid() = user_id);

create policy "likes are public" on public.likes
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

create policy "authenticated users can like" on public.likes
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

create policy "users can remove own likes" on public.likes
for delete using (auth.uid() = user_id);

create policy "executions are public" on public.executions
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

create policy "users can remove own executions" on public.executions
for delete using (auth.uid() = user_id);

create policy "users can create reports" on public.reports
for insert with check (auth.uid() = reporter_id);

create policy "anyone can create feedback reports" on public.feedback_reports
for insert with check (
  user_id is null
  or auth.uid() = user_id
);

create policy "owners can read mental seesaws" on public.mental_seesaws
for select using (auth.uid() = user_id);

create policy "users can create own mental seesaws" on public.mental_seesaws
for insert with check (auth.uid() = user_id);

create policy "users can update own mental seesaws" on public.mental_seesaws
for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "users can delete own mental seesaws" on public.mental_seesaws
for delete using (auth.uid() = user_id);

create policy "owners can read mental seesaw items" on public.mental_seesaw_items
for select using (
  exists (
    select 1 from public.mental_seesaws
    where mental_seesaws.id = mental_seesaw_items.seesaw_id
      and mental_seesaws.user_id = auth.uid()
  )
);

create policy "owners can create mental seesaw items" on public.mental_seesaw_items
for insert with check (
  auth.uid() = user_id
  and exists (
    select 1 from public.mental_seesaws
    where mental_seesaws.id = mental_seesaw_items.seesaw_id
      and mental_seesaws.user_id = auth.uid()
  )
);

create policy "owners can update mental seesaw items" on public.mental_seesaw_items
for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "owners can delete mental seesaw items" on public.mental_seesaw_items
for delete using (auth.uid() = user_id);

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

create index ideas_created_at_idx on public.ideas(created_at desc);
create index ideas_status_created_at_idx on public.ideas(status, created_at desc);
create index ideas_archived_status_created_at_idx on public.ideas(archived_at, status, created_at desc);
create index ideas_visibility_status_created_at_idx on public.ideas(visibility, status, created_at desc);
create index ideas_user_status_created_at_idx on public.ideas(user_id, status, created_at desc);
create index ideas_user_updated_at_idx on public.ideas(user_id, updated_at desc);
create index feedback_reports_created_at_idx on public.feedback_reports(created_at desc);
create index comments_idea_id_idx on public.comments(idea_id);
create index comments_user_created_at_idx on public.comments(user_id, created_at desc);
create index likes_target_idx on public.likes(target_type, target_id);
create index executions_idea_id_idx on public.executions(idea_id);
create index executions_user_created_at_idx on public.executions(user_id, created_at desc);
create index mental_seesaws_updated_at_idx on public.mental_seesaws(updated_at desc);
create index mental_seesaws_user_updated_at_idx on public.mental_seesaws(user_id, updated_at desc);
create index mental_seesaw_items_seesaw_id_idx on public.mental_seesaw_items(seesaw_id);
create index mental_seesaw_suggestions_seesaw_id_idx on public.mental_seesaw_suggestions(seesaw_id);

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('avatars', 'avatars', true, 2097152, array['image/jpeg', 'image/png', 'image/webp', 'image/gif']),
  ('idea-images', 'idea-images', false, 5242880, array['image/jpeg', 'image/png', 'image/webp', 'image/gif'])
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

create policy "avatars are public" on storage.objects
for select using (bucket_id = 'avatars');

create policy "users can upload own avatars" on storage.objects
for insert with check (
  bucket_id = 'avatars'
  and auth.role() = 'authenticated'
  and (storage.foldername(name))[1] = auth.uid()::text
);

create policy "users can update own avatars" on storage.objects
for update using (
  bucket_id = 'avatars'
  and auth.role() = 'authenticated'
  and (storage.foldername(name))[1] = auth.uid()::text
) with check (
  bucket_id = 'avatars'
  and auth.role() = 'authenticated'
  and (storage.foldername(name))[1] = auth.uid()::text
);

create policy "users can delete own avatars" on storage.objects
for delete using (
  bucket_id = 'avatars'
  and auth.role() = 'authenticated'
  and (storage.foldername(name))[1] = auth.uid()::text
);

create policy "idea images are visible with ideas" on storage.objects
for select using (
  bucket_id = 'idea-images'
  and (
    (auth.role() = 'authenticated' and (storage.foldername(name))[1] = auth.uid()::text)
    or exists (
      select 1
      from public.ideas
      where storage.objects.name = any(ideas.image_urls)
        and ideas.visibility = 'public'
        and ideas.status in ('active', 'completed')
    )
    or exists (
      select 1
      from public.ideas
      where storage.objects.name = any(ideas.image_urls)
        and ideas.user_id = auth.uid()
    )
    or exists (
      select 1
      from public.ideas
      where ideas.image_url = storage.objects.name
        and ideas.visibility = 'public'
        and ideas.status in ('active', 'completed')
    )
    or exists (
      select 1
      from public.ideas
      where ideas.image_url = storage.objects.name
        and ideas.user_id = auth.uid()
    )
  )
);

create policy "users can upload own idea images" on storage.objects
for insert with check (
  bucket_id = 'idea-images'
  and auth.role() = 'authenticated'
  and (storage.foldername(name))[1] = auth.uid()::text
);

create policy "users can update own idea images" on storage.objects
for update using (
  bucket_id = 'idea-images'
  and auth.role() = 'authenticated'
  and (storage.foldername(name))[1] = auth.uid()::text
) with check (
  bucket_id = 'idea-images'
  and auth.role() = 'authenticated'
  and (storage.foldername(name))[1] = auth.uid()::text
);

create policy "users can delete own idea images" on storage.objects
for delete using (
  bucket_id = 'idea-images'
  and auth.role() = 'authenticated'
  and (storage.foldername(name))[1] = auth.uid()::text
);
