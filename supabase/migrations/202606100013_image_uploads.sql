alter table public.ideas
add column if not exists image_url text;

alter table public.profiles
add column if not exists avatar_url text;

grant update (username, display_name, bio, avatar_url) on table public.profiles to authenticated;

grant usage on schema storage to anon, authenticated;
grant select on table storage.buckets to anon, authenticated;
grant select, insert, update, delete on table storage.objects to authenticated;
grant select on table storage.objects to anon;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('avatars', 'avatars', true, 2097152, array['image/jpeg', 'image/png', 'image/webp', 'image/gif']),
  ('idea-images', 'idea-images', false, 5242880, array['image/jpeg', 'image/png', 'image/webp', 'image/gif'])
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "avatars are public" on storage.objects;
create policy "avatars are public" on storage.objects
for select using (bucket_id = 'avatars');

drop policy if exists "users can upload own avatars" on storage.objects;
create policy "users can upload own avatars" on storage.objects
for insert with check (
  bucket_id = 'avatars'
  and auth.role() = 'authenticated'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "users can update own avatars" on storage.objects;
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

drop policy if exists "users can delete own avatars" on storage.objects;
create policy "users can delete own avatars" on storage.objects
for delete using (
  bucket_id = 'avatars'
  and auth.role() = 'authenticated'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "idea images are visible with ideas" on storage.objects;
create policy "idea images are visible with ideas" on storage.objects
for select using (
  bucket_id = 'idea-images'
  and (
    (auth.role() = 'authenticated' and (storage.foldername(name))[1] = auth.uid()::text)
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

drop policy if exists "users can upload own idea images" on storage.objects;
create policy "users can upload own idea images" on storage.objects
for insert with check (
  bucket_id = 'idea-images'
  and auth.role() = 'authenticated'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "users can update own idea images" on storage.objects;
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

drop policy if exists "users can delete own idea images" on storage.objects;
create policy "users can delete own idea images" on storage.objects
for delete using (
  bucket_id = 'idea-images'
  and auth.role() = 'authenticated'
  and (storage.foldername(name))[1] = auth.uid()::text
);
