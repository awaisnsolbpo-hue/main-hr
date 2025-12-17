import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { publicApi } from "@/services/api";
import { Loader2, User, Mail, LogIn } from "lucide-react";

const CandidateLogin = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email.trim()) {
      toast({
        title: "Email Required",
        description: "Please enter your email address.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      // Verify candidate exists by email only
      const candidateData = await publicApi.getCandidateProfile(email, '');
      
      if (!candidateData || !candidateData.email) {
        toast({
          title: "Not Found",
          description: "No applications found with this email address.",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      // Store in localStorage
      localStorage.setItem("candidateEmail", email);

      // Redirect to dashboard
      navigate("/candidate-dashboard");
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to verify email. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Card className="shadow-2xl border-2">
          {/* Header */}
          <CardHeader className="bg-gradient-to-r from-primary/10 via-primary/5 to-accent/10 border-b-2 pb-8">
            <div className="flex justify-center mb-4">
              <div className="p-4 bg-gradient-to-br from-primary via-primary/90 to-accent rounded-2xl shadow-lg">
                <User className="h-10 w-10 text-white" />
              </div>
            </div>
            <CardTitle className="text-2xl text-center">Candidate Portal</CardTitle>
            <CardDescription className="text-center mt-2">
              View your application status and assessment scores
            </CardDescription>
          </CardHeader>

          <CardContent className="pt-8">
            <form onSubmit={handleLogin} className="space-y-4">
              {/* Email Input */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-foreground flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  Email Address
                </label>
                <Input
                  type="email"
                  placeholder="your.email@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="border-2 h-11"
                  disabled={loading}
                />
                <p className="text-xs text-foreground/80 font-medium">
                  Enter the email address you used to apply for jobs
                </p>
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                size="lg"
                className="w-full mt-6 bg-primary hover:bg-primary/90 h-11"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                    Verifying...
                  </>
                ) : (
                  <>
                    <LogIn className="h-5 w-5 mr-2" />
                    Access Portal
                  </>
                )}
              </Button>
            </form>

            {/* Info Box */}
            <div className="mt-8 p-4 bg-blue-50 border-2 border-blue-200 rounded-lg">
              <p className="text-xs text-blue-700 text-center font-medium">
                <span className="font-bold">Tip:</span> You can access this portal anytime to check your application status, scores, and scheduled interviews.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CandidateLogin;

