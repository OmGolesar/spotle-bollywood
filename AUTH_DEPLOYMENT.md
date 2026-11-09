# User Authentication - Deployment Guide

This document describes how to deploy the user authentication system for Spotle Bollywood.

## Overview

The authentication system provides:
- **Google OAuth** sign-in/sign-up
- **Email/password** authentication
- **Password reset** functionality
- **Anonymous-to-authenticated account linking** (preserves guest gameplay)
- **User profiles** with stats and streak tracking

## Prerequisites

1. **Supabase Project** (already configured)
2. **Google OAuth Credentials** (new - needs setup)
3. **Vercel Deployment** (existing)

---

## Step 1: Run Database Migrations

Apply the new migrations to add profiles and user linking:

```bash
# Local development
npx supabase db reset

# Production (after linking to your Supabase project)
npx supabase db push
```

**Migrations added:**
- `0010_user_authentication.sql` - Adds `profiles` table and `user_id` to `players`
- `0011_auth_rls_policies.sql` - RLS policies for authenticated users

**Verify migrations:**
```sql
-- Check profiles table exists
SELECT * FROM profiles LIMIT 1;

-- Check players.user_id column exists
SELECT user_id FROM players LIMIT 1;

-- Check RLS policies
SELECT * FROM pg_policies WHERE tablename IN ('profiles', 'players', 'plays', 'streaks');
```

---

## Step 2: Configure Google OAuth

### 2.1 Create Google OAuth Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable **Google+ API**
4. Go to **Credentials** → **Create Credentials** → **OAuth 2.0 Client ID**
5. Configure OAuth consent screen:
   - App name: **Spotle Bollywood**
   - User support email: Your email
   - Developer contact: Your email
   - Scopes: `email`, `profile`, `openid`
6. Create OAuth client:
   - Application type: **Web application**
   - Name: **Spotle Bollywood Web**
   - Authorized JavaScript origins:
     - `http://localhost:3000` (development)
     - `https://spotle-bollywood.vercel.app` (production)
   - Authorized redirect URIs:
     - `http://localhost:3000/auth/callback`
     - `https://spotle-bollywood.vercel.app/auth/callback`

7. **Copy the Client ID and Client Secret** (needed for next step)

### 2.2 Configure Supabase Authentication

1. Go to your Supabase project dashboard
2. Navigate to **Authentication** → **Providers**
3. Enable **Google** provider
4. Paste your **Client ID** and **Client Secret**
5. Save

### 2.3 Configure Redirect URLs in Supabase

1. In Supabase dashboard, go to **Authentication** → **URL Configuration**
2. Add redirect URLs:
   - `http://localhost:3000/auth/callback` (development)
   - `https://spotle-bollywood.vercel.app/auth/callback` (production)

---

## Step 3: Update Environment Variables

### Local Development (.env.local)

Already configured - no changes needed:
```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### Vercel Production

Verify these environment variables are set in Vercel:

1. Go to Vercel project → **Settings** → **Environment Variables**
2. Verify:
   - `NEXT_PUBLIC_SUPABASE_URL` (should already exist)
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` (should already exist)
   - `SUPABASE_SERVICE_ROLE_KEY` (should already exist)

**No new environment variables needed!** Google OAuth is configured entirely in Supabase.

---

## Step 4: Deploy to Vercel

### 4.1 Push to GitHub

```bash
# Make sure you're on the feature branch
git status

# Stage all changes
git add .

# Commit
git commit -m "Add user authentication system

- Email/password and Google OAuth authentication
- User profiles with stats tracking
- Anonymous account linking to preserve guest progress
- Login, signup, forgot password, reset password pages
- Profile page with editable display name
- Auth-aware site header with profile dropdown
- Post-puzzle signup prompt for anonymous users
- RLS policies for secure data access
- E2E and unit tests for authentication
- Deployment documentation"

# Push feature branch
git push origin feature/user-authentication
```

### 4.2 Create Pull Request

1. Go to GitHub repository
2. Create PR from `feature/user-authentication` to `main`
3. Review changes
4. Merge to `main`

### 4.3 Vercel Auto-Deploy

Vercel will automatically deploy when you push to `main`. Monitor the deployment:

1. Go to Vercel dashboard
2. Check deployment logs
3. Verify build succeeds

---

## Step 5: Verify Deployment

### 5.1 Test Google OAuth

1. Visit production site: `https://spotle-bollywood.vercel.app`
2. Click **Sign Up**
3. Click **Continue with Google**
4. Sign in with your Google account
5. Verify redirect back to site
6. Check that header shows profile dropdown

### 5.2 Test Email Authentication

1. Visit `/signup`
2. Enter:
   - Display name
   - Email
   - Password (min 8 characters)
   - Confirm password
3. Click **Create Account**
4. Check email for verification link (if email verification enabled)
5. Sign in at `/login`

### 5.3 Test Anonymous Account Linking

1. Open site in **incognito/private window**
2. Play a puzzle as a guest (no sign-up)
3. Complete the puzzle
4. Note your streak
5. Click **Sign Up Free** from the prompt
6. Create an account
7. Verify your streak is preserved!

### 5.4 Test Profile Page

1. Sign in
2. Click your avatar in header
3. Click **My Profile**
4. Verify stats display:
   - Total games played
   - Total wins
   - Win rate
   - Per-difficulty streaks
5. Click **Edit** on display name
6. Change name and save
7. Verify name updates

### 5.5 Test Password Reset

1. Go to `/forgot-password`
2. Enter your email
3. Click **Send Reset Link**
4. Check email for reset link
5. Click link (redirects to `/reset-password`)
6. Enter new password
7. Confirm password
8. Submit
9. Sign in with new password

---

## Step 6: Monitor and Verify

### Check Supabase Logs

1. Go to Supabase dashboard → **Logs** → **Auth Logs**
2. Verify successful sign-ups and sign-ins

### Check Database

```sql
-- Verify profiles are being created
SELECT id, display_name, created_at FROM profiles ORDER BY created_at DESC LIMIT 10;

-- Verify account linking is working
SELECT p.id, p.user_id, u.email
FROM players p
LEFT JOIN auth.users u ON p.user_id = u.id
WHERE p.user_id IS NOT NULL
LIMIT 10;

-- Check streaks for authenticated users
SELECT s.*, u.email
FROM streaks s
JOIN players p ON s.player_id = p.id
JOIN auth.users u ON p.user_id = u.id
LIMIT 10;
```

---

## Troubleshooting

### Google OAuth Not Working

**Symptom:** "OAuth error" or redirect fails

**Solutions:**
1. Verify redirect URIs in Google Cloud Console match exactly
2. Check that Google+ API is enabled
3. Verify Client ID and Secret in Supabase are correct
4. Clear browser cache and try again

### Account Linking Not Preserving History

**Symptom:** User signs up but doesn't see their guest games

**Solutions:**
1. Check browser console for errors
2. Verify the `link_player_to_user` function exists in database
3. Check Supabase logs for errors during callback
4. Verify RLS policies allow reading linked player data

### Email Verification Required

**Symptom:** Users can't sign in until email verified

**Solutions:**
1. In Supabase dashboard → **Authentication** → **Settings**
2. Under **Email Auth**, toggle **Enable email confirmations**
3. If enabled, users must click email link before first sign-in

### Password Too Weak Error

**Symptom:** "Password is too weak" on signup

**Solutions:**
1. Ensure password is at least 8 characters
2. Check Supabase password requirements in Auth settings
3. Update validation.ts if Supabase requirements changed

---

## Security Checklist

- [ ] RLS policies applied via migration
- [ ] Service role key stored securely (server-only, not in client bundle)
- [ ] Google OAuth credentials not committed to Git
- [ ] Redirect URIs validated (no open redirect vulnerability)
- [ ] Account linking only works with trusted cookie-based player ID
- [ ] Password validation enforces minimum 8 characters
- [ ] Email validation prevents invalid addresses

---

## Rollback Plan

If issues arise, you can rollback:

### Code Rollback

```bash
# Revert to previous main commit
git checkout main
git revert HEAD
git push origin main
```

### Database Rollback

**Warning:** This will delete the profiles table and user_id column.

```sql
-- Drop RLS policies
DROP POLICY IF EXISTS profiles_read_own ON profiles;
DROP POLICY IF EXISTS profiles_update_own ON profiles;
DROP POLICY IF EXISTS players_read_own ON players;
DROP POLICY IF EXISTS plays_read_own ON plays;
DROP POLICY IF EXISTS streaks_read_own ON streaks;

-- Drop helper function
DROP FUNCTION IF EXISTS link_player_to_user(uuid, uuid);

-- Remove user_id column from players
ALTER TABLE players DROP COLUMN IF EXISTS user_id;

-- Drop profiles table
DROP TABLE IF EXISTS profiles CASCADE;

-- Drop trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS create_profile_for_new_user();
```

---

## Support

**Issues:** Report at GitHub repository issues page
**Email:** omgolesar99@gmail.com

---

## Next Steps (Future Enhancements)

After authentication is stable, consider:

1. **Social features:**
   - Friend leaderboards
   - Challenge friends to specific puzzles
   - Share profiles

2. **Enhanced profiles:**
   - Avatar uploads (Vercel Blob)
   - Favorite films list
   - Personal stats dashboard

3. **Account management:**
   - Email change
   - Delete account
   - Export data (GDPR compliance)

4. **OAuth providers:**
   - GitHub
   - Facebook
   - Apple Sign-in

---

**Deployment Date:** _________  
**Deployed By:** _________  
**Verified By:** _________
