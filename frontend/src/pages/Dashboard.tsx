import { useState, useEffect, useRef, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Loader2,
    FolderKanban,
    UserCircle,
    Calendar,
    BadgeCheck,
    TrendingUp,
    Award,
    ClipboardList,
    Code2,
    UserCheck,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { dashboardApi, profileApi } from "@/services/api";
import DashboardLayout from "@/components/DashboardLayout";
import DashboardHeader from "@/components/DashboardHeader";
import PageBackground from "@/components/PageBackground";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { PipelineFunnel } from "@/components/dashboard/PipelineFunnel";
import { UpcomingMeetings } from "@/components/dashboard/UpcomingMeetings";
import { useUserRoleAndProfile } from "@/hooks/useUserRoleAndProfile";

interface UpcomingMeeting {
    id: string;
    candidate_name: string;
    candidate_email: string;
    job_title: string | null;
    meeting_date: string;
    meeting_duration: number;
    meeting_link: string;
    ai_score: number | null;
}

interface Profile {
    id: string;
    full_name: string;
    email: string;
    company_name: string | null;
    company_logo_url: string | null;
    is_company_profile_complete: boolean;
}

const Dashboard = () => {
    const navigate = useNavigate();
    const { toast } = useToast();
    const [referralLink] = useState("https://aihiring.com/ref/abc123");
    const [metrics, setMetrics] = useState({
        activeJobs: 0,
        linkedInJobs: 0,
        totalCandidates: 0,
        initialInterviewQualified: 0,
        scheduledInterviews: 0,
        shortlistedCandidates: 0,
        successRate: 0,
        mcqTests: {
            total: 0,
            completed: 0,
            passed: 0,
            passRate: 0,
        },
        technicalTests: {
            total: 0,
            completed: 0,
            passed: 0,
            passRate: 0,
        },
    });
    const [pipelineFunnel, setPipelineFunnel] = useState({
        applied: 0,
        mcq: 0,
        technical: 0,
        finalInterview: 0,
        shortlisted: 0,
    });
    const [upcomingMeetings, setUpcomingMeetings] = useState<UpcomingMeeting[]>([]);
    const [loading, setLoading] = useState(true);
    // User is now managed by useUserRoleAndProfile hook
    const [profile, setProfile] = useState<Profile | null>(null);
    
    // Debouncing refs to prevent excessive API calls
    const metricsTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const meetingsTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const isFetchingMetricsRef = useRef(false);
    const isFetchingMeetingsRef = useRef(false);

    const deduplicateCandidatesByEmail = (candidates: any[]): any[] => {
        const candidateMap = new Map<string, any>();

        candidates.forEach(candidate => {
            const email = candidate.email?.toLowerCase();
            if (!email) return;

            const existing = candidateMap.get(email);

                const getPriority = (source: string) => {
                const priorities: Record<string, number> = {
                    'candidates': 1,
                    'Final Interview': 3,
                    'Shortlisted': 4
                };
                return priorities[source] || 0;
            };

            if (!existing || getPriority(candidate.source) > getPriority(existing.source)) {
                candidateMap.set(email, candidate);
            }
        });

        return Array.from(candidateMap.values());
    };

    // Immediate fetch functions for initial load (no debounce)
    const fetchUpcomingMeetingsImmediate = useCallback(async (userId: string) => {
        if (isFetchingMeetingsRef.current) return;
        isFetchingMeetingsRef.current = true;

        try {
            const { meetings } = await dashboardApi.getUpcomingMeetings();
            setUpcomingMeetings(meetings);
        } catch (error: any) {
            // Error fetching upcoming meetings
        } finally {
            isFetchingMeetingsRef.current = false;
        }
    }, []);

    const fetchMetricsImmediate = useCallback(async (userId: string) => {
        if (isFetchingMetricsRef.current) return;
        isFetchingMetricsRef.current = true;

        try {
            const { metrics } = await dashboardApi.getMetrics();
            setMetrics(metrics);
            
            // Fetch pipeline funnel
            try {
                const { funnel } = await dashboardApi.getPipelineFunnel();
                if (funnel) {
                    setPipelineFunnel(funnel);
                }
            } catch (funnelError) {
                // Silently fail - pipeline funnel is optional
            }
        } catch (error: any) {
            // Error fetching metrics
        } finally {
            setLoading(false);
            isFetchingMetricsRef.current = false;
        }
    }, []);

    // Debounced fetch functions to prevent rate limiting (for real-time updates)
    const fetchUpcomingMeetings = useCallback(async (userId: string) => {
        // Clear existing timeout
        if (meetingsTimeoutRef.current) {
            clearTimeout(meetingsTimeoutRef.current);
        }

        // If already fetching, skip
        if (isFetchingMeetingsRef.current) {
            return;
        }

        // Debounce: wait 500ms before making request
        meetingsTimeoutRef.current = setTimeout(async () => {
            if (isFetchingMeetingsRef.current) return;
            isFetchingMeetingsRef.current = true;

            try {
                const { meetings } = await dashboardApi.getUpcomingMeetings();
                setUpcomingMeetings(meetings);
            } catch (error: any) {
                // Error fetching upcoming meetings
                // Don't show error toast for rate limiting - it's expected
                if (error.message && !error.message.includes('429')) {
                    // Only log non-rate-limit errors
                }
            } finally {
                isFetchingMeetingsRef.current = false;
            }
        }, 500);
    }, []);

    const fetchMetrics = useCallback(async (userId: string) => {
        // Clear existing timeout
        if (metricsTimeoutRef.current) {
            clearTimeout(metricsTimeoutRef.current);
        }

        // If already fetching, skip
        if (isFetchingMetricsRef.current) {
            return;
        }

        // Debounce: wait 1000ms before making request
        metricsTimeoutRef.current = setTimeout(async () => {
            if (isFetchingMetricsRef.current) return;
            isFetchingMetricsRef.current = true;

            try {
                const { metrics } = await dashboardApi.getMetrics();
                setMetrics(metrics);
            } catch (error: any) {
                // Error fetching metrics
                // Don't show error toast for rate limiting
                if (error.message && !error.message.includes('429')) {
                    // Only log non-rate-limit errors
                }
            } finally {
                setLoading(false);
                isFetchingMetricsRef.current = false;
            }
        }, 1000);
    }, []);


    // Use the hook to get user, role, and profile
    const { user: authUser, role, recruiterProfile, loading: authLoading } = useUserRoleAndProfile(true);

    useEffect(() => {
        if (authUser && recruiterProfile) {
            // Set profile from hook
            setProfile({
                id: recruiterProfile.id,
                full_name: recruiterProfile.full_name,
                email: recruiterProfile.email,
                company_name: recruiterProfile.company_name || null,
                company_logo_url: recruiterProfile.company_logo_url || null,
                is_company_profile_complete: recruiterProfile.is_company_profile_complete || false,
            });

            // Initial load - call immediately without debounce
            fetchMetricsImmediate(authUser.id);
            fetchUpcomingMeetingsImmediate(authUser.id);
        }
    }, [authUser, recruiterProfile, fetchMetricsImmediate, fetchUpcomingMeetingsImmediate]);

    // Profile is now loaded via useUserRoleAndProfile hook
    // Show toast if profile is incomplete
    useEffect(() => {
        if (profile && !profile.is_company_profile_complete) {
            toast({
                title: "Complete Your Company Profile",
                description: "Add company details to make your job postings more attractive!",
                action: (
                    <Button size="sm" onClick={() => navigate("/recruiter/profile")}>
                        Complete Now
                    </Button>
                ),
            });
        }
    }, [profile, toast, navigate]);

    useEffect(() => {
        if (!authUser) return;

        // Debounced refresh function - batches all updates together
        const refreshDashboard = () => {
            // Only refresh if not already fetching
            if (!isFetchingMetricsRef.current) {
                fetchMetrics(authUser.id);
            }
            if (!isFetchingMeetingsRef.current) {
                fetchUpcomingMeetings(authUser.id);
            }
        };

        const candidatesSubscription = supabase
            .channel('candidates-changes')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'candidates', filter: `user_id=eq.${authUser.id}` }, () => {
                refreshDashboard();
            })
            .subscribe();

        const jobsSubscription = supabase
            .channel('jobs-changes')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'jobs', filter: `user_id=eq.${authUser.id}` }, () => {
                refreshDashboard();
            })
            .subscribe();

        const meetingsSubscription = supabase
            .channel('meetings-changes')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'scheduled_meetings', filter: `user_id=eq.${authUser.id}` }, () => {
                refreshDashboard();
            })
            .subscribe();

        const shortlistedSubscription = supabase
            .channel('shortlisted-changes')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'Shortlisted_candidates', filter: `user_id=eq.${authUser.id}` }, () => {
                refreshDashboard();
            })
            .subscribe();

        return () => {
            // Clear any pending timeouts
            if (metricsTimeoutRef.current) clearTimeout(metricsTimeoutRef.current);
            if (meetingsTimeoutRef.current) clearTimeout(meetingsTimeoutRef.current);
            
            candidatesSubscription.unsubscribe();
            jobsSubscription.unsubscribe();
            meetingsSubscription.unsubscribe();
            shortlistedSubscription.unsubscribe();
        };
    }, [authUser, fetchMetrics, fetchUpcomingMeetings]);


    const handleCopyReferral = () => {
        navigator.clipboard.writeText(referralLink);
        toast({
            title: "Link Copied!",
            description: "Referral link copied to clipboard.",
        });
    };

    const getInitials = (name: string) => {
        return name
            .split(" ")
            .map(n => n[0])
            .join("")
            .toUpperCase()
            .slice(0, 2);
    };

    // Format numbers with commas for better readability
    const formatNumber = (num: number | null | undefined): string => {
        if (num === null || num === undefined) return "0";
        return num.toLocaleString('en-US');
    };

    const metricCards = [
        {
            title: "Active Jobs",
            value: loading ? "..." : formatNumber(metrics.activeJobs),
            subtitle: metrics.linkedInJobs > 0 ? `${formatNumber(metrics.linkedInJobs)} on LinkedIn` : "No LinkedIn posts yet",
            icon: FolderKanban,
            gradient: "from-blue-500 to-cyan-500",
            link: "/recruiter/jobs",
        },
        {
            title: "Total Candidates",
            value: loading ? "..." : formatNumber(metrics.totalCandidates ?? 0),
            subtitle: loading ? "Loading..." : `${formatNumber(metrics.totalCandidates ?? 0)} ${(metrics.totalCandidates ?? 0) === 1 ? 'candidate' : 'candidates'}`,
            icon: UserCircle,
            gradient: "from-green-500 to-emerald-500",
            link: "/recruiter/candidates",
        },
        {
            title: "MCQ Tests",
            value: loading ? "..." : formatNumber(metrics.mcqTests?.total ?? 0),
            subtitle: `${formatNumber(metrics.mcqTests?.total ?? 0)} ${(metrics.mcqTests?.total ?? 0) === 1 ? 'candidate' : 'candidates'} • ${metrics.mcqTests?.passRate || 0}% pass rate`,
            icon: ClipboardList,
            gradient: "from-yellow-500 to-amber-500",
            link: "/mcq-tests",
        },
        {
            title: "Technical Tests",
            value: loading ? "..." : formatNumber(metrics.technicalTests?.total ?? 0),
            subtitle: `${formatNumber(metrics.technicalTests?.total ?? 0)} ${(metrics.technicalTests?.total ?? 0) === 1 ? 'candidate' : 'candidates'} • ${metrics.technicalTests?.passRate || 0}% pass rate`,
            icon: Code2,
            gradient: "from-primary to-primary/80",
            link: "/technical-tests",
        },
        {
            title: "Final Interview",
            value: loading ? "..." : formatNumber(metrics.initialInterviewQualified),
            subtitle: `${formatNumber(metrics.scheduledInterviews)} scheduled`,
            icon: UserCheck,
            gradient: "from-orange-500 to-amber-500",
            link: "/recruiter/final-interviews",
        },
        {
            title: "Shortlisted",
            value: loading ? "..." : formatNumber(metrics.shortlistedCandidates),
            subtitle: "Ready to hire",
            icon: Award,
            gradient: "from-blue-500 to-blue-600",
            link: "/recruiter/shortlisted",
        },
    ];

    const pipelineStages = [
        { label: "Applied", count: pipelineFunnel.applied, color: "#3B82F6", filterKey: "new" },
        { label: "MCQ Test", count: pipelineFunnel.mcq, color: "#8B5CF6", filterKey: "mcq" },
        { label: "Technical", count: pipelineFunnel.technical, color: "#6366F1", filterKey: "technical" },
        { label: "Final Interview", count: pipelineFunnel.finalInterview, color: "#F59E0B", filterKey: "final_interview" },
        { label: "Shortlisted", count: pipelineFunnel.shortlisted, color: "#10B981", filterKey: "shortlisted" },
    ];

    if (authLoading || !authUser) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
                    <p className="text-muted-foreground">Loading...</p>
                </div>
            </div>
        );
    }

    return (
        <DashboardLayout>
            <DashboardHeader 
                title="Recruiter Dashboard"
                description="Manage your hiring pipeline and candidates"
                showInvite={true}
                referralLink={referralLink}
                profile={profile}
                user={authUser}
                showWelcome={false}
            />

            {/* Main Content */}
            <main className="flex-1 overflow-y-auto overflow-x-hidden bg-background relative min-h-0">
                <PageBackground imagePath="/assets/images/Whisk_2e19da7f277a295a3bf49685dc19f9fedr.jpeg" />
                
                <div className="page-container relative z-10 min-h-full">
                    <div className="page-content">
                        {/* Pipeline Funnel - Moved to Top */}
                        <div className="mb-6">
                            <PipelineFunnel stages={pipelineStages} />
                        </div>

                        {/* Metrics Grid - 6 Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                            {metricCards.map((metric, index) => (
                                <MetricCard
                                    key={index}
                                    title={metric.title}
                                    value={metric.value}
                                    subtitle={metric.subtitle}
                                    icon={metric.icon}
                                    href={metric.link}
                                    gradient={metric.gradient}
                                    loading={loading}
                                />
                            ))}
                        </div>

                        {/* Upcoming Meetings */}
                        <div className="grid grid-cols-1 gap-6">
                            <UpcomingMeetings meetings={upcomingMeetings} loading={loading} />
                        </div>
                    </div>
                </div>
            </main>
        </DashboardLayout>
    );
};

export default Dashboard;