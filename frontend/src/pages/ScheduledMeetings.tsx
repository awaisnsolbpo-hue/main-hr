import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MDInput } from "@/components/ui/MDInput";
import { MDTable, MDTableHeader, MDTableHeaderCell, MDTableBody, MDTableRow, MDTableCell } from "@/components/ui/MDTable";
import {
    Calendar,
    Clock,
    Video,
    Mail,
    Search,
    FileText,
    Phone,
    Loader2,
    Star,
} from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import DashboardLayout from "@/components/DashboardLayout";

interface ScheduledMeeting {
    id: string;
    candidate_name: string;
    candidate_email: string;
    candidate_phone: string | null;
    job_id: string | null;
    job_title: string | null;
    meeting_date: string;
    meeting_duration: number;
    meeting_link: string;
    meeting_status: string | null;
    instructions: string | null;
    ai_score: number | null;
    cv_file_url: string | null;
    created_at: string;
    user_id: string;
}

export default function ScheduledMeetings() {
    const navigate = useNavigate();
    const { toast } = useToast();
    const [meetings, setMeetings] = useState<ScheduledMeeting[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [filter, setFilter] = useState<"upcoming" | "past" | "all">("upcoming");
    const [user, setUser] = useState<any>(null);

    useEffect(() => {
        checkAuthAndFetch();
    }, []);

    const checkAuthAndFetch = async () => {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
            navigate("/login");
            return;
        }
        setUser(session.user);
        fetchScheduledMeetings(session.user.id);
    };

    // Real-time subscription
    useEffect(() => {
        if (!user) return;

        const subscription = supabase
            .channel('meetings-realtime')
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'scheduled_meetings',
                    filter: `user_id=eq.${user.id}`
                },
                () => {
                    console.log('📊 Real-time update detected, refreshing meetings...');
                    fetchScheduledMeetings(user.id);
                }
            )
            .subscribe();

        return () => {
            subscription.unsubscribe();
        };
    }, [user]);

    const fetchScheduledMeetings = async (userId: string) => {
        try {
            setLoading(true);

            const { data, error } = await supabase
                .from("scheduled_meetings")
                .select("*")
                .eq("user_id", userId)
                .order("meeting_date", { ascending: true });

            if (error) {
                console.error("Supabase error:", error);
                throw error;
            }

            console.log('📊 Scheduled Meetings Loaded:', data?.length || 0);
            setMeetings(data || []);
        } catch (error) {
            console.error("Error fetching scheduled meetings:", error);
            toast({
                title: "Error",
                description: "Failed to load meetings",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    const getFilteredMeetings = () => {
        const now = new Date();

        let filtered = meetings;

        // Apply date filter
        if (filter === "upcoming") {
            filtered = filtered.filter((meeting) => {
                const meetingDateTime = new Date(meeting.meeting_date);
                const status = meeting.meeting_status?.toLowerCase();
                return meetingDateTime >= now && status !== 'completed' && status !== 'cancelled';
            });
        } else if (filter === "past") {
            filtered = filtered.filter((meeting) => {
                const meetingDateTime = new Date(meeting.meeting_date);
                const status = meeting.meeting_status?.toLowerCase();
                return meetingDateTime < now || status === 'completed' || status === 'cancelled';
            });
        }

        // Apply search filter
        if (searchTerm) {
            filtered = filtered.filter(
                (meeting) =>
                    meeting.candidate_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    meeting.candidate_email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    meeting.job_title?.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        return filtered;
    };

    const getTimeUntilMeeting = (dateString: string) => {
        const meetingDateTime = new Date(dateString);
        const now = new Date();
        const diffMs = meetingDateTime.getTime() - now.getTime();

        if (diffMs < 0) {
            return formatDistanceToNow(meetingDateTime, { addSuffix: true });
        }

        const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
        const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

        if (diffHours < 1) {
            return `in ${diffMins} minute${diffMins !== 1 ? 's' : ''}`;
        } else if (diffHours < 24) {
            return `in ${diffHours} hour${diffHours > 1 ? 's' : ''}`;
        } else {
            const days = Math.floor(diffHours / 24);
            return `in ${days} day${days > 1 ? 's' : ''}`;
        }
    };

    const isUpcoming = (dateString: string) => {
        const meetingDateTime = new Date(dateString);
        const now = new Date();
        return meetingDateTime > now;
    };

    const getStatusBadge = (status: string | null) => {
        const statusLower = status?.toLowerCase() || "scheduled";

        const statusConfig: Record<string, { label: string; className: string }> = {
            scheduled: { label: "Scheduled", className: "bg-[#1A73E8]/10 text-[#1A73E8] border border-[#1A73E8]/20" },
            pending: { label: "Pending", className: "bg-[#fb8c00]/10 text-[#fb8c00] border border-[#fb8c00]/20" },
            completed: { label: "Completed", className: "bg-[#4CAF50]/10 text-[#4CAF50] border border-[#4CAF50]/20" },
            cancelled: { label: "Cancelled", className: "bg-[#F44335]/10 text-[#F44335] border border-[#F44335]/20" },
            confirmed: { label: "Confirmed", className: "bg-[#66BB6A]/10 text-[#66BB6A] border border-[#66BB6A]/20" },
        };

        const config = statusConfig[statusLower] || statusConfig.scheduled;
        return <Badge className={config.className}>{config.label}</Badge>;
    };

    const filteredMeetings = getFilteredMeetings();

    if (loading) {
        return (
            <DashboardLayout>
                <div className="min-h-screen bg-[#f0f2f5] flex items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-[#e91e63]" />
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout>
            <div className="min-h-screen bg-[#f0f2f5] p-6">
                {/* Page Header - Material Dashboard Style */}
                <div className="mb-6">
                    <h1 className="text-2xl font-bold text-[#344767] mb-2">Scheduled Meetings</h1>
                    <p className="text-sm font-light text-[#7b809a]">
                        Manage all your interview meetings
                    </p>
                </div>

                {/* Filters and Search */}
                <div className="bg-white rounded-2xl shadow-md-lg p-6 mb-6">
                    <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                        {/* Search */}
                        <div className="flex-1 max-w-md">
                            <MDInput
                                placeholder="Search by name, email, or job title..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                icon={<Search className="h-4 w-4" />}
                            />
                        </div>
{/* / */}
                        {/* Filter Buttons */}
                        <div className="flex gap-2">
                            <Button
                                onClick={() => setFilter("upcoming")}
                                size="sm"
                                className={filter === "upcoming"
                                    ? "bg-gradient-to-r from-[#EC407A] to-[#D81B60] text-white border-0 shadow-pink hover:shadow-md"
                                    : "bg-white text-[#7b809a] border border-[#d2d6da] hover:bg-[#f0f2f5] hover:text-[#344767]"}
                            >
                                Upcoming
                            </Button>
                            <Button
                                onClick={() => setFilter("past")}
                                size="sm"
                                className={filter === "past"
                                    ? "bg-gradient-to-r from-[#EC407A] to-[#D81B60] text-white border-0 shadow-pink hover:shadow-md"
                                    : "bg-white text-[#7b809a] border border-[#d2d6da] hover:bg-[#f0f2f5] hover:text-[#344767]"}
                            >
                                Past
                            </Button>
                            <Button
                                onClick={() => setFilter("all")}
                                size="sm"
                                className={filter === "all"
                                    ? "bg-gradient-to-r from-[#EC407A] to-[#D81B60] text-white border-0 shadow-pink hover:shadow-md"
                                    : "bg-white text-[#7b809a] border border-[#d2d6da] hover:bg-[#f0f2f5] hover:text-[#344767]"}
                            >
                                All
                            </Button>
                        </div>
                    </div>
                </div>

                <MDTable
                    title="All Meetings"
                    headerActions={
                        <Badge className="bg-gradient-to-br from-[#1A73E8] to-[#49a3f1] text-white border-0 shadow-blue">
                            {filteredMeetings.length} Total
                        </Badge>
                    }
                >
                    {filteredMeetings.length === 0 ? (
                        <tbody>
                            <tr>
                                <td colSpan={10}>
                                    <div className="text-center py-12">
                                        <Calendar className="h-16 w-16 text-[#7b809a] mx-auto mb-4 opacity-50" />
                                        <h3 className="text-lg font-semibold text-[#344767] mb-2">No Meetings Found</h3>
                                        <p className="text-sm font-light text-[#7b809a]">
                                            {searchTerm
                                                ? "Try adjusting your search terms"
                                                : filter === "upcoming"
                                                    ? "No upcoming meetings scheduled"
                                                    : filter === "past"
                                                        ? "No past meetings found"
                                                        : "Schedule your first meeting from the Candidates page"}
                                        </p>
                                    </div>
                                </td>
                            </tr>
                        </tbody>
                    ) : (
                        <>
                            <MDTableHeader>
                                <MDTableHeaderCell>Candidate</MDTableHeaderCell>
                                <MDTableHeaderCell>Contact</MDTableHeaderCell>
                                <MDTableHeaderCell>Job Position</MDTableHeaderCell>
                                <MDTableHeaderCell>Meeting Date</MDTableHeaderCell>
                                <MDTableHeaderCell>Time</MDTableHeaderCell>
                                <MDTableHeaderCell>Duration</MDTableHeaderCell>
                                <MDTableHeaderCell>AI Score</MDTableHeaderCell>
                                <MDTableHeaderCell>Status</MDTableHeaderCell>
                                <MDTableHeaderCell>Time Until</MDTableHeaderCell>
                                <MDTableHeaderCell>Actions</MDTableHeaderCell>
                            </MDTableHeader>
                            <MDTableBody>
                                {filteredMeetings.map((meeting) => {
                                    const upcoming = isUpcoming(meeting.meeting_date);
                                    const meetingDateTime = new Date(meeting.meeting_date);

                                    return (
                                        <MDTableRow key={meeting.id}>
                                            <MDTableCell>
                                                <span className="font-semibold text-[#344767]">{meeting.candidate_name}</span>
                                            </MDTableCell>
                                            <MDTableCell>
                                                <div className="space-y-1">
                                                    <div className="flex items-center gap-2 text-sm text-[#7b809a]">
                                                        <Mail className="h-3.5 w-3.5 flex-shrink-0" />
                                                        <a
                                                            href={`mailto:${meeting.candidate_email}`}
                                                            className="hover:text-[#e91e63] truncate"
                                                        >
                                                            {meeting.candidate_email}
                                                        </a>
                                                    </div>
                                                    {meeting.candidate_phone && (
                                                        <div className="flex items-center gap-2 text-sm text-[#7b809a]">
                                                            <Phone className="h-3.5 w-3.5 flex-shrink-0" />
                                                            <a
                                                                href={`tel:${meeting.candidate_phone}`}
                                                                className="hover:text-[#e91e63]"
                                                            >
                                                                {meeting.candidate_phone}
                                                            </a>
                                                        </div>
                                                    )}
                                                </div>
                                            </MDTableCell>
                                            <MDTableCell>
                                                {meeting.job_title ? (
                                                    <span className="text-sm text-[#344767]">{meeting.job_title}</span>
                                                ) : (
                                                    <span className="text-xs text-[#7b809a]">-</span>
                                                )}
                                            </MDTableCell>
                                            <MDTableCell>
                                                <div className="flex items-center gap-2 text-sm text-[#344767]">
                                                    <Calendar className="h-3.5 w-3.5 text-[#7b809a]" />
                                                    {format(meetingDateTime, "MMM d, yyyy")}
                                                </div>
                                            </MDTableCell>
                                            <MDTableCell>
                                                <div className="flex items-center gap-2 text-sm text-[#344767]">
                                                    <Clock className="h-3.5 w-3.5 text-[#7b809a]" />
                                                    {format(meetingDateTime, "h:mm a")}
                                                </div>
                                            </MDTableCell>
                                            <MDTableCell>
                                                <Badge className="bg-[#7b809a]/10 text-[#7b809a] border border-[#7b809a]/20">
                                                    {meeting.meeting_duration} min
                                                </Badge>
                                            </MDTableCell>
                                            <MDTableCell>
                                                {meeting.ai_score ? (
                                                    <div className="flex items-center gap-2">
                                                        <Star className="h-4 w-4 fill-[#fb8c00] text-[#fb8c00]" />
                                                        <span className="font-bold text-lg text-[#344767]">{meeting.ai_score}%</span>
                                                    </div>
                                                ) : (
                                                    <span className="text-xs text-[#7b809a]">-</span>
                                                )}
                                            </MDTableCell>
                                            <MDTableCell>
                                                {getStatusBadge(meeting.meeting_status)}
                                            </MDTableCell>
                                            <MDTableCell>
                                                {upcoming ? (
                                                    <Badge className="bg-[#66BB6A]/10 text-[#66BB6A] border border-[#66BB6A]/20">
                                                        {getTimeUntilMeeting(meeting.meeting_date)}
                                                    </Badge>
                                                ) : (
                                                    <span className="text-xs text-[#7b809a]">Past</span>
                                                )}
                                            </MDTableCell>
                                            <MDTableCell>
                                                <div className="flex gap-2">
                                                    {meeting.meeting_link && (
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => window.open(meeting.meeting_link, "_blank")}
                                                            className="hover:bg-[#e91e63]/10 hover:text-[#e91e63] text-[#7b809a]"
                                                        >
                                                            <Video className="h-4 w-4 mr-1" />
                                                            Join
                                                        </Button>
                                                    )}
                                                    {meeting.cv_file_url && (
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => window.open(meeting.cv_file_url, "_blank")}
                                                            className="hover:bg-[#1A73E8]/10 hover:text-[#1A73E8] text-[#7b809a]"
                                                        >
                                                            <FileText className="h-4 w-4 mr-1" />
                                                            CV
                                                        </Button>
                                                    )}
                                                </div>
                                            </MDTableCell>
                                        </MDTableRow>
                                    );
                                })}
                            </MDTableBody>
                        </>
                    )}
                </MDTable>
            </div>
        </DashboardLayout>
    );
}