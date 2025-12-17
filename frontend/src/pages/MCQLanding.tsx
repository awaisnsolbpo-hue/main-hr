import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { publicApi } from "@/services/api";
import { Loader2, ClipboardCheck, Zap, Brain } from "lucide-react";
import Chatbot from "@/components/Chatbot";

const MCQLanding = () => {
  const [email, setEmail] = useState("");
  const [candidateId, setCandidateId] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleStartMCQ = async (e: React.FormEvent) => {
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

      // Find candidate matching both email and ID with "Scheduled For MCQS" status
      const mcqCandidate = candidates.find(
        (c: any) => c.id === candidateId.trim() && c.status?.trim() === "Scheduled For MCQS"
      );

      if (!mcqCandidate) {
        toast({
          title: "Not Scheduled",
          description: "Your MCQ test is not scheduled yet. Please contact support.",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      // Check if candidate has job_id
      if (!mcqCandidate.job_id) {
        toast({
          title: "Error",
          description: "No job associated with your candidate record. Please contact support.",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      // Redirect to MCQs Room with email and candidate ID
      navigate(`/mcqs-room?email=${encodeURIComponent(email)}&candidate_id=${encodeURIComponent(candidateId)}`);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to load MCQ test. Please try again.",
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
              <ClipboardCheck className="h-12 w-12 text-primary" />
            </div>
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary via-primary/90 to-accent bg-clip-text text-transparent">
            MCQ Assessment Test
          </h1>
          <p className="text-lg text-muted-foreground max-w-md mx-auto">
            Demonstrate your knowledge and skills through our comprehensive multiple-choice assessment.
          </p>
        </div>

        {/* Features */}
        <div className="grid md:grid-cols-3 gap-4">
          <Card className="border-2 shadow-md hover:shadow-lg transition-all">
            <CardContent className="pt-6 text-center space-y-2">
              <Brain className="h-8 w-8 text-primary mx-auto" />
              <h3 className="font-semibold">30 Questions</h3>
              <p className="text-sm text-muted-foreground">Technical, behavioral & workplace questions</p>
            </CardContent>
          </Card>

          <Card className="border-2 shadow-md hover:shadow-lg transition-all">
            <CardContent className="pt-6 text-center space-y-2">
              <Zap className="h-8 w-8 text-primary mx-auto" />
              <h3 className="font-semibold">15 Minutes</h3>
              <p className="text-sm text-muted-foreground">Complete all questions within the time limit</p>
            </CardContent>
          </Card>

          <Card className="border-2 shadow-md hover:shadow-lg transition-all">
            <CardContent className="pt-6 text-center space-y-2">
              <ClipboardCheck className="h-8 w-8 text-primary mx-auto" />
              <h3 className="font-semibold">Instant Evaluation</h3>
              <p className="text-sm text-muted-foreground">AI-powered answer analysis & scoring</p>
            </CardContent>
          </Card>
        </div>

        {/* Form */}
        <Card className="shadow-xl border-2">
          <CardHeader className="bg-gradient-to-r from-primary/5 to-accent/5 border-b-2">
            <CardTitle>Start Your MCQ Test</CardTitle>
            <CardDescription>Enter your email address and candidate ID to begin the assessment</CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <form onSubmit={handleStartMCQ} className="space-y-4">
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
                  "Start MCQ Test"
                )}
              </Button>
            </form>

            <div className="mt-6 p-4 bg-muted/50 rounded-lg border border-border/60">
              <p className="text-xs text-muted-foreground text-center">
                ✓ Screen recording required during test<br/>
                ✓ 15-minute time limit<br/>
                ✓ AI-powered evaluation<br/>
                ✓ Instant results
              </p>
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

export default MCQLanding;

