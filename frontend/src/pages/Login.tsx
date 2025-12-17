import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Sparkles, Eye, EyeOff } from "lucide-react";
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

const Login = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
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

    // Optional redirect param (e.g., after invite). If not provided, redirect to recruiter dashboard.
    const redirectParam = searchParams.get('redirect') || '';

    const checkRoleAndNavigate = async (userId: string) => {
        try {
            // STRICT: Use backend API to verify recruiter role
            const userData = await authApi.getMe();
            
            // STRICT: Only redirect if user has recruiter role
            if (userData.role === 'recruiter') {
                const target = redirectParam || '/recruiter/dashboard';
                // Use window.location.replace for immediate, reliable redirect
                window.location.replace(target);
                return;
            } else if (userData.role === 'applicant') {
                // User is applicant, not recruiter - redirect to applicant dashboard
                window.location.replace('/applicant/dashboard');
                return;
            } else {
                // No role assigned - sign out and stay on login page
                await supabase.auth.signOut();
                return;
            }
        } catch (error) {
            console.error('Error in checkRoleAndNavigate:', error);
            // On error, sign out and stay on login page
            try {
                await supabase.auth.signOut();
            } catch (signOutError) {
                console.error('Error signing out:', signOutError);
            }
        } finally {
            // Always set checkingSession to false, even if redirect happens
            setCheckingSession(false);
            setLoading(false);
        }
    };

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

                if (session?.user) {
                    // User is already logged in, check role and redirect accordingly
                    await checkRoleAndNavigate(session.user.id);
                } else {
                    setCheckingSession(false);
                }
            } catch (error) {
                console.error("Error checking session:", error);
                setCheckingSession(false);
            } finally {
                // Ensure checkingSession is set to false
                setCheckingSession(false);
            }
        };

        // Check immediately on mount
        checkSession();

        // Listen for auth state changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            async (event, session) => {
                if (event === 'SIGNED_IN' && session?.user) {
                    try {
                        // Check role and redirect accordingly
                        await checkRoleAndNavigate(session.user.id);
                    } catch (error) {
                        console.error('Error in auth state change handler:', error);
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
    }, [navigate]);

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
            // Use recruiter login API - ensures profile exists and role is set
            const loginResponse = await authApi.loginRecruiter(formData.email, formData.password);

            // STRICT: Verify recruiter role before redirecting
            if (loginResponse.role === "recruiter") {
                // STRICT: Redirect immediately to recruiter dashboard using window.location for reliability
                const target = redirectParam || '/recruiter/dashboard';
                // Don't set loading to false - we're redirecting
                window.location.replace(target);
                return;
            } else {
                // Role mismatch - should not happen, but handle it
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
            } else if (error.message?.includes("applicant")) {
                errorMessage = "This account is registered as an applicant. Please use the applicant login page.";
            } else if (error.message?.includes("recruiter")) {
                errorMessage = error.message;
            }

            toast({
                title: "Login failed",
                description: errorMessage,
                variant: "destructive",
            });
        } finally {
            // Always set loading to false, even if redirect happens
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
            <div className="min-h-screen bg-[var(--gradient-subtle)] flex items-center justify-center">
                <div className="text-center">
                    <Sparkles className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
                    <p className="text-muted-foreground">Loading...</p>
                </div>
            </div>
        );
    }

    return (
        <>
            <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/20 relative">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(99,102,241,0.08),transparent_30%),radial-gradient(circle_at_80%_0%,rgba(236,72,153,0.08),transparent_25%)] pointer-events-none" />
                <div className="relative flex items-center justify-center px-4 py-12">
                    <div className="w-full max-w-5xl grid lg:grid-cols-2 gap-10 items-center">
                        {/* Left pane */}
                        <div className="hidden lg:block space-y-6">
                            <Link to="/" className="inline-flex items-center space-x-2">
                                <div className="p-2 rounded-xl bg-gradient-to-br from-primary to-accent shadow-[var(--shadow-button)]">
                                    <Sparkles className="h-6 w-6 text-primary-foreground" />
                                </div>
                                <span className="text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                                    AI Hiring
                                </span>
                            </Link>
                            <div className="space-y-4">
                                <h1 className="text-4xl font-bold text-foreground leading-tight">
                                    Sign in to your recruiter workspace
                                </h1>
                                <p className="text-muted-foreground text-lg">
                                    Manage jobs, candidates, assessments, and interviews in one place.
                                </p>
                                <div className="space-y-3">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-lg bg-primary/10 ring-1 ring-primary/15 flex items-center justify-center">
                                            <Sparkles className="h-5 w-5 text-primary" />
                                        </div>
                                        <div>
                                            <p className="font-semibold text-foreground">Dashboard access</p>
                                            <p className="text-sm text-muted-foreground">Full control over hiring pipeline</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-lg bg-accent/10 ring-1 ring-accent/15 flex items-center justify-center">
                                            <Eye className="h-5 w-5 text-accent" />
                                        </div>
                                        <div>
                                            <p className="font-semibold text-foreground">Applicant portal</p>
                                            <p className="text-sm text-muted-foreground">Applicants sign in to their dashboard separately</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Right pane - card */}
                        <div className="w-full">
                            <Card className="p-8 space-y-6 border border-border/60 shadow-xl bg-card/90 backdrop-blur-xl">
                                <div className="space-y-2 text-left">
                                    <h1 className="text-2xl font-bold">Welcome back</h1>
                                    <p className="text-muted-foreground">Sign in to continue</p>
                                </div>

                                <form className="space-y-4" onSubmit={handleLogin}>
                                    <div className="space-y-2">
                                        <Label htmlFor="email">Email *</Label>
                                        <Input
                                            id="email"
                                            type="email"
                                            placeholder="john@company.com"
                                            required
                                            value={formData.email}
                                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                            className="h-11 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between">
                                            <Label htmlFor="password">Password *</Label>
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setShowForgotPassword(true);
                                                    setResetEmail(formData.email);
                                                }}
                                                className="text-sm text-primary hover:underline"
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
                                                className="h-11 pr-10 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowPassword(!showPassword)}
                                                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                            >
                                                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                            </button>
                                        </div>
                                    </div>

                                    <Button
                                        type="submit"
                                        className="w-full h-11 bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 text-primary-foreground transition-all duration-200 shadow-[var(--shadow-button)] focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-primary focus-visible:ring-offset-background"
                                        size="lg"
                                        disabled={loading || !formData.email || !formData.password}
                                    >
                                        {loading ? "Signing in..." : "Sign In"}
                                    </Button>
                                </form>

                                <div className="text-center text-sm">
                                    Don't have an account?{" "}
                                    <Link to="/recruiter/signup" className="text-primary hover:underline font-medium">
                                      Sign Up
                                    </Link>
                                </div>

                                <div className="text-xs text-muted-foreground text-center">
                                    Applicants should use the applicant portal to sign up and sign in.
                                </div>
                            </Card>
                        </div>
                    </div>
                </div>
            </div>

            {/* Forgot Password Dialog */}
            <Dialog open={showForgotPassword} onOpenChange={setShowForgotPassword}>
                <DialogContent className="sm:max-w-md bg-card border border-border/60 shadow-xl">
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
                                <p className="text-xs text-muted-foreground">
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
                                    placeholder="john@company.com"
                                    value={resetEmail}
                                    onChange={(e) => setResetEmail(e.target.value)}
                                    onKeyDown={(e) => e.key === "Enter" && handleForgotPassword()}
                                />
                            </div>
                            
                            <div className="flex gap-2">
                                <Button
                                    type="button"
                                    variant="outline"
                                    className="flex-1"
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
                                    className="flex-1"
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

export default Login;