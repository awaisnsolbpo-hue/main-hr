-- Migration: Add Advanced Job Fields for AI Generation and ATS Scoring
-- Date: 2024
-- Description: Adds columns for ATS criteria, job requirements, AI generation tracking, and publishing platforms

-- Add ATS criteria column (JSONB for flexible scoring configuration)
ALTER TABLE jobs 
ADD COLUMN IF NOT EXISTS ats_criteria JSONB DEFAULT '{
  "skills_importance": 8,
  "experience_importance": 6,
  "education_importance": 5,
  "projects_importance": 4,
  "certifications_importance": 3,
  "languages_importance": 3,
  "overall_strictness": 7
}'::jsonb;

-- Add job requirements column (JSONB for structured requirements data)
ALTER TABLE jobs 
ADD COLUMN IF NOT EXISTS job_requirements JSONB;

-- Add AI generation tracking
ALTER TABLE jobs 
ADD COLUMN IF NOT EXISTS ai_generated BOOLEAN DEFAULT false;

-- Add published platforms (array of platform identifiers)
ALTER TABLE jobs 
ADD COLUMN IF NOT EXISTS published_platforms TEXT[] DEFAULT ARRAY['internal']::TEXT[];

-- Add timestamp for when job was AI-generated
ALTER TABLE jobs 
ADD COLUMN IF NOT EXISTS generated_at TIMESTAMP;

-- Add index on ai_generated for filtering
CREATE INDEX IF NOT EXISTS idx_jobs_ai_generated ON jobs(ai_generated);

-- Add index on published_platforms for searching
CREATE INDEX IF NOT EXISTS idx_jobs_published_platforms ON jobs USING GIN(published_platforms);

-- Add comment for documentation
COMMENT ON COLUMN jobs.ats_criteria IS 'ATS scoring criteria with importance weights (1-10) for each criterion';
COMMENT ON COLUMN jobs.job_requirements IS 'Structured job requirements including skills, education, experience, etc.';
COMMENT ON COLUMN jobs.ai_generated IS 'Whether this job was generated using AI';
COMMENT ON COLUMN jobs.published_platforms IS 'Array of platforms where this job is published (linkedin, email, internal)';
COMMENT ON COLUMN jobs.generated_at IS 'Timestamp when the job was AI-generated';

