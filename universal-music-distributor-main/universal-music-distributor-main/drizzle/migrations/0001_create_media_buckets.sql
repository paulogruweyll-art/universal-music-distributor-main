insert into storage.buckets (id, name, public)
values
  ('covers', 'covers', false),
  ('audio', 'audio', false)
on conflict (id) do update
set public = excluded.public;
