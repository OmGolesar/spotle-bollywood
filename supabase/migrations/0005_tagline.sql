-- Add tagline for the Spotle-Movies-style hint picker (Chunk 6f).
-- A film's marketing tagline is one of the three hint categories a
-- player can pick. Default empty so films without a known tagline
-- just hide that category from the picker.

alter table movies
  add column if not exists tagline text not null default '';
