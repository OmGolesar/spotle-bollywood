-- Allow deleting a daily_puzzles row when plays reference it.
-- Without this, "Unschedule" in /admin fails once anyone has played the
-- puzzle (FK plays_puzzle_date_difficulty_fkey rejects the delete).
--
-- Cascading the delete is the right semantics for the admin: if the
-- puzzle is unscheduled, the play records against that specific
-- (date, difficulty) combo are no longer meaningful — the player will
-- start fresh if a new puzzle is scheduled for the same slot.

alter table plays
  drop constraint if exists plays_puzzle_date_difficulty_fkey;

alter table plays
  add constraint plays_puzzle_date_difficulty_fkey
  foreign key (puzzle_date, difficulty)
  references daily_puzzles (puzzle_date, difficulty)
  on delete cascade;
