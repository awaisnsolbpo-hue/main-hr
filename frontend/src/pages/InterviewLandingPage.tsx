import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertDialog, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { publicApi } from "@/services/api";
import { Video, Sparkles, Shield, Briefcase } from "lucide-react";
import Chatbot from "@/components/Chatbot";

interface JobInterview {
  id: string;
  job_id: string;
  job_title: string | null;
  interview_status: string;
}

const InterviewLandingPage = () => {
  const [email, setEmail] = useState("");
  const [candidateId, setCandidateId] = useState("");
  const [loading, setLoading] = useState(false);
  const [showNotScheduled, setShowNotScheduled] = useState(false);
  const [showCompleted, setShowCompleted] = useState(false);
  const [showOtherStatus, setShowOtherStatus] = useState(false);
  const [showJobSelection, setShowJobSelection] = useState(false);
  const [availableJobs, setAvailableJobs] = useState<JobInterview[]>([]);
  const [statusMessage, setStatusMessage] = useState("");
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email.trim() || !candidateId.trim()) {
      toast({
        title: "Missing Information",
        description: "Please provide both email and candidate ID.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      // Fetch interview records from qualified_for_final_interview table
      const { interviews: data } = await publicApi.getQualifiedInterviewCandidate(email.trim(), candidateId.trim());
      
      // Check if interview exists in database
      if (!data || data.length === 0) {
        setShowNotScheduled(true);
        setLoading(false);
        return;
      }

      // Filter to only scheduled interviews
      const scheduledInterviews = data.filter((record: any) => {
        const status = record?.interview_status?.trim()?.toLowerCase() || "";
        return status === "scheduled" || status === "pending";
      });

      // Check if there are multiple scheduled interviews
      if (scheduledInterviews.length > 1) {
        // Show job selection popup
        const jobsList: JobInterview[] = scheduledInterviews.map((record: any) => ({
          id: record.id,
          job_id: record.job_id,
          job_title: record.job_title || record.jobs?.title || "Unknown Job",
          interview_status: record.interview_status,
        }));
        setAvailableJobs(jobsList);
        setShowJobSelection(true);
        setLoading(false);
        return;
      }

      // If only one scheduled interview, proceed normally
      if (scheduledInterviews.length === 1) {
        const interviewData = scheduledInterviews[0] as any;
        navigate(`/interview-room?email=${encodeURIComponent(email.trim())}&candidate_id=${encodeURIComponent(candidateId.trim())}&job_id=${encodeURIComponent(interviewData.job_id)}`);
        setLoading(false);
        return;
      }

      // Check other statuses from all records
      const completedInterviews = data.filter((record: any) => {
        const status = record?.interview_status?.trim()?.toLowerCase() || "";
        return status === "completed" || status === "finished";
      });

      if (completedInterviews.length > 0) {
        setShowCompleted(true);
        return;
      }

      // Check for other statuses
      const otherStatusRecords = data.filter((record: any) => {
        const status = record?.interview_status?.trim()?.toLowerCase() || "";
        return status && status !== "scheduled" && status !== "pending" && status !== "completed" && status !== "finished";
      });

      if (otherStatusRecords.length > 0) {
        const firstRecord = otherStatusRecords[0] as any;
        setStatusMessage(firstRecord.interview_status || "");
        setShowOtherStatus(true);
        return;
      }

      // No scheduled interviews found
      setShowNotScheduled(true);
    } catch (err: any) {
      console.error("Unexpected error:", err);
      toast({
        title: "Error",
        description: err.message || "Failed to verify your information. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleJobSelection = (job: JobInterview) => {
    navigate(`/interview-room?email=${encodeURIComponent(email.trim())}&candidate_id=${encodeURIComponent(candidateId.trim())}&job_id=${encodeURIComponent(job.job_id)}`);
    setShowJobSelection(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/20">
      {/* Header */}
      <header className="border-b bg-card/70 backdrop-blur-xl">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-gradient-to-br from-primary to-accent rounded-lg flex items-center justify-center shadow-[var(--shadow-button)]">
              <Video className="w-6 h-6 text-primary-foreground" />
            </div>
            <h1 className="text-xl font-bold text-foreground">AI Interview Portal</h1>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="container mx-auto px-4 py-16">
        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left side - Info */}
            <div className="space-y-6">
              <div className="inline-block">
                <div className="bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium flex items-center gap-2 ring-1 ring-primary/15">
                  <Sparkles className="w-4 h-4" />
                  AI-Powered Interviews
                </div>
              </div>
              <h2 className="text-5xl font-bold text-foreground leading-tight">
                Welcome to Your
                <span className="block bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                  AI Interview
                </span>
              </h2>
              <p className="text-lg text-muted-foreground">
                Experience a professional, AI-driven interview process. Our advanced system conducts personalized interviews tailored to your background and the position.
              </p>
              
              {/* Features */}
              <div className="space-y-4 pt-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0 ring-1 ring-primary/15">
                    <Video className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">Real-time Interaction</h3>
                    <p className="text-sm text-muted-foreground">Live voice conversation with our AI interviewer</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center flex-shrink-0 ring-1 ring-accent/15">
                    <Sparkles className="w-5 h-5 text-accent" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">Personalized Questions</h3>
                    <p className="text-sm text-muted-foreground">Custom questions based on your profile and role</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0 ring-1 ring-primary/15">
                    <Shield className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">Secure & Private</h3>
                    <p className="text-sm text-muted-foreground">Your interview data is encrypted and secure</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right side - Form */}
            <Card className="shadow-xl border border-border/60 bg-card/90 backdrop-blur-xl">
              <CardHeader>
                <CardTitle>Access Your Interview</CardTitle>
                <CardDescription>
                  Enter your details to join your scheduled AI interview
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="john@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="h-11 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="candidateId">Candidate ID</Label>
                    <Input
                      id="candidateId"
                      type="text"
                      placeholder="Paste your candidate ID here"
                      value={candidateId}
                      onChange={(e) => setCandidateId(e.target.value)}
                      required
                      className="h-11 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                    />
                    <p className="text-xs text-muted-foreground">
                      Find this in your interview invitation email
                    </p>
                  </div>
                  <Button
                    type="submit"
                    className="w-full h-11 bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 text-primary-foreground transition-all duration-200 shadow-[var(--shadow-button)] focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-primary focus-visible:ring-offset-background"
                    disabled={loading}
                  >
                    {loading ? "Verifying..." : "Access Interview Room"}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      {/* Not Scheduled Dialog */}
      <AlertDialog open={showNotScheduled} onOpenChange={setShowNotScheduled}>
        <AlertDialogContent className="bg-card border border-border/60 shadow-xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Interview Not Scheduled</AlertDialogTitle>
            <AlertDialogDescription>
              We couldn't find an interview scheduled for this email address. Please check your email or contact our support team.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <Button
              onClick={() => setShowNotScheduled(false)}
              className="focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-primary"
            >
              Try Again
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Interview Completed Dialog */}
      <AlertDialog open={showCompleted} onOpenChange={setShowCompleted}>
        <AlertDialogContent className="bg-card border border-border/60 shadow-xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Interview Already Completed</AlertDialogTitle>
            <AlertDialogDescription>
              This interview has already been completed. If you believe this is an error, please contact our support team.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <Button
              onClick={() => setShowCompleted(false)}
              className="focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-primary"
            >
              Close
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Other Status Dialog */}
      <AlertDialog open={showOtherStatus} onOpenChange={setShowOtherStatus}>
        <AlertDialogContent className="bg-card border border-border/60 shadow-xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Interview Status: {statusMessage}</AlertDialogTitle>
            <AlertDialogDescription>
              Your interview status is currently "{statusMessage}". This interview is not available at this time. Please contact our support team if you have any questions.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <Button
              onClick={() => setShowOtherStatus(false)}
              className="focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-primary"
            >
              Close
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Job Selection Dialog */}
      <AlertDialog open={showJobSelection} onOpenChange={setShowJobSelection}>
        <AlertDialogContent className="bg-card border border-border/60 shadow-xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Select Interview</AlertDialogTitle>
            <AlertDialogDescription>
              You have multiple scheduled interviews. Please select which interview you would like to access.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-2 py-4">
            {availableJobs.map((job) => (
              <Button
                key={job.id}
                variant="outline"
                className="w-full justify-start h-auto py-4 px-4 hover:bg-accent/20 text-foreground border-border/70 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-primary"
                onClick={() => handleJobSelection(job)}
              >
                <div className="flex items-center gap-3 w-full">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Briefcase className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1 text-left">
                    <div className="font-semibold text-foreground">{job.job_title}</div>
                    <div className="text-sm text-muted-foreground">Click to access interview</div>
                  </div>
                </div>
              </Button>
            ))}
          </div>
          <AlertDialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowJobSelection(false)}
              className="focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-primary"
            >
              Cancel
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <Chatbot />
    </div>
  );
};

export default InterviewLandingPage;

