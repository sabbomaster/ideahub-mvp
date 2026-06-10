create index if not exists ideas_visibility_status_created_at_idx
on public.ideas (visibility, status, created_at desc);

create index if not exists ideas_user_status_created_at_idx
on public.ideas (user_id, status, created_at desc);

create index if not exists ideas_user_updated_at_idx
on public.ideas (user_id, updated_at desc);

create index if not exists executions_user_created_at_idx
on public.executions (user_id, created_at desc);

create index if not exists comments_user_created_at_idx
on public.comments (user_id, created_at desc);
