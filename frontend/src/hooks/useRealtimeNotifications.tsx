import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { User, Briefcase, Calendar, FileText, TrendingUp, CheckCircle, XCircle, RefreshCw, Info, Settings } from "lucide-react";

interface NotificationPreferences {
    email_notifications: boolean;
    push_notifications: boolean;
}

export const useRealtimeNotifications = (userId: string | null) => {
    const { toast } = useToast();
    const [preferences, setPreferences] = useState<NotificationPreferences>({
        email_notifications: true,
        push_notifications: false,
    });
    const [companyId, setCompanyId] = useState<string | null>(null);

    // Fetch notification preferences
    useEffect(() => {
        if (!userId) return;

        const fetchPreferences = async () => {
            try {
                const { data, error } = await supabase
                    .from("profiles")
                    .select("email_notifications, push_notifications")
                    .eq("id", userId)
                    .single();

                if (error) throw error;

                if (data) {
                    setPreferences({
                        email_notifications: data.email_notifications ?? true,
                        push_notifications: data.push_notifications ?? false,
                    });
                }
            } catch (error) {
                console.error("Error fetching notification preferences:", error);
            }
        };

        fetchPreferences();

        // Get company_id (which is the user's profile id)
        const getCompanyId = async () => {
            try {
                const { data, error } = await supabase
                    .from("profiles")
                    .select("id")
                    .eq("id", userId)
                    .single();

                if (error) throw error;
                if (data) {
                    setCompanyId(data.id);
                }
            } catch (error) {
                console.error("Error fetching company_id:", error);
            }
        };

        getCompanyId();

        // Subscribe to preference changes
        const preferencesChannel = supabase
            .channel(`preferences-${userId}`)
            .on(
                "postgres_changes",
                {
                    event: "UPDATE",
                    schema: "public",
                    table: "profiles",
                    filter: `id=eq.${userId}`,
                },
                (payload) => {
                    const newData = payload.new as any;
                    setPreferences({
                        email_notifications: newData.email_notifications ?? true,
                        push_notifications: newData.push_notifications ?? false,
                    });
                }
            )
            .subscribe();

        return () => {
            preferencesChannel.unsubscribe();
        };
    }, [userId]);

    // Set up realtime subscriptions for various events
    useEffect(() => {
        if (!userId || !companyId) return;

        // Subscribe to new candidates
        const candidatesChannel = supabase
            .channel(`candidates-notifications-${userId}`)
            .on(
                "postgres_changes",
                {
                    event: "INSERT",
                    schema: "public",
                    table: "candidates",
                    filter: `user_id=eq.${userId}`,
                },
                (payload) => {
                    const newCandidate = payload.new as any;
                    if (preferences.push_notifications) {
                        toast({
                            title: (
                                <div className="flex items-center gap-2">
                                    <User className="h-4 w-4" />
                                    <span>New Candidate</span>
                                </div>
                            ),
                            description: `${newCandidate.full_name || newCandidate.name || "A new candidate"} has applied`,
                        });
                    }
                }
            )
            .subscribe();

        // Subscribe to new jobs
        const jobsChannel = supabase
            .channel(`jobs-notifications-${userId}`)
            .on(
                "postgres_changes",
                {
                    event: "INSERT",
                    schema: "public",
                    table: "jobs",
                    filter: `user_id=eq.${userId}`,
                },
                (payload) => {
                    const newJob = payload.new as any;
                    if (preferences.push_notifications) {
                        toast({
                            title: (
                                <div className="flex items-center gap-2">
                                    <Briefcase className="h-4 w-4" />
                                    <span>New Job Posted</span>
                                </div>
                            ),
                            description: `Job "${newJob.title}" has been created`,
                        });
                    }
                }
            )
            .subscribe();

        // Subscribe to scheduled meetings
        const meetingsChannel = supabase
            .channel(`meetings-notifications-${userId}`)
            .on(
                "postgres_changes",
                {
                    event: "*",
                    schema: "public",
                    table: "scheduled_meetings",
                    filter: `user_id=eq.${userId}`,
                },
                (payload) => {
                    const meeting = payload.new as any;
                    if (preferences.push_notifications) {
                        if (payload.eventType === "INSERT") {
                            toast({
                                title: (
                                    <div className="flex items-center gap-2">
                                        <Calendar className="h-4 w-4" />
                                        <span>New Meeting Scheduled</span>
                                    </div>
                                ),
                                description: `Meeting scheduled for ${meeting.candidate_name || "a candidate"}`,
                            });
                        } else if (payload.eventType === "UPDATE") {
                            toast({
                                title: (
                                    <div className="flex items-center gap-2">
                                        <Calendar className="h-4 w-4" />
                                        <span>Meeting Updated</span>
                                    </div>
                                ),
                                description: `Meeting details have been updated`,
                            });
                        }
                    }
                }
            )
            .subscribe();

        // Subscribe to interview status changes
        const interviewChannel = supabase
            .channel(`interviews-notifications-${userId}`)
            .on(
                "postgres_changes",
                {
                    event: "UPDATE",
                    schema: "public",
                    table: "qualified_for_final_interview",
                },
                (payload) => {
                    const interview = payload.new as any;
                    // Check if this interview is related to user's jobs
                    if (preferences.push_notifications && interview.interview_status) {
                        const status = interview.interview_status;
                        if (status === "Completed") {
                            toast({
                                title: (
                                    <div className="flex items-center gap-2">
                                        <User className="h-4 w-4" />
                                        <span>Interview Completed</span>
                                    </div>
                                ),
                                description: `Interview for ${interview.name || "candidate"} has been completed`,
                            });
                        } else if (status === "Scheduled") {
                            toast({
                                title: (
                                    <div className="flex items-center gap-2">
                                        <Calendar className="h-4 w-4" />
                                        <span>Interview Scheduled</span>
                                    </div>
                                ),
                                description: `Interview scheduled for ${interview.name || "candidate"}`,
                            });
                        }
                    }
                }
            )
            .subscribe();

        // Subscribe to shortlisted candidates
        const shortlistedChannel = supabase
            .channel(`shortlisted-notifications-${userId}`)
            .on(
                "postgres_changes",
                {
                    event: "INSERT",
                    schema: "public",
                    table: "Shortlisted candidates",
                    filter: `user_id=eq.${userId}`,
                },
                (payload) => {
                    const candidate = payload.new as any;
                    if (preferences.push_notifications) {
                        toast({
                            title: (
                                <div className="flex items-center gap-2">
                                    <User className="h-4 w-4" />
                                    <span>Candidate Shortlisted</span>
                                </div>
                            ),
                            description: `${candidate.name || "A candidate"} has been shortlisted`,
                        });
                    }
                }
            )
            .subscribe();

        // Subscribe to activity logs
        const activityChannel = supabase
            .channel(`activities-notifications-${userId}`)
            .on(
                "postgres_changes",
                {
                    event: "INSERT",
                    schema: "public",
                    table: "activity_logs",
                    filter: `company_id=eq.${companyId}`,
                },
                (payload) => {
                    const activity = payload.new as any;
                    if (preferences.push_notifications) {
                        // Get appropriate icon based on action_type and category
                        const getActivityIcon = (actionType: string, category: string) => {
                            switch (actionType) {
                                case "created":
                                    return <FileText className="h-4 w-4" />;
                                case "applied":
                                    return <User className="h-4 w-4" />;
                                case "qualified":
                                case "hired":
                                    return <CheckCircle className="h-4 w-4" />;
                                case "rejected":
                                    return <XCircle className="h-4 w-4" />;
                                case "shortlisted":
                                    return <TrendingUp className="h-4 w-4" />;
                                case "profile_updated":
                                    return <User className="h-4 w-4" />;
                                case "status_changed":
                                case "moved":
                                    return <RefreshCw className="h-4 w-4" />;
                                default:
                                    if (category === "job_management") return <Briefcase className="h-4 w-4" />;
                                    if (category === "candidate_pipeline") return <User className="h-4 w-4" />;
                                    if (category === "interviews") return <Calendar className="h-4 w-4" />;
                                    if (category === "settings") return <Settings className="h-4 w-4" />;
                                    return <Info className="h-4 w-4" />;
                            }
                        };

                        // Get title based on category and action
                        const getActivityTitle = (actionType: string, category: string) => {
                            if (category === "job_management") {
                                if (actionType === "created") return "New Job Created";
                                return "Job Activity";
                            }
                            if (category === "candidate_pipeline") {
                                if (actionType === "applied") return "New Application";
                                if (actionType === "shortlisted") return "Candidate Shortlisted";
                                return "Candidate Activity";
                            }
                            if (category === "interviews") {
                                return "Interview Activity";
                            }
                            return "New Activity";
                        };

                        toast({
                            title: (
                                <div className="flex items-center gap-2">
                                    {getActivityIcon(activity.action_type, activity.category)}
                                    <span>{getActivityTitle(activity.action_type, activity.category)}</span>
                                </div>
                            ),
                            description: activity.description || "A new activity has been logged",
                        });
                    }
                }
            )
            .subscribe();

        return () => {
            candidatesChannel.unsubscribe();
            jobsChannel.unsubscribe();
            meetingsChannel.unsubscribe();
            interviewChannel.unsubscribe();
            shortlistedChannel.unsubscribe();
            activityChannel.unsubscribe();
        };
    }, [userId, companyId, preferences.push_notifications, toast]);
};

