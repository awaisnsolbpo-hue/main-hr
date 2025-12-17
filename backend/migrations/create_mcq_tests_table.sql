-- Create MCQs Test Table
CREATE TABLE IF NOT EXISTS public.mcqs_test (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  candidate_id UUID NOT NULL,
  job_id UUID NOT NULL,
  candidate_email TEXT NOT NULL,
  candidate_name TEXT NOT NULL,
  job_title TEXT NULL,
  stage_name TEXT NULL,
  status TEXT NULL DEFAULT 'scheduled',
  total_questions INTEGER NULL DEFAULT 30,
  attempted_questions INTEGER NULL DEFAULT 0,
  correct_answers INTEGER NULL DEFAULT 0,
  questions JSONB NULL,
  answers JSONB NULL,
  score NUMERIC NULL DEFAULT 0,
  percentage NUMERIC NULL,
  screen_recording_url TEXT NULL,
  recording_duration_seconds INTEGER NULL,
  scheduled_at TIMESTAMP WITH TIME ZONE NULL DEFAULT NOW(),
  started_at TIMESTAMP WITH TIME ZONE NULL,
  completed_at TIMESTAMP WITH TIME ZONE NULL,
  duration_minutes INTEGER NULL,
  time_limit_minutes INTEGER NULL DEFAULT 30,
  ai_evaluation JSONB NULL,
  passing_score NUMERIC NULL DEFAULT 60,
  passed BOOLEAN NULL,
  review_notes TEXT NULL,
  created_at TIMESTAMP WITH TIME ZONE NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NULL DEFAULT NOW(),
  reviewed_at TIMESTAMP WITH TIME ZONE NULL,
  
  CONSTRAINT mcqs_test_pkey PRIMARY KEY (id),
  CONSTRAINT mcqs_test_candidate_job_unique UNIQUE (candidate_id, job_id),
  CONSTRAINT mcqs_test_candidate_fkey FOREIGN KEY (candidate_id) REFERENCES public.candidates(id) ON DELETE CASCADE,
  CONSTRAINT mcqs_test_job_fkey FOREIGN KEY (job_id) REFERENCES public.jobs(id) ON DELETE CASCADE
) TABLESPACE pg_default;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_mcqs_test_candidate_id ON public.mcqs_test USING btree (candidate_id) TABLESPACE pg_default;
CREATE INDEX IF NOT EXISTS idx_mcqs_test_job_id ON public.mcqs_test USING btree (job_id) TABLESPACE pg_default;
CREATE INDEX IF NOT EXISTS idx_mcqs_test_status ON public.mcqs_test USING btree (status) TABLESPACE pg_default;
CREATE INDEX IF NOT EXISTS idx_mcqs_test_candidate_email ON public.mcqs_test USING btree (candidate_email) TABLESPACE pg_default;

-- Enable RLS
ALTER TABLE public.mcqs_test ENABLE ROW LEVEL SECURITY;

-- Create policy for public access (no auth required)
DROP POLICY IF EXISTS "Public MCQs Test Access" ON public.mcqs_test;
CREATE POLICY "Public MCQs Test Access" ON public.mcqs_test
  FOR ALL USING (true);

-- Update timestamp trigger
CREATE OR REPLACE FUNCTION public.update_mcqs_test_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_mcqs_test_timestamp ON public.mcqs_test;
CREATE TRIGGER trigger_update_mcqs_test_timestamp
  BEFORE UPDATE ON public.mcqs_test
  FOR EACH ROW
  EXECUTE FUNCTION update_mcqs_test_timestamp();

