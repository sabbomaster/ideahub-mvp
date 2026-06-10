update public.mental_seesaw_items
set weight = least(6, greatest(1, weight));

alter table public.mental_seesaw_items
drop constraint if exists mental_seesaw_items_weight_check;

alter table public.mental_seesaw_items
add constraint mental_seesaw_items_weight_check check (weight between 1 and 6);
