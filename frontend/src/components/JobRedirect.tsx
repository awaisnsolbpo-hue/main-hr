import { Navigate, useParams } from "react-router-dom";

interface JobRedirectProps {
  to: string;
  fallback?: string;
}

export const JobRedirect = ({ to, fallback = "/recruiter/jobs" }: JobRedirectProps) => {
  const { jobId } = useParams<{ jobId: string }>();
  if (!jobId) {
    return <Navigate to={fallback} replace />;
  }
  return <Navigate to={to.replace(':jobId', jobId)} replace />;
};

interface CandidateRedirectProps {
  to: string;
  fallback?: string;
}

export const CandidateRedirect = ({ to, fallback = "/recruiter/candidates" }: CandidateRedirectProps) => {
  const { candidateId } = useParams<{ candidateId: string }>();
  if (!candidateId) {
    return <Navigate to={fallback} replace />;
  }
  return <Navigate to={to.replace(':candidateId', candidateId)} replace />;
};

