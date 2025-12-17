-- Migration: Create RLS policies for applicants table
-- This allows authenticated users to create and manage their own applicant profiles

-- Enable RLS on applicants table (if not already enabled)
ALTER TABLE public.applicants ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own applicant profile" ON public.applicants;
DROP POLICY IF EXISTS "Users can create their own applicant profile" ON public.applicants;
DROP POLICY IF EXISTS "Users can update their own applicant profile" ON public.applicants;
DROP POLICY IF EXISTS "Users can delete their own applicant profile" ON public.applicants;
DROP POLICY IF EXISTS "Recruiters can view applicants who applied to their jobs" ON public.applicants;

-- Policy: Users can view their own applicant profile
CREATE POLICY "Users can view their own applicant profile"
ON public.applicants
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Policy: Users can create their own applicant profile
CREATE POLICY "Users can create their own applicant profile"
ON public.applicants
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own applicant profile
CREATE POLICY "Users can update their own applicant profile"
ON public.applicants
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Policy: Users can delete their own applicant profile
CREATE POLICY "Users can delete their own applicant profile"
ON public.applicants
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- Policy: Recruiters can view applicants who applied to their jobs
-- This allows recruiters to see applicant profiles for candidates who applied to their job postings
CREATE POLICY "Recruiters can view applicants who applied to their jobs"
ON public.applicants
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.job_applications ja
    INNER JOIN public.jobs j ON ja.job_id = j.id
    WHERE ja.applicant_id = applicants.id
    AND j.user_id = auth.uid()
  )
);

