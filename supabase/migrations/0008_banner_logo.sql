-- Chunk 13 — store the TMDB logo_path for the primary production company.
--
-- Lets guess cards show a company logo image (Dharma Productions,
-- Red Chillies, Yash Raj Films, …) instead of just the text label.
-- Nullable because many smaller labels on TMDB don't have logos.

alter table movies
  add column if not exists banner_logo_path text;
