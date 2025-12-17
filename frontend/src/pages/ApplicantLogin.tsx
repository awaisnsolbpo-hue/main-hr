import { Link, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Sparkles, Eye, EyeOff, User, Briefcase, ArrowRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { authApi } from "@/services/api";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";

const ApplicantLogin = () => {
    const navigate = useNavigate();
    const { toast } = useToast();
    const [loading, setLoading] = useState(false);
    const [checkingSession, setCheckingSession] = useState(true);
    const [showPassword, setShowPassword] = useState(false);
    const [showForgotPassword, setShowForgotPassword] = useState(false);
    const [resetEmail, setResetEmail] = useState("");
    const [sendingReset, setSendingReset] = useState(false);
    const [resetSent, setResetSent] = useState(false);
    const [formData, setFormData] = useState({
        email: "",
        password: "",
    });

    useEffect(() => {
        // Check if user is already logged in
        const checkSession = async () => {
            try {
                const { data: { session }, error } = await supabase.auth.getSession();

                if (error) {
                    console.error("Session check error:", error);
                    setCheckingSession(false);
                    return;
                }

                if (session) {
                    // This is applicant login - verify user has applicant role
                    // Use backend API to check role
                    try {
                        const userData = await authApi.getMe();
                        
                        // STRICT: Only redirect if user has applicant role
                        if (userData.role === "applicant") {
                            // Use window.location.replace for immediate, reliable redirect
                            window.location.replace("/applicant/dashboard");
                            return;
                        } else if (userData.role === "recruiter") {
                            // User is recruiter, not applicant - redirect to recruiter dashboard
                            window.location.replace("/recruiter/dashboard");
                            return;
                        } else {
                            // No role assigned - stay on login page
                        }
                    } catch (error) {
                        console.error("Error checking role:", error);
                    } finally {
                        // Always set checkingSession to false, even if redirect happens
                        setCheckingSession(false);
                       
                    }
                } else {
                    setCheckingSession(false);
                }
            } catch (error) {
                console.error("Error checking session:", error);
                setCheckingSession(false);
            } finally {
                // Ensure checkingSession is set to false even if there's an error
                setCheckingSession(false);
                setLoading(false);
            }
        };

        checkSession();

        // Listen for auth state changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            async (event, session) => {
                if (event === 'SIGNED_IN' && session) {
                    // STRICT: Verify applicant role before redirecting
                    try {
                        const userData = await authApi.getMe();
                        
                        if (userData.role === "applicant") {
                            // Use window.location.replace for immediate, reliable redirect
                            window.location.replace("/applicant/dashboard");
                            return;
                        } else if (userData.role === "recruiter") {
                            // Wrong role - redirect to recruiter dashboard
                            window.location.replace("/recruiter/dashboard");
                            return;
                        }
                    } catch (error) {
                        console.error("Error verifying role:", error);
                    } finally {
                        // Ensure checkingSession is set to false
                        setCheckingSession(false);
                    }
                }
            }
        );

        // Cleanup subscription
        return () => {
            subscription.unsubscribe();
        };
    }, []);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.email || !formData.password) {
            toast({
                title: "Missing Information",
                description: "Please enter both email and password",
                variant: "destructive",
            });
            return;
        }

        setLoading(true);

        try {
            // Use applicant login API - ensures applicant profile exists and role is set
            const loginResponse = await authApi.loginApplicant(formData.email, formData.password);

            console.log("Login response:", loginResponse);

            // STRICT: Verify role before redirecting
            if (loginResponse?.role === "applicant") {
                // Don't set loading to false - we're redirecting immediately
                // STRICT: Redirect immediately to applicant dashboard using window.location.replace for more reliable redirect
                console.log("Redirecting to /applicant/dashboard");
                // Use replace instead of href to prevent back button issues, and ensure it happens immediately
                window.location.replace("/applicant/dashboard");
                return; // Exit early since we're redirecting
            } else {
                // Role mismatch - should not happen, but handle it
                console.error("Role mismatch - expected applicant, got:", loginResponse?.role);
                throw new Error("Account role verification failed. Please contact support.");
            }
        } catch (error: any) {
            console.error("Login error:", error);
            
            // Provide user-friendly error messages
            let errorMessage = "Invalid email or password. Please try again.";
            
            if (error.message?.includes("Invalid login credentials") || error.message?.includes("Invalid email or password")) {
                errorMessage = "Invalid email or password. Please check your credentials.";
            } else if (error.message?.includes("Email not confirmed")) {
                errorMessage = "Please verify your email address before logging in.";
            } else if (error.message?.includes("User not found")) {
                errorMessage = "No account found with this email. Please sign up first.";
            } else if (error.message?.includes("recruiter")) {
                errorMessage = "This account is registered as a recruiter. Please use the recruiter login page.";
            }

            toast({
                title: "Login failed",
                description: errorMessage,
                variant: "destructive",
            });
        } finally {
            // Always set loading to false, even if redirect happens (though redirect will prevent this from executing)
            setLoading(false);
        }
    };

    const handleForgotPassword = async () => {
        if (!resetEmail) {
            toast({
                title: "Email Required",
                description: "Please enter your email address",
                variant: "destructive",
            });
            return;
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(resetEmail)) {
            toast({
                title: "Invalid Email",
                description: "Please enter a valid email address",
                variant: "destructive",
            });
            return;
        }

        setSendingReset(true);

        try {
            const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
                redirectTo: `${window.location.origin}/reset-password`,
            });

            if (error) throw error;

            setResetSent(true);
            toast({
                title: "Reset Email Sent!",
                description: "Check your email for the password reset link",
            });

            // Close dialog after 3 seconds
            setTimeout(() => {
                setShowForgotPassword(false);
                setResetSent(false);
                setResetEmail("");
            }, 3000);

        } catch (error: any) {
            console.error("Password reset error:", error);
            toast({
                title: "Reset Failed",
                description: error.message || "Failed to send reset email. Please try again.",
                variant: "destructive",
            });
        } finally {
            setSendingReset(false);
        }
    };

    // Show loading state while checking session
    if (checkingSession) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/20 flex items-center justify-center">
                <div className="text-center">
                    <Sparkles className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
                    <p className="text-foreground/80 font-semibold">Loading...</p>
                </div>
            </div>
        );
    }

    return (
        <>
            <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/20 flex items-center justify-center p-4">
                <div className="w-full max-w-6xl grid lg:grid-cols-2 gap-8 items-center">
                    {/* Left Side - Info Section */}
                    <div className="hidden lg:block space-y-8">
                        <div className="space-y-4">
                            <Link to="/" className="inline-flex items-center space-x-2 mb-8">
                                <div className="p-2 rounded-lg bg-gradient-to-br from-primary to-accent shadow-lg">
                                    <User className="h-6 w-6 text-primary-foreground" />
                                </div>
                                <span className="text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                                    Applicant Portal
                                </span>
                            </Link>
                            <h1 className="text-4xl font-bold text-foreground leading-tight">
                                Welcome Back,
                                <span className="block bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                                    Applicant!
                                </span>
                            </h1>
                            <p className="text-lg text-foreground/90 font-semibold">
                                Sign in to access your applicant dashboard, browse available jobs, and track your applications.
                            </p>
                        </div>

                        <div className="space-y-4 pt-4">
                            <div className="flex items-start gap-3 p-4 rounded-xl border border-border/60 bg-card/50 backdrop-blur-sm">
                                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                                    <Briefcase className="w-5 h-5 text-primary" />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-foreground mb-1">Browse Jobs</h3>
                                    <p className="text-sm text-foreground/80 font-medium">Discover opportunities in our community job board</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3 p-4 rounded-xl border border-border/60 bg-card/50 backdrop-blur-sm">
                                <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center flex-shrink-0">
                                    <Sparkles className="w-5 h-5 text-accent" />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-foreground mb-1">Track Applications</h3>
                                    <p className="text-sm text-muted-foreground">Monitor your application status in real-time</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3 p-4 rounded-xl border border-border/60 bg-card/50 backdrop-blur-sm">
                                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                                    <User className="w-5 h-5 text-primary" />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-foreground mb-1">Manage Profile</h3>
                                    <p className="text-sm text-muted-foreground">Update your CV and professional information</p>
                                </div>
                            </div>
                        </div>

                        <div className="pt-4">
                            <p className="text-sm text-foreground/80 font-medium mb-3">
                                Not an applicant?{" "}
                                <Link to="/recruiter/login" className="text-primary hover:underline font-medium">
                                  Recruiter Login
                                </Link>
                            </p>
                        </div>
                    </div>

                    {/* Right Side - Login Form */}
                    <div className="w-full max-w-md mx-auto lg:mx-0">
                        <div className="lg:hidden text-center mb-6">
                            <Link to="/" className="inline-flex items-center space-x-2">
                                <div className="p-2 rounded-lg bg-gradient-to-br from-primary to-accent">
                                    <User className="h-6 w-6 text-primary-foreground" />
                                </div>
                                <span className="text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                                    Applicant Portal
                                </span>
                            </Link>
                        </div>

                        <Card className="shadow-xl border-2 border-border/60 bg-card/95 backdrop-blur-xl">
                            <CardHeader className="space-y-1 pb-4">
                                <CardTitle className="text-2xl font-bold text-center">Sign In</CardTitle>
                                <CardDescription className="text-center">
                                    Access your applicant dashboard
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <form className="space-y-4" onSubmit={handleLogin}>
                                    <div className="space-y-2">
                                        <Label htmlFor="email" className="text-foreground">Email Address</Label>
                                        <Input
                                            id="email"
                                            type="email"
                                            placeholder="your.email@example.com"
                                            required
                                            value={formData.email}
                                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                            className="h-11 bg-background border-border focus:ring-2 focus:ring-primary focus:ring-offset-2 transition-all"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between">
                                            <Label htmlFor="password" className="text-foreground">Password</Label>
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setShowForgotPassword(true);
                                                    setResetEmail(formData.email);
                                                }}
                                                className="text-sm text-primary hover:underline focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded px-1"
                                            >
                                                Forgot password?
                                            </button>
                                        </div>
                                        <div className="relative">
                                            <Input
                                                id="password"
                                                type={showPassword ? "text" : "password"}
                                                placeholder="••••••••"
                                                required
                                                value={formData.password}
                                                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                                className="h-11 bg-background border-border focus:ring-2 focus:ring-primary focus:ring-offset-2 transition-all pr-10"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowPassword(!showPassword)}
                                                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded p-1 transition-colors"
                                            >
                                                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                            </button>
                                        </div>
                                    </div>

                                    <Button
                                        type="submit"
                                        className="w-full h-11 bg-gradient-to-r from-primary to-accent hover:opacity-90 hover:shadow-lg transition-all duration-300 focus:ring-2 focus:ring-primary focus:ring-offset-2"
                                        size="lg"
                                        disabled={loading || !formData.email || !formData.password}
                                    >
                                        {loading ? (
                                            <>
                                                <Sparkles className="mr-2 h-4 w-4 animate-spin" />
                                                Signing in...
                                            </>
                                        ) : (
                                            <>
                                                Sign In
                                                <ArrowRight className="ml-2 h-4 w-4" />
                                            </>
                                        )}
                                    </Button>
                                </form>

                                <div className="text-center text-sm text-foreground/80 font-medium pt-2">
                                    Don't have an account?{" "}
                                    <Link to="/applicant/signup" className="text-primary hover:underline font-medium focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded">
                                      Sign Up
                                    </Link>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>

            {/* Forgot Password Dialog */}
            <Dialog open={showForgotPassword} onOpenChange={setShowForgotPassword}>
                <DialogContent className="sm:max-w-md bg-card border-2 border-border/60 shadow-xl">
                    <DialogHeader>
                        <DialogTitle>Reset Password</DialogTitle>
                        <DialogDescription>
                            Enter your email address and we'll send you a link to reset your password.
                        </DialogDescription>
                    </DialogHeader>
                    
                    {resetSent ? (
                        <div className="space-y-4 py-4">
                            <div className="flex items-center justify-center">
                                <div className="rounded-full bg-green-100 p-3">
                                    <Sparkles className="h-6 w-6 text-green-600" />
                                </div>
                            </div>
                            <div className="text-center space-y-2">
                                <h3 className="font-semibold text-green-900">Email Sent!</h3>
                                <p className="text-sm text-green-700">
                                    Check your inbox for the password reset link.
                                </p>
                                <p className="text-xs text-foreground/80 font-medium">
                                    Don't see it? Check your spam folder.
                                </p>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-4 py-4">
                            <div className="space-y-2">
                                <Label htmlFor="reset-email">Email Address</Label>
                                <Input
                                    id="reset-email"
                                    type="email"
                                    placeholder="your.email@example.com"
                                    value={resetEmail}
                                    onChange={(e) => setResetEmail(e.target.value)}
                                    onKeyDown={(e) => e.key === "Enter" && handleForgotPassword()}
                                    className="bg-background border-border focus:ring-2 focus:ring-primary focus:ring-offset-2"
                                />
                            </div>
                            
                            <div className="flex gap-2">
                                <Button
                                    type="button"
                                    variant="outline"
                                    className="flex-1 border-border hover:bg-accent focus:ring-2 focus:ring-primary focus:ring-offset-2"
                                    onClick={() => {
                                        setShowForgotPassword(false);
                                        setResetEmail("");
                                        setResetSent(false);
                                    }}
                                    disabled={sendingReset}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    type="button"
                                    className="flex-1 bg-gradient-to-r from-primary to-accent hover:opacity-90 focus:ring-2 focus:ring-primary focus:ring-offset-2"
                                    onClick={handleForgotPassword}
                                    disabled={sendingReset || !resetEmail}
                                >
                                    {sendingReset ? "Sending..." : "Send Reset Link"}
                                </Button>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </>
    );
};

export default ApplicantLogin;

