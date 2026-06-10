grant select, insert, update, delete on table public.mental_seesaws to authenticated;
grant select, insert, update, delete on table public.mental_seesaw_items to authenticated;
grant select, insert, update, delete on table public.mental_seesaw_suggestions to authenticated;

grant usage, select, update on all sequences in schema public to authenticated;
