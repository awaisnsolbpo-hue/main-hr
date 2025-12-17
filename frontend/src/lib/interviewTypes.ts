// Types for interview functionality
export interface CandidateRecord {
  id?: string;
  name: string;
  email: string;
  client_custom_questions?: string | null;
  ai_generated_questions?: string | null;
  // Legacy field names for backward compatibility
  "Question Ask by Client"?: string | null;
  "AI Generated Question"?: string | null;
  interview_status: string | null;
  Transcript?: string | null;
  "Recording URL"?: string | null;
  "Screen recording"?: string | null;
}

