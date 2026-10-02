-- Spotle Bollywood — initial schema (§5 of the v1 design spec).
-- Six core tables + two edge-cache tables rebuilt nightly from `movies`.

create extension if not exists "pgcrypto";
create extension if not exists "pg_trgm";

-- Enums ---------------------------------------------------------------------

do $$ begin
  create type difficulty as enum ('easy', 'medium', 'hard');
exception when duplicate_object then null; end $$;

do $$ begin
  create type puzzle_status as enum ('scheduled', 'live', 'archived');
exception when duplicate_object then null; end $$;

do $$ begin
  create type play_outcome as enum ('in_progress', 'won', 'lost');
exception when duplicate_object then null; end $$;

do $$ begin
  create type data_quality as enum ('verified', 'tmdb_only', 'partial');
exception when duplicate_object then null; end $$;

-- movies --------------------------------------------------------------------

create table if not exists movies (
  id                 uuid primary key default gen_random_uuid(),
  tmdb_id            integer unique,
  title              text not null,
  title_alternates   text[] not null default '{}',
  year               integer not null,
  director           text[] not null default '{}',
  cast_top3          text[] not null default '{}',
  music_directors    text[] not null default '{}',
  banner             text not null,
  banner_parent      text,
  genres             text[] not null default '{}',
  box_office_cr      numeric,
  imdb_score         numeric,
  poster_url         text not null,
  trivia             text not null default '',
  where_to_watch_url text,
  hint_easy          text not null default '',
  hint_medium        text not null default '',
  hint_hard          text not null default '',
  data_quality       data_quality not null default 'partial',
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

create index if not exists movies_title_trgm_idx
  on movies using gin (title gin_trgm_ops);

create index if not exists movies_title_alternates_idx
  on movies using gin (title_alternates);

-- movie_pools ---------------------------------------------------------------

create table if not exists movie_pools (
  movie_id   uuid not null references movies(id) on delete cascade,
  difficulty difficulty not null,
  added_at   timestamptz not null default now(),
  primary key (movie_id, difficulty)
);

create index if not exists movie_pools_by_difficulty_idx
  on movie_pools (difficulty, movie_id);

-- daily_puzzles -------------------------------------------------------------
-- RLS below prevents anon from reading movie_id.

create table if not exists daily_puzzles (
  puzzle_date date not null,
  difficulty  difficulty not null,
  movie_id    uuid not null references movies(id),
  status      puzzle_status not null default 'scheduled',
  created_at  timestamptz not null default now(),
  primary key (puzzle_date, difficulty)
);

create index if not exists daily_puzzles_status_idx
  on daily_puzzles (status, puzzle_date);

-- players -------------------------------------------------------------------

create table if not exists players (
  id         uuid primary key,
  created_at timestamptz not null default now(),
  user_id    uuid
);

-- plays ---------------------------------------------------------------------

create table if not exists plays (
  id            uuid primary key default gen_random_uuid(),
  player_id     uuid not null references players(id) on delete cascade,
  puzzle_date   date not null,
  difficulty    difficulty not null,
  guesses       jsonb not null default '[]'::jsonb,
  hints_used    integer not null default 0,
  outcome       play_outcome not null default 'in_progress',
  won_on_guess  integer,
  started_at    timestamptz not null default now(),
  completed_at  timestamptz,
  unique (player_id, puzzle_date, difficulty),
  foreign key (puzzle_date, difficulty) references daily_puzzles (puzzle_date, difficulty)
);

create index if not exists plays_by_player_idx
  on plays (player_id, puzzle_date desc);

-- streaks -------------------------------------------------------------------

create table if not exists streaks (
  player_id        uuid not null references players(id) on delete cascade,
  difficulty       difficulty not null,
  current_streak   integer not null default 0,
  max_streak       integer not null default 0,
  total_plays      integer not null default 0,
  total_wins       integer not null default 0,
  last_played_date date,
  primary key (player_id, difficulty)
);

-- edge-cache tables ---------------------------------------------------------
-- Rebuilt nightly via Vercel Cron so the hot path is a single read.

create table if not exists director_edges (
  director_a text not null,
  director_b text not null,
  primary key (director_a, director_b)
);

create table if not exists music_director_edges (
  md_a text not null,
  md_b text not null,
  primary key (md_a, md_b)
);

-- updated_at touch trigger for movies --------------------------------------

create or replace function set_updated_at() returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists movies_touch_updated_at on movies;
create trigger movies_touch_updated_at
  before update on movies
  for each row execute function set_updated_at();
