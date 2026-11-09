-- Row-Level Security Policies for User Authentication
-- Extends existing RLS to support authenticated users while preserving anonymous gameplay

-- ============================================================================
-- 1. PROFILES TABLE RLS
-- ============================================================================

alter table profiles enable row level security;

-- Users can read their own profile
drop policy if exists profiles_read_own on profiles;
create policy profiles_read_own on profiles
  for select
  to authenticated
  using (auth.uid() = id);

-- Users can update their own profile
drop policy if exists profiles_update_own on profiles;
create policy profiles_update_own on profiles
  for update
  to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- Users cannot delete their profile (handled by auth.users cascade)
-- Users cannot insert profiles (handled by trigger)

-- Service role can read all profiles (for admin purposes)
drop policy if exists profiles_service_read_all on profiles;
create policy profiles_service_read_all on profiles
  for select
  to service_role
  using (true);

-- ============================================================================
-- 2. PLAYERS TABLE RLS (Enhanced)
-- ============================================================================

-- Existing: no policies (server-managed via service role)
-- New: authenticated users can read their linked player data

drop policy if exists players_read_own on players;
create policy players_read_own on players
  for select
  to authenticated
  using (auth.uid() = user_id);

-- Service role retains full access (bypasses RLS)

-- ============================================================================
-- 3. PLAYS TABLE RLS (Enhanced)
-- ============================================================================

-- Authenticated users can read plays linked to their player
drop policy if exists plays_read_own on plays;
create policy plays_read_own on plays
  for select
  to authenticated
  using (
    player_id in (
      select id from players where user_id = auth.uid()
    )
  );

-- Service role retains full access for game logic

-- ============================================================================
-- 4. STREAKS TABLE RLS (Enhanced)
-- ============================================================================

-- Authenticated users can read streaks for their player
drop policy if exists streaks_read_own on streaks;
create policy streaks_read_own on streaks
  for select
  to authenticated
  using (
    player_id in (
      select id from players where user_id = auth.uid()
    )
  );

-- Service role retains full access

-- ============================================================================
-- 5. GRANT AUTHENTICATED ROLE ACCESS
-- ============================================================================

-- Grant authenticated users access to read from movies_catalog (same as anon)
grant select on movies_catalog to authenticated;

-- Grant authenticated users access to edge tables
grant select on director_edges to authenticated;
grant select on music_director_edges to authenticated;

-- Grant authenticated users access to public puzzle schedule
grant select on daily_puzzles_public to authenticated;

-- ============================================================================
-- 6. HELPER FUNCTION FOR ACCOUNT LINKING
-- ============================================================================
-- This function will be called server-side to safely link an anonymous
-- player to a newly authenticated user. It prevents:
-- - Linking a player that's already linked to another user
-- - Linking multiple players to one user
-- - Unauthorized linking attempts

create or replace function link_player_to_user(
  target_player_id uuid,
  target_user_id uuid
) returns boolean as $$
declare
  existing_link uuid;
begin
  -- Security: This function should only be called with service_role credentials
  -- The application logic validates the player cookie before calling this.

  -- Check if this user is already linked to a player
  select id into existing_link from players where user_id = target_user_id limit 1;
  if existing_link is not null then
    -- User already has a linked player, don't create another link
    return false;
  end if;

  -- Check if this player is already linked to a different user
  select user_id into existing_link from players where id = target_player_id;
  if existing_link is not null then
    -- Player already linked, don't relink
    return false;
  end if;

  -- Safe to link
  update players set user_id = target_user_id where id = target_player_id;
  return true;
end;
$$ language plpgsql security definer;

-- Only service role can execute this function
revoke execute on function link_player_to_user(uuid, uuid) from public;
grant execute on function link_player_to_user(uuid, uuid) to service_role;

comment on function link_player_to_user is 'Links an anonymous player to an authenticated user. Server-side only via service role.';
