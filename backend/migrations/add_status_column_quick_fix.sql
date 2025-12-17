-- Quick fix: Add status column if it doesn't exist
-- Run this if you're getting the "Could not find the 'status' column" error

ALTER TABLE public.Shortlisted_candidates
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'shortlisted';

-- If you're using Supabase, you may also need to refresh the schema cache
-- This is usually done automatically, but if issues persist, you can:
-- 1. Go to Supabase Dashboard > Database > Extensions
-- 2. Or wait a few minutes for auto-refresh
-- 3. Or restart your Supabase project

