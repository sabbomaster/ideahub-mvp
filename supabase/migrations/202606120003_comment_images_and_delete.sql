alter table public.comments
add column if not exists image_path text;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('comment-images', 'comment-images', false, 5242880, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "comment images are visible with comments" on storage.objects;
create policy "comment images are visible with comments" on storage.objects
for select using (
  bucket_id = 'comment-images'
  and (
    (auth.role() = 'authenticated' and (storage.foldername(name))[1] = auth.uid()::text)
    or exists (
      select 1
      from public.comments
      join public.ideas on ideas.id = comments.idea_id
      where comments.image_path = storage.objects.name
        and (
          (ideas.visibility = 'public' and ideas.status in ('active', 'completed'))
          or ideas.user_id = auth.uid()
        )
    )
  )
);

drop policy if exists "users can upload own comment images" on storage.objects;
create policy "users can upload own comment images" on storage.objects
for insert with check (
  bucket_id = 'comment-images'
  and auth.role() = 'authenticated'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "users can delete own comment images" on storage.objects;
create policy "users can delete own comment images" on storage.objects
for delete using (
  bucket_id = 'comment-images'
  and auth.role() = 'authenticated'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "comment authors can delete" on public.comments;
create policy "comment authors can delete" on public.comments
for delete using (auth.uid() = user_id);
