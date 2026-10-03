-- Chunk 9 — per-movie people-image map for GuessCard portraits.
--
-- Stores a {name -> tmdb profile_path} map on each movie so the client can
-- render circular director/cast portraits without a separate credits fetch.
-- Backfilled by `npm run tmdb:backfill-people`; populated by `tmdb:import`
-- for new films going forward.

alter table movies
  add column if not exists people_images jsonb not null default '{}'::jsonb;
