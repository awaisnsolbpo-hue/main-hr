-- Migration: Enforce Single Role Per User and Email Uniqueness (FIXED VERSION)
-- This ensures:
-- 1. A user can only have ONE role (either applicant OR recruiter, not both)
-- 2. Email must be unique - cannot be used by both applicant and recruiter

-- ============================================
-- PART 1: Enforce Single Role Per User
-- ============================================

-- Drop the composite unique constraint that allows multiple roles (if it exists)
ALTER TABLE public.user_roles 
DROP CONSTRAINT IF EXISTS user_roles_user_id_role_unique;

-- Drop existing unique constraint on user_id if it exists (to avoid "already exists" error)
ALTER TABLE public.user_roles
DROP CONSTRAINT IF EXISTS user_roles_user_id_unique;

-- Add unique constraint on user_id (one role per user)
-- This will fail if constraint already exists, but we dropped it above
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'user_roles_user_id_unique' 
    AND conrelid = 'public.user_roles'::regclass
  ) THEN
    ALTER TABLE public.user_roles
    ADD CONSTRAINT user_roles_user_id_unique UNIQUE (user_id);
  END IF;
END $$;

-- Add check constraint to ensure only one role per user
-- This prevents inserting multiple roles for the same user
CREATE OR REPLACE FUNCTION check_single_role()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if user already has a role
  IF EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = NEW.user_id 
    AND id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid)
  ) THEN
    RAISE EXCEPTION 'User can only have one role. Please remove existing role before adding a new one.';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop trigger if exists
DROP TRIGGER IF EXISTS trigger_check_single_role ON public.user_roles;

-- Create trigger to enforce single role
CREATE TRIGGER trigger_check_single_role
BEFORE INSERT OR UPDATE ON public.user_roles
FOR EACH ROW
EXECUTE FUNCTION check_single_role();

-- ============================================
-- PART 2: Ensure Email Uniqueness Across Roles
-- ============================================

-- Create function to check if email exists in other role
CREATE OR REPLACE FUNCTION check_email_uniqueness_across_roles()
RETURNS TRIGGER AS $$
DECLARE
  email_exists_in_profiles BOOLEAN;
  email_exists_in_applicants BOOLEAN;
BEGIN
  -- For applicants table
  IF TG_TABLE_NAME = 'applicants' THEN
    -- Check if email exists in profiles (recruiters) with different user_id
    SELECT EXISTS(
      SELECT 1 FROM public.profiles 
      WHERE email = NEW.email 
      AND id != COALESCE(NEW.user_id, '00000000-0000-0000-0000-000000000000'::uuid)
    ) INTO email_exists_in_profiles;

    IF email_exists_in_profiles THEN
      RAISE EXCEPTION 'Email already exists as a recruiter. An email cannot be used by both an applicant and a recruiter.';
    END IF;
  END IF;

  -- For profiles table
  IF TG_TABLE_NAME = 'profiles' THEN
    -- Check if email exists in applicants with different user_id
    SELECT EXISTS(
      SELECT 1 FROM public.applicants 
      WHERE email = NEW.email 
      AND user_id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid)
    ) INTO email_exists_in_applicants;

    IF email_exists_in_applicants THEN
      RAISE EXCEPTION 'Email already exists as an applicant. An email cannot be used by both an applicant and a recruiter.';
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing triggers if they exist
DROP TRIGGER IF EXISTS trigger_check_email_applicants ON public.applicants;
DROP TRIGGER IF EXISTS trigger_check_email_profiles ON public.profiles;

-- Create trigger on applicants table
CREATE TRIGGER trigger_check_email_applicants
BEFORE INSERT OR UPDATE OF email ON public.applicants
FOR EACH ROW
EXECUTE FUNCTION check_email_uniqueness_across_roles();

-- Create trigger on profiles table
CREATE TRIGGER trigger_check_email_profiles
BEFORE INSERT OR UPDATE OF email ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION check_email_uniqueness_across_roles();

-- ============================================
-- PART 3: Additional Constraints
-- ============================================

-- Ensure applicants table has unique constraint on user_id (one applicant profile per user)
ALTER TABLE public.applicants
DROP CONSTRAINT IF EXISTS applicants_user_id_unique;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'applicants_user_id_unique' 
    AND conrelid = 'public.applicants'::regclass
  ) THEN
    ALTER TABLE public.applicants
    ADD CONSTRAINT applicants_user_id_unique UNIQUE (user_id);
  END IF;
END $$;

-- Remove unique constraint on email in applicants (we handle it via trigger)
ALTER TABLE public.applicants 
DROP CONSTRAINT IF EXISTS applicants_email_unique;

-- ============================================
-- Verification Queries (Run these to verify)
-- ============================================

-- Check constraints:
-- SELECT constraint_name, constraint_type 
-- FROM information_schema.table_constraints 
-- WHERE table_name IN ('user_roles', 'applicants', 'profiles') 
-- AND constraint_type = 'UNIQUE'
-- ORDER BY table_name, constraint_name;

-- Check triggers:
-- SELECT trigger_name, event_object_table, action_timing, event_manipulation
-- FROM information_schema.triggers 
-- WHERE trigger_name LIKE '%check%' 
-- AND event_object_schema = 'public'
-- ORDER BY event_object_table, trigger_name;

