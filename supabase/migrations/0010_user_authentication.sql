-- User Authentication Migration
-- Adds profiles table and links players to authenticated users

-- ============================================================================
-- 1. PROFILES TABLE
-- ============================================================================
-- Stores user profile information. One row per authenticated user.
-- The id is a FK to auth.users(id) so it's automatically cleaned up on user deletion.

create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Index for faster lookups
create index if not exists profiles_display_name_idx on profiles(display_name);

-- Updated trigger for profiles
create or replace function set_profile_updated_at() returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists profiles_touch_updated_at on profiles;
create trigger profiles_touch_updated_at
  before update on profiles
  for each row execute function set_profile_updated_at();

-- ============================================================================
-- 2. AUTO-CREATE PROFILE ON USER SIGNUP
-- ============================================================================
-- When a new user signs up via Supabase Auth, automatically create their profile.
-- Uses the user's email as the initial display_name (can be changed later).

create or replace function create_profile_for_new_user() returns trigger as $$
begin
  insert into public.profiles (id, display_name)
  values (
    new.id,
    coalesce(
      new.raw_user_meta_data->>'display_name',
      new.raw_user_meta_data->>'full_name',
      new.raw_user_meta_data->>'name',
      split_part(new.email, '@', 1)
    )
  );
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function create_profile_for_new_user();

-- ============================================================================
-- 3. LINK PLAYERS TO USERS
-- ============================================================================
-- Add user_id to players table to support linking anonymous gameplay
-- to authenticated accounts.

alter table players add column if not exists user_id uuid references auth.users(id) on delete set null;

-- Index for faster user->player lookups
create index if not exists players_user_id_idx on players(user_id);

-- Ensure a user can only be linked to one player
create unique index if not exists players_user_id_unique on players(user_id) where user_id is not null;

-- ============================================================================
-- 4. COMMENTS
-- ============================================================================

comment on table profiles is 'User profile information for authenticated users';
comment on column profiles.id is 'Foreign key to auth.users(id)';
comment on column profiles.display_name is 'User display name shown in UI';
comment on column profiles.avatar_url is 'Optional avatar image URL';

comment on column players.user_id is 'Links anonymous player to authenticated user when they sign up/login';
