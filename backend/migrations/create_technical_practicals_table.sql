-- Create Technical Practicals Table
CREATE TABLE IF NOT EXISTS public.technical_practicals (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  candidate_id UUID NOT NULL,
  job_id UUID NOT NULL,
  candidate_email TEXT NOT NULL,
  candidate_name TEXT NOT NULL,
  
  -- Task Information
  task_title TEXT NOT NULL,
  task_description TEXT NOT NULL,
  task_requirements JSONB DEFAULT '[]'::jsonb,
  difficulty TEXT DEFAULT 'medium', -- easy, medium, hard
  time_limit_minutes INTEGER DEFAULT 60,
  programming_language TEXT NOT NULL,
  tools_allowed TEXT[] DEFAULT ARRAY[]::TEXT[],
  starter_code TEXT,
  expected_output_example TEXT,
  success_criteria JSONB DEFAULT '[]'::jsonb,
  bonus_features JSONB DEFAULT '[]'::jsonb,
  task_notes TEXT,
  evaluation_focus JSONB DEFAULT '{}'::jsonb,
  
  -- Submission Information
  submission_url TEXT,
  submitted_at TIMESTAMP WITH TIME ZONE,
  video_duration_seconds INTEGER,
  duration_minutes INTEGER,
  status TEXT DEFAULT 'scheduled', -- scheduled, in_progress, submitted, evaluated
  
  -- Evaluation (filled after AI review)
  ai_evaluation JSONB,
  score NUMERIC,
  feedback TEXT,
  evaluated_at TIMESTAMP WITH TIME ZONE,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  CONSTRAINT technical_practicals_pkey PRIMARY KEY (id),
  CONSTRAINT technical_practicals_candidate_job_unique UNIQUE (candidate_id, job_id),
  CONSTRAINT technical_practicals_candidate_fkey FOREIGN KEY (candidate_id) REFERENCES public.candidates(id) ON DELETE CASCADE,
  CONSTRAINT technical_practicals_job_fkey FOREIGN KEY (job_id) REFERENCES public.jobs(id) ON DELETE CASCADE
) TABLESPACE pg_default;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_technical_practicals_candidate_id ON public.technical_practicals USING btree (candidate_id) TABLESPACE pg_default;
CREATE INDEX IF NOT EXISTS idx_technical_practicals_job_id ON public.technical_practicals USING btree (job_id) TABLESPACE pg_default;
CREATE INDEX IF NOT EXISTS idx_technical_practicals_status ON public.technical_practicals USING btree (status) TABLESPACE pg_default;
CREATE INDEX IF NOT EXISTS idx_technical_practicals_candidate_email ON public.technical_practicals USING btree (candidate_email) TABLESPACE pg_default;

-- Enable RLS
ALTER TABLE public.technical_practicals ENABLE ROW LEVEL SECURITY;

-- Create policy for public access (no auth required for candidates)
DROP POLICY IF EXISTS "Public Technical Practicals Access" ON public.technical_practicals;
CREATE POLICY "Public Technical Practicals Access" ON public.technical_practicals
  FOR ALL USING (true);

-- Update timestamp trigger
CREATE OR REPLACE FUNCTION public.update_technical_practicals_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_technical_practicals_timestamp ON public.technical_practicals;
CREATE TRIGGER trigger_update_technical_practicals_timestamp
  BEFORE UPDATE ON public.technical_practicals
  FOR EACH ROW
  EXECUTE FUNCTION update_technical_practicals_timestamp();

-- Create storage bucket for practical test videos
INSERT INTO storage.buckets (id, name, public) 
VALUES ('practical-test-videos', 'practical-test-videos', true)
ON CONFLICT DO NOTHING;

