alter table public.ideas
add column if not exists image_urls text[] not null default '{}';

update public.ideas
set image_urls = array[image_url]
where image_url is not null
  and coalesce(array_length(image_urls, 1), 0) = 0;

drop policy if exists "idea images are visible with ideas" on storage.objects;
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
