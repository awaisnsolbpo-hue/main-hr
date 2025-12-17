-- Migration: Create Candidates Table with CV Extraction Support
-- This creates a new candidates table while keeping Applicant table for backward compatibility

-- Create candidates table
CREATE TABLE IF NOT EXISTS public.candidates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  job_id UUID NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  
  -- Personal Information
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  full_name TEXT GENERATED ALWAYS AS (COALESCE(first_name, '') || ' ' || COALESCE(last_name, '')) STORED,
  email TEXT NOT NULL,
  phone TEXT,
  
  -- Location
  location TEXT,
  city TEXT,
  state TEXT,
  country TEXT,
  
  -- Professional Summary
  summary TEXT,
  
  -- Skills (stored as array)
  skills TEXT[] DEFAULT ARRAY[]::TEXT[],
  
  -- Experience
  experience_years INTEGER DEFAULT 0,
  total_experience_months INTEGER,
  
  -- Education (stored as JSONB)
  education JSONB,
  
  -- Social/Portfolio Links
  linkedin_url TEXT,
  github_url TEXT,
  portfolio_url TEXT,
  website_url TEXT,
  
  -- CV File
  cv_file_url TEXT,
  cv_file_name TEXT,
  cv_file_size INTEGER,
  
  -- Status
  status TEXT DEFAULT 'new',
  interview_status TEXT,
  
  -- ATS Scoring
  ats_score NUMERIC,
  ats_breakdown JSONB,
  ats_recommendation TEXT,
  
  -- Metadata
  source TEXT DEFAULT 'manual_upload',
  import_source TEXT,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  
  CONSTRAINT candidates_email_job_unique UNIQUE(email, job_id)
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_candidates_user_id ON public.candidates(user_id);
CREATE INDEX IF NOT EXISTS idx_candidates_job_id ON public.candidates(job_id);
CREATE INDEX IF NOT EXISTS idx_candidates_email ON public.candidates(email);
CREATE INDEX IF NOT EXISTS idx_candidates_status ON public.candidates(status);
CREATE INDEX IF NOT EXISTS idx_candidates_created_at ON public.candidates(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_candidates_ats_score ON public.candidates(ats_score DESC);
CREATE INDEX IF NOT EXISTS idx_candidates_full_name ON public.candidates(full_name);

-- Activity logging function (if activity_logs table exists)
CREATE OR REPLACE FUNCTION public.log_candidate_activity()
RETURNS TRIGGER AS $$
BEGIN
  -- Only log if activity_logs table exists
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'activity_logs') THEN
    INSERT INTO public.activity_logs(
      user_id,
      action,
      table_name,
      record_id,
      old_data,
      new_data
    ) VALUES (
      COALESCE(NEW.user_id, OLD.user_id),
      CASE
        WHEN TG_OP = 'INSERT' THEN 'candidate_imported'
        WHEN TG_OP = 'UPDATE' THEN 'candidate_updated'
        WHEN TG_OP = 'DELETE' THEN 'candidate_deleted'
      END,
      'candidates',
      COALESCE(NEW.id, OLD.id),
      CASE WHEN TG_OP = 'DELETE' THEN row_to_json(OLD) ELSE NULL END,
      CASE WHEN TG_OP != 'DELETE' THEN row_to_json(NEW) ELSE NULL END
    );
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Drop and recreate trigger
DROP TRIGGER IF EXISTS trigger_log_candidate_activity ON public.candidates;
CREATE TRIGGER trigger_log_candidate_activity
AFTER INSERT OR UPDATE OR DELETE ON public.candidates
FOR EACH ROW
EXECUTE FUNCTION log_candidate_activity();

-- Update timestamp trigger
CREATE OR REPLACE FUNCTION public.update_candidate_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_candidate_timestamp ON public.candidates;
CREATE TRIGGER trigger_update_candidate_timestamp
BEFORE UPDATE ON public.candidates
FOR EACH ROW
EXECUTE FUNCTION update_candidate_timestamp();

-- Create storage bucket if it doesn't exist (run this in Supabase Dashboard Storage section)
-- INSERT INTO storage.buckets (id, name, public) 
-- VALUES ('cv-files', 'cv-files', true)
-- ON CONFLICT DO NOTHING;

