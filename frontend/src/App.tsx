import { Suspense, lazy } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { RoleProvider } from "@/contexts/RoleContext";
// import { navItems } from "./nav-items";
import Index from "./pages/Index";
import Signup from "./pages/Signup";
import Login from "./pages/Login";
import ResetPassword from "./pages/ResetPassword";
import Dashboard from "./pages/Dashboard";
import Jobs from "./pages/Jobs";
import CreateJob from "./pages/CreateJob";
import EditJob from "./pages/Editjob";
import Candidates from "./pages/Candidates";
import ImportCandidates from "./pages/ImportCandidates";
import JobDetail from "./pages/JobDetail";
import PublicJobView from "./pages/PublicJobView";
import PublicUpload from "./pages/PublicUpload";
import GmailImport from "./pages/GmailImport";
import Interviews from "./pages/Interviews";
import ConnectLinkedin from "./pages/ConnectLinkedIn";
import { getLinkedInJobDetails } from "./lib/linkedinScraper";
import GmailCallback from "./pages/GmailCallback";
import LinkedinCallback from "./pages/LinkedInCallback";
import IntegrationsSettings from "./pages/IntegrationsSettings";
import ScheduledMeetings from "./pages/ScheduledMeetings";
import Profile from "./pages/Profile";
import Settings from "./pages/Settings";
import ActivityLogs from "./pages/Activitylogs"
import CandidateSearch from "./pages/Candidatesearch";
import AdvancedSearch from "./pages/AdvancedSearch";
import InterviewLandingPage from "./pages/InterviewLandingPage";
import InterviewRoom from "./pages/InterviewRoom";
import MCQLanding from "./pages/MCQLanding";
import MCQRoom from "./pages/MCQRoom";
import PracticalTestLanding from "./pages/PracticalTestLanding";
import PracticalTestRoom from "./pages/PracticalTestRoom";
import ApplicantSignup from "./pages/ApplicantSignup";
import ApplicantLogin from "./pages/ApplicantLogin";
import ApplicantDashboard from "./pages/ApplicantDashboard";
import ApplicantProfileEdit from "./pages/ApplicantProfileEdit";
import CommunityPage from "./pages/CommunityPage";
import NewDiscussion from "./pages/NewDiscussion";
import DiscussionDetail from "./pages/DiscussionDetail";
import NotFound from "./pages/NotFound";
import RealtimeNotifications from "./components/RealtimeNotifications";
import { JobRedirect, CandidateRedirect } from "./components/JobRedirect";

// NEW: Dashboard Metric Pages
import ActiveJobsPage from "./pages/Activejobspage";
import TotalCandidatesPage from "@/pages/Totalcandidatespage";
import InitialInterviewQualifiedPage from "@/pages/Initialinterviewqualifiedpage";
import ScheduledInterviewsPage from "@/pages/Scheduledinterviewspage";
import ShortlistedCandidatesPage from "@/pages/Shortlistedcandidatespage";
import SuccessRatePage from "@/pages/Successratepage";
import MCQTests from "@/pages/MCQTests";
import TechnicalTests from "@/pages/TechnicalTests";
import CandidateDetail from "@/pages/CandidateDetail";

// Optimized QueryClient with better caching for faster performance
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30000, // 30 seconds - data is fresh for 30s
      cacheTime: 300000, // 5 minutes - keep in cache for 5min
      refetchOnWindowFocus: false, // Don't refetch on window focus
      retry: 1, // Only retry once on failure
    },
  },
});

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <RealtimeNotifications />
      <BrowserRouter>
        <RoleProvider>
        <Routes>
          {/* ============================================
              PUBLIC ROUTES - No Authentication Required
          ============================================ */}
          
          {/* Landing & Auth Pages */}
          <Route path="/" element={<Index />} />
          <Route path="/recruiter/signup" element={<Signup />} />
          <Route path="/applicant/signup" element={<ApplicantSignup />} />
          <Route path="/recruiter/login" element={<Login />} />
          <Route path="/applicant/login" element={<ApplicantLogin />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          
          {/* Community Routes */}
          <Route path="/community" element={<CommunityPage />} />
          <Route path="/community/new-discussion" element={<NewDiscussion />} />
          <Route path="/community/discussions/:id" element={<DiscussionDetail />} />
          
          {/* Public Job Application Routes - Candidates can view and apply */}
          <Route path="/jobs/public/:jobId" element={<PublicJobView />} />
          <Route path="/upload/:linkCode" element={<PublicUpload />} />
          
          {/* Public Interview Routes - Candidates access their interviews */}
          <Route path="/interview-landing" element={<InterviewLandingPage />} />
          <Route path="/interview-room" element={<InterviewRoom />} />
          
          {/* Public MCQ Routes - Candidates access their MCQ tests */}
          <Route path="/mcqs-landing" element={<MCQLanding />} />
          <Route path="/mcqs-room" element={<MCQRoom />} />
          
          {/* Public Practical Test Routes - Candidates access their practical tests */}
          <Route path="/practical-test-landing" element={<PracticalTestLanding />} />
          <Route path="/practical-test-room" element={<PracticalTestRoom />} />
          
          {/* Applicant Routes */}
          <Route path="/applicant/dashboard" element={<ApplicantDashboard />} />
          <Route path="/applicant/profile/edit" element={<ApplicantProfileEdit />} />
          
          {/* Legacy applicant dashboard route - redirect to new path */}
          <Route path="/applicant-dashboard" element={<Navigate to="/applicant/dashboard" replace />} />
          
          {/* ============================================
              PROTECTED ROUTES - Authentication Required
          ============================================ */}
          
          {/* ============================================
              RECRUITER ROUTES - All under /recruiter/*
          ============================================ */}
          
          {/* Recruiter Dashboard & Profile */}
          <Route path="/recruiter/dashboard" element={<Dashboard />} />
          <Route path="/recruiter/profile" element={<Profile />} />
          <Route path="/recruiter/settings" element={<Settings />} />
          <Route path="/recruiter/activity-logs" element={<ActivityLogs />} />
          
          {/* Dashboard Metric Pages - Detailed views of dashboard stats */}
          <Route path="/recruiter/dashboard/active-jobs" element={<ActiveJobsPage />} />
          <Route path="/recruiter/dashboard/total-candidates" element={<TotalCandidatesPage />} />
          <Route path="/recruiter/dashboard/qualified" element={<InitialInterviewQualifiedPage />} />
          <Route path="/recruiter/dashboard/scheduled-interviews" element={<ScheduledInterviewsPage />} />
          <Route path="/recruiter/dashboard/shortlisted" element={<ShortlistedCandidatesPage />} />
          <Route path="/recruiter/dashboard/success-rate" element={<SuccessRatePage />} />
          
          {/* Job Management Routes */}
          <Route path="/recruiter/jobs" element={<Jobs />} />
          <Route path="/recruiter/create-job" element={<CreateJob />} />
          <Route path="/recruiter/jobs/:jobId" element={<JobDetail />} />
          <Route path="/recruiter/edit-job/:jobId" element={<EditJob />} />
          
          {/* Candidate Management Routes */}
          <Route path="/recruiter/candidates" element={<Candidates />} />
          <Route path="/recruiter/candidates/:candidateId" element={<CandidateDetail />} />
          <Route path="/recruiter/import-candidates" element={<ImportCandidates />} />
          <Route path="/recruiter/search-candidates" element={<CandidateSearch />} />
          <Route path="/recruiter/advanced-search" element={<AdvancedSearch />} />
          
          {/* Interview Management Routes */}
          <Route path="/recruiter/interviews" element={<Interviews />} />
          <Route path="/recruiter/scheduled-meetings" element={<ScheduledMeetings />} />
          
          {/* Assessment Routes */}
          <Route path="/recruiter/mcq-tests" element={<MCQTests />} />
          <Route path="/recruiter/technical-tests" element={<TechnicalTests />} />
          <Route path="/recruiter/final-interviews" element={<InitialInterviewQualifiedPage />} />
          <Route path="/recruiter/shortlisted" element={<ShortlistedCandidatesPage />} />
          
          {/* Integration Routes */}
          <Route path="/recruiter/gmail-import" element={<GmailImport />} />
          <Route path="/recruiter/connect-linkedin" element={<ConnectLinkedin />} />
          <Route path="/recruiter/integrations-settings" element={<IntegrationsSettings />} />
          
          {/* ============================================
              APPLICANT ROUTES - All under /applicant/*
          ============================================ */}
          
          {/* Applicant Dashboard (already defined above) */}
          {/* Additional applicant routes can be added here */}
          
          {/* ============================================
              LEGACY ROUTES - Redirect to new paths
          ============================================ */}
          
          {/* Legacy recruiter routes - redirect to /recruiter/* */}
          <Route path="/dashboard" element={<Navigate to="/recruiter/dashboard" replace />} />
          <Route path="/dashboard/*" element={<Navigate to="/recruiter/dashboard" replace />} />
          <Route path="/profile" element={<Navigate to="/recruiter/profile" replace />} />
          <Route path="/settings" element={<Navigate to="/recruiter/settings" replace />} />
          <Route path="/activity-logs" element={<Navigate to="/recruiter/activity-logs" replace />} />
          <Route path="/jobs" element={<Navigate to="/recruiter/jobs" replace />} />
          <Route path="/create-job" element={<Navigate to="/recruiter/create-job" replace />} />
          <Route path="/jobs/:jobId" element={<JobRedirect to="/recruiter/jobs/:jobId" />} />
          <Route path="/edit-job/:jobId" element={<JobRedirect to="/recruiter/edit-job/:jobId" />} />
          <Route path="/job/:jobId" element={<JobRedirect to="/recruiter/jobs/:jobId" />} />
          <Route path="/candidates" element={<Navigate to="/recruiter/candidates" replace />} />
          <Route path="/candidates/:candidateId" element={<CandidateRedirect to="/recruiter/candidates/:candidateId" />} />
          <Route path="/import-candidates" element={<Navigate to="/recruiter/import-candidates" replace />} />
          <Route path="/search-candidates" element={<Navigate to="/recruiter/search-candidates" replace />} />
          <Route path="/advanced-search" element={<Navigate to="/recruiter/advanced-search" replace />} />
          <Route path="/interviews" element={<Navigate to="/recruiter/interviews" replace />} />
          <Route path="/scheduled-meetings" element={<Navigate to="/recruiter/scheduled-meetings" replace />} />
          <Route path="/mcq-tests" element={<Navigate to="/recruiter/mcq-tests" replace />} />
          <Route path="/technical-tests" element={<Navigate to="/recruiter/technical-tests" replace />} />
          <Route path="/final-interviews" element={<Navigate to="/recruiter/final-interviews" replace />} />
          <Route path="/shortlisted" element={<Navigate to="/recruiter/shortlisted" replace />} />
          <Route path="/gmail-import" element={<Navigate to="/recruiter/gmail-import" replace />} />
          <Route path="/connect-linkedin" element={<Navigate to="/recruiter/connect-linkedin" replace />} />
          <Route path="/integrations-settings" element={<Navigate to="/recruiter/integrations-settings" replace />} />
          
          {/* OAuth Callback Routes - Handle authentication returns (public) */}
          <Route path="/gmail-callback" element={<GmailCallback />} />
          <Route path="/linkedin-callback" element={<LinkedinCallback />} />
          
          {/* ============================================
              ERROR HANDLING
          ============================================ */}
          
          {/* 404 Not Found */}
          <Route path="/404" element={<NotFound />} />
          
          {/* Catch All - Redirect unknown routes to 404 */}
          <Route path="*" element={<Navigate to="/404" replace />} />
        </Routes>
          </RoleProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
);

export default App;