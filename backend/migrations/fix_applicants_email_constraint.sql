-- Migration: Fix applicants table email constraint
-- Remove unique constraint on email and ensure one applicant profile per user_id

-- Step 1: Check current constraints
-- Run this first to see what constraints exist:
-- SELECT constraint_name, constraint_type 
-- FROM information_schema.table_constraints 
-- WHERE table_name = 'applicants' AND constraint_type = 'UNIQUE';

-- Step 2: Drop the unique constraint on email (if it exists)
ALTER TABLE public.applicants 
DROP CONSTRAINT IF EXISTS applicants_email_unique;

-- Step 3: Add unique constraint on user_id (one applicant profile per user)
-- This ensures each user can only have one applicant profile
ALTER TABLE public.applicants
ADD CONSTRAINT applicants_user_id_unique UNIQUE (user_id);

-- Step 4: Create index on email for faster lookups (non-unique)
CREATE INDEX IF NOT EXISTS idx_applicants_email ON public.applicants(email);

-- Step 5: Optional - If you want to allow same email for different users but prevent duplicates per user_id+email
-- Uncomment the line below if you want composite unique constraint instead:
-- ALTER TABLE public.applicants
-- ADD CONSTRAINT applicants_user_id_email_unique UNIQUE (user_id, email);

-- Verification query - Check constraints after migration:
-- SELECT constraint_name, constraint_type 
-- FROM information_schema.table_constraints 
-- WHERE table_name = 'applicants' AND constraint_type = 'UNIQUE';

