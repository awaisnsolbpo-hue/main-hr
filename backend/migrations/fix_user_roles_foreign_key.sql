-- Migration: Fix user_roles foreign key constraint
-- The foreign key should reference auth.users(id), not public.profiles(id)

-- Step 1: Drop the existing foreign key constraint
ALTER TABLE public.user_roles
DROP CONSTRAINT IF EXISTS user_roles_user_id_fkey;

-- Step 2: Add correct foreign key constraint to auth.users
-- Note: In Supabase, auth.users is in the auth schema
ALTER TABLE public.user_roles
ADD CONSTRAINT user_roles_user_id_fkey 
FOREIGN KEY (user_id) 
REFERENCES auth.users(id) 
ON DELETE CASCADE;

-- Verification: Check the constraint
-- SELECT 
--   tc.constraint_name, 
--   tc.table_name, 
--   kcu.column_name,
--   ccu.table_name AS foreign_table_name,
--   ccu.column_name AS foreign_column_name 
-- FROM information_schema.table_constraints AS tc 
-- JOIN information_schema.key_column_usage AS kcu
--   ON tc.constraint_name = kcu.constraint_name
-- JOIN information_schema.constraint_column_usage AS ccu
--   ON ccu.constraint_name = tc.constraint_name
-- WHERE tc.constraint_type = 'FOREIGN KEY' 
-- AND tc.table_name = 'user_roles';

