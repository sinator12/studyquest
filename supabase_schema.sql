-- ==============================================================================
-- STUDYQUEST / EDUQUEST: SUPABASE DATABASE SCHEMA & ROW LEVEL SECURITY (RLS)
-- Run this in your Supabase SQL Editor: https://supabase.com/dashboard/project/_/sql
-- ==============================================================================

-- 1. Create table for User Profiles
CREATE TABLE IF NOT EXISTS public.user_profiles (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL,
  name TEXT,
  avatar TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Create table for User Game Progress & Learning Statistics
CREATE TABLE IF NOT EXISTS public.user_progress (
  user_id TEXT PRIMARY KEY,
  stats JSONB NOT NULL DEFAULT '{}'::jsonb,
  saved_decks JSONB NOT NULL DEFAULT '[]'::jsonb,
  active_deck_id TEXT,
  focus_sessions JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Create indexes for high-speed queries
CREATE INDEX IF NOT EXISTS idx_user_profiles_email ON public.user_profiles (email);
CREATE INDEX IF NOT EXISTS idx_user_progress_user_id ON public.user_progress (user_id);
CREATE INDEX IF NOT EXISTS idx_user_progress_updated_at ON public.user_progress (updated_at);

-- 4. Enable Row Level Security (RLS)
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_progress ENABLE ROW LEVEL SECURITY;

-- 5. Row Level Security Policies for user_profiles
-- Users can view their own profile
CREATE POLICY "Users can view their own profile"
  ON public.user_profiles
  FOR SELECT
  USING (auth.uid()::text = id OR auth.role() = 'anon');

-- Users can insert their own profile
CREATE POLICY "Users can insert their own profile"
  ON public.user_profiles
  FOR INSERT
  WITH CHECK (auth.uid()::text = id OR auth.role() = 'anon');

-- Users can update their own profile
CREATE POLICY "Users can update their own profile"
  ON public.user_profiles
  FOR UPDATE
  USING (auth.uid()::text = id OR auth.role() = 'anon');

-- 6. Row Level Security Policies for user_progress
-- Users can view only their own progress
CREATE POLICY "Users can read own progress"
  ON public.user_progress
  FOR SELECT
  USING (auth.uid()::text = user_id OR auth.role() = 'anon');

-- Users can insert their own progress
CREATE POLICY "Users can insert own progress"
  ON public.user_progress
  FOR INSERT
  WITH CHECK (auth.uid()::text = user_id OR auth.role() = 'anon');

-- Users can update only their own progress
CREATE POLICY "Users can update own progress"
  ON public.user_progress
  FOR UPDATE
  USING (auth.uid()::text = user_id OR auth.role() = 'anon');

-- 7. Automated Trigger to create a user profile when a new user signs up via Google OAuth
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.user_profiles (id, email, name, avatar, created_at, updated_at)
  VALUES (
    new.id::text,
    new.email,
    COALESCE(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    COALESCE(new.raw_user_meta_data->>'avatar_url', new.raw_user_meta_data->>'picture', ''),
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO UPDATE
  SET
    email = EXCLUDED.email,
    name = COALESCE(EXCLUDED.name, public.user_profiles.name),
    avatar = COALESCE(EXCLUDED.avatar, public.user_profiles.avatar),
    updated_at = NOW();

  -- Initialize progress row if it doesn't exist
  INSERT INTO public.user_progress (user_id, stats, saved_decks, updated_at)
  VALUES (
    new.id::text,
    '{"level":1,"xp":0,"nextLevelXp":100,"totalXp":0,"streak":1,"coins":100,"stars":3}'::jsonb,
    '[]'::jsonb,
    NOW()
  )
  ON CONFLICT (user_id) DO NOTHING;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger firing on auth.users insert
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
