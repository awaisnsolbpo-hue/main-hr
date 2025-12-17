import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { publicApi } from "@/services/api";
import { Loader2, Code2, Clock, Video, CheckCircle } from "lucide-react";
import Chatbot from "@/components/Chatbot";

const PracticalTestLanding = () => {
  const [email, setEmail] = useState("");
  const [candidateId, setCandidateId] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleStartPractical = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email.trim()) {
      toast({
        title: "Email Required",
        description: "Please enter your email address.",
        variant: "destructive",
      });
      return;
    }

    if (!candidateId.trim()) {
      toast({
        title: "Candidate ID Required",
        description: "Please enter your candidate ID.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      // Fetch candidate from candidates table using email and ID
      const { candidates } = await publicApi.getInterviewCandidate(email, candidateId);

      if (!candidates || candidates.length === 0) {
        toast({
          title: "Not Found",
          description: "No candidate found with this email and ID.",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      // Find candidate matching both email and ID with "Scheduled For Practical Interview" status
      const practicalCandidate = candidates.find(
        (c: any) => c.id === candidateId.trim() && 
        (c.status?.trim() === "Scheduled For Practical Interview" || 
         c.status?.trim() === "Scheduled For Practical Test" || 
         c.status?.trim() === "Scheduled For Practical" ||
         c.interview_status?.trim() === "Scheduled For Practical Interview" ||
         c.interview_status?.trim() === "Scheduled For Practical Test")
      );

      if (!practicalCandidate) {
        toast({
          title: "Not Scheduled",
          description: "Your practical test is not scheduled yet. Please contact support.",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      // Check if candidate has job_id
      if (!practicalCandidate.job_id) {
        toast({
          title: "Error",
          description: "No job associated with your candidate record. Please contact support.",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      // Redirect to Practical Test Room with email and job_id
      navigate(`/practical-test-room?email=${encodeURIComponent(email)}&job_id=${encodeURIComponent(practicalCandidate.job_id)}`);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to load practical test. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="flex justify-center">
            <div className="p-4 bg-gradient-to-br from-primary/20 via-primary/10 to-accent/20 rounded-2xl shadow-lg">
              <Code2 className="h-12 w-12 text-primary" />
            </div>
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary via-primary/90 to-accent bg-clip-text text-transparent">
            Practical Coding Test
          </h1>
          <p className="text-lg text-muted-foreground max-w-md mx-auto">
            Demonstrate your coding skills and problem-solving approach through a hands-on practical assessment.
          </p>
        </div>

        {/* Features */}
        <div className="grid md:grid-cols-3 gap-4">
          <Card className="border-2 shadow-md hover:shadow-lg transition-all">
            <CardContent className="pt-6 text-center space-y-2">
              <Code2 className="h-8 w-8 text-primary mx-auto" />
              <h3 className="font-semibold">Real Coding</h3>
              <p className="text-sm text-muted-foreground">Solve actual programming challenges</p>
            </CardContent>
          </Card>

          <Card className="border-2 shadow-md hover:shadow-lg transition-all">
            <CardContent className="pt-6 text-center space-y-2">
              <Clock className="h-8 w-8 text-primary mx-auto" />
              <h3 className="font-semibold">Timed Test</h3>
              <p className="text-sm text-muted-foreground">Complete within the allocated time</p>
            </CardContent>
          </Card>

          <Card className="border-2 shadow-md hover:shadow-lg transition-all">
            <CardContent className="pt-6 text-center space-y-2">
              <Video className="h-8 w-8 text-primary mx-auto" />
              <h3 className="font-semibold">Screen Recording</h3>
              <p className="text-sm text-muted-foreground">Record your screen while coding</p>
            </CardContent>
          </Card>
        </div>

        {/* Form */}
        <Card className="shadow-xl border-2">
          <CardHeader className="bg-gradient-to-r from-primary/5 to-accent/5 border-b-2">
            <CardTitle>Start Your Practical Test</CardTitle>
            <CardDescription>Enter your email address and candidate ID to begin the assessment</CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <form onSubmit={handleStartPractical} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-foreground">Email Address</label>
                <Input
                  type="email"
                  placeholder="your.email@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="border-2 h-11"
                  disabled={loading}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-foreground">Candidate ID</label>
                <Input
                  type="text"
                  placeholder="Enter your candidate ID"
                  value={candidateId}
                  onChange={(e) => setCandidateId(e.target.value)}
                  className="border-2 h-11"
                  disabled={loading}
                />
              </div>

              <Button
                type="submit"
                size="lg"
                className="w-full mt-6"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                    Verifying...
                  </>
                ) : (
                  <>
                    <Code2 className="h-5 w-5 mr-2" />
                    Start Practical Test
                  </>
                )}
              </Button>
            </form>

            <div className="mt-6 p-4 bg-muted/50 rounded-lg border border-border/60">
              <p className="text-xs text-muted-foreground text-center">
                ✓ Screen recording required (OBS, ShareX, etc.)<br/>
                ✓ Think aloud while coding<br/>
                ✓ AI-powered evaluation<br/>
                ✓ Detailed feedback provided
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Instructions */}
        <Card className="shadow-lg border-2">
          <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 border-b-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-primary" />
              Before You Start
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="space-y-3 text-sm">
              <div className="flex gap-3">
                <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                <span>Have your code editor ready (VS Code, PyCharm, etc.)</span>
              </div>
              <div className="flex gap-3">
                <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                <span>Set up your screen recording tool (OBS, ShareX, Screenflow, or built-in recorder)</span>
              </div>
              <div className="flex gap-3">
                <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                <span>Test your microphone - you'll need to explain your approach</span>
              </div>
              <div className="flex gap-3">
                <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                <span>Close unnecessary applications and browser tabs</span>
              </div>
              <div className="flex gap-3">
                <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                <span>Ensure stable internet connection</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <p className="text-center text-sm text-muted-foreground">
          Questions or technical issues? Contact support@company.com
        </p>
      </div>
      <Chatbot />
    </div>
  );
};

export default PracticalTestLanding;

