-- Spotle Bollywood — Row-Level Security (§4.2 of the v1 design spec).
--
-- Non-negotiable rule: the anonymous Supabase role must NEVER be able to
-- read `daily_puzzles.movie_id`. The service role (used only from the
-- Next.js API routes) bypasses RLS.
--
-- To enforce the "no movie_id to anon" rule at the postgres layer we:
--   1. enable RLS on daily_puzzles with no public SELECT policy
--   2. expose a security-definer view `daily_puzzles_public` that returns
--      only (puzzle_date, difficulty, status) — the catalog of what's
--      scheduled, with the answer withheld
--   3. grant anon SELECT only on movies (minus trivia/hints via a view) and
--      on the public view above

-- Enable RLS on all tables that could leak answer information ---------------

alter table movies                  enable row level security;
alter table movie_pools             enable row level security;
alter table daily_puzzles           enable row level security;
alter table players                 enable row level security;
alter table plays                   enable row level security;
alter table streaks                 enable row level security;
alter table director_edges          enable row level security;
alter table music_director_edges    enable row level security;

-- Policies: no SELECT policies at all for daily_puzzles ---------------------
-- (RLS enabled + no policy = all rows invisible to anon.)

-- Movies: anon can read catalog columns only via a view ---------------------

create or replace view movies_catalog as
  select id, title, title_alternates, year, poster_url
  from movies;

grant select on movies_catalog to anon;

-- Edge tables are safe to read publicly (they're just name pairs).
drop policy if exists director_edges_read_all on director_edges;
create policy director_edges_read_all on director_edges
  for select to anon, authenticated using (true);

drop policy if exists music_director_edges_read_all on music_director_edges;
create policy music_director_edges_read_all on music_director_edges
  for select to anon, authenticated using (true);

-- Movie pools expose only (difficulty, movie_id) — safe, since catalog is public.
drop policy if exists movie_pools_read_all on movie_pools;
create policy movie_pools_read_all on movie_pools
  for select to anon, authenticated using (true);

-- Public view of the schedule WITHOUT movie_id ------------------------------

create or replace view daily_puzzles_public as
  select puzzle_date, difficulty, status
  from daily_puzzles;

grant select on daily_puzzles_public to anon;

-- Players / plays / streaks are server-managed only -------------------------
-- No anon policies; API routes using the service role bypass RLS.

-- Sanity: revoke base-table SELECT on movies so anon has to go through the
-- view (which omits trivia/hints we may want to withhold until end-screen).
revoke select on movies from anon;

-- Grant anon read on the strictly-public views only.
grant usage on schema public to anon;
