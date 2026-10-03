-- Track which hint categories a player has revealed in a given play,
-- so the UI can grey out used categories (Chunk 6f).
--
-- Example value: '["tagline", "cast"]'. Deprecates `hints_used` as the
-- counter — its length is the use count. hints_used stays for a few
-- releases for backward compatibility, kept in sync by the server.

alter table plays
  add column if not exists hints_revealed_categories jsonb not null default '[]'::jsonb;
