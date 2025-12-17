-- Migration: Update user_roles table to support multiple roles per user
-- This allows users to have both 'applicant' and 'recruiter' roles

-- Drop the existing unique constraint on user_id
ALTER TABLE public.user_roles 
DROP CONSTRAINT IF EXISTS user_roles_user_id_unique;

-- Add composite unique constraint on (user_id, role) to prevent duplicate role assignments
-- This allows a user to have multiple roles, but not duplicate the same role
ALTER TABLE public.user_roles
ADD CONSTRAINT user_roles_user_id_role_unique UNIQUE (user_id, role);

-- Create index for better query performance when fetching all roles for a user
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id_role 
ON public.user_roles(user_id, role);

-- Add comment to table explaining the change
COMMENT ON TABLE public.user_roles IS 'Stores user roles. Users can have multiple roles (e.g., both applicant and recruiter).';

