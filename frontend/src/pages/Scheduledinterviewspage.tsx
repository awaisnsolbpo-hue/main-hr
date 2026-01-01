import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MDTable, MDTableHeader, MDTableHeaderCell, MDTableBody, MDTableRow, MDTableCell } from "@/components/ui/MDTable";
import { Calendar, Mail, Clock, Loader2, Video, Star } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import DashboardLayout from "@/components/DashboardLayout";

interface Meeting {
  id: string;
  candidate_name: string;
  candidate_email: string;
  job_title: string | null;
  meeting_date: string;
  meeting_duration: number;
  meeting_link: string;
  meeting_status: string | null;
  ai_score: number | null;
  created_at: string;
}

const ScheduledInterviewsPage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMeetings();
  }, []);

  const loadMeetings = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/login");
        return;
      }

      const now = new Date();
      const { data, error } = await supabase
        .from("scheduled_meetings")
        .select("*")
        .eq("user_id", user.id)
        .gte("meeting_date", now.toISOString())
        .order("meeting_date", { ascending: true });

      if (error) throw error;

      const filteredMeetings = (data || []).filter((meeting) => {
        const status = meeting.meeting_status?.toLowerCase();
        return status !== "completed" && status !== "cancelled";
      });

      setMeetings(filteredMeetings);
      console.log('📊 Scheduled Meetings Loaded:', filteredMeetings.length);
    } catch (error: any) {
      console.error("Error loading meetings:", error);
      toast({
        title: "Error",
        description: "Failed to load meetings",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString("en-US", {
      weekday: "short",
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusBadge = (status: string | null) => {
    switch (status?.toLowerCase()) {
      case "scheduled":
        return <Badge className="bg-[#1A73E8]/10 text-[#1A73E8] border border-[#1A73E8]/20">Scheduled</Badge>;
      case "confirmed":
        return <Badge className="bg-[#4CAF50]/10 text-[#4CAF50] border border-[#4CAF50]/20">Confirmed</Badge>;
      case "pending":
        return <Badge className="bg-[#fb8c00]/10 text-[#fb8c00] border border-[#fb8c00]/20">Pending</Badge>;
      default:
        return <Badge className="bg-[#7b809a]/10 text-[#7b809a] border border-[#7b809a]/20">Scheduled</Badge>;
    }
  };

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
          <h1 className="text-2xl font-bold text-[#344767] mb-2">Scheduled Interviews</h1>
          <p className="text-sm font-light text-[#7b809a]">
            All scheduled interviews with candidates
          </p>
        </div>

        <MDTable
          title="All Scheduled Interviews"
          headerActions={
            <Badge className="bg-gradient-to-br from-[#1A73E8] to-[#49a3f1] text-white border-0 shadow-blue">
              {meetings.length} Total
            </Badge>
          }
        >
          {meetings.length === 0 ? (
            <tbody>
              <tr>
                <td colSpan={8}>
                  <div className="text-center py-12">
                    <Calendar className="h-16 w-16 text-[#7b809a] mx-auto mb-4 opacity-50" />
                    <h3 className="text-lg font-semibold text-[#344767] mb-2">No Scheduled Interviews</h3>
                    <p className="text-sm font-light text-[#7b809a]">
                      Schedule interviews with qualified candidates
                    </p>
                  </div>
                </td>
              </tr>
            </tbody>
          ) : (
            <>
              <MDTableHeader>
                <MDTableHeaderCell>Candidate</MDTableHeaderCell>
                <MDTableHeaderCell>Email</MDTableHeaderCell>
                <MDTableHeaderCell>Job Position</MDTableHeaderCell>
                <MDTableHeaderCell>Meeting Time</MDTableHeaderCell>
                <MDTableHeaderCell>Duration</MDTableHeaderCell>
                <MDTableHeaderCell>AI Score</MDTableHeaderCell>
                <MDTableHeaderCell>Status</MDTableHeaderCell>
                <MDTableHeaderCell>Actions</MDTableHeaderCell>
              </MDTableHeader>
              <MDTableBody>
                {meetings.map((meeting) => (
                  <MDTableRow key={meeting.id}>
                    <MDTableCell>
                      <span className="font-semibold text-[#344767]">{meeting.candidate_name}</span>
                    </MDTableCell>
                    <MDTableCell>
                      <div className="flex items-center gap-2 text-sm text-[#7b809a]">
                        <Mail className="h-3.5 w-3.5 flex-shrink-0" />
                        <a
                          href={`mailto:${meeting.candidate_email}`}
                          className="hover:text-[#e91e63] truncate"
                        >
                          {meeting.candidate_email}
                        </a>
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
                        <Clock className="h-3.5 w-3.5 text-[#7b809a]" />
                        {formatDateTime(meeting.meeting_date)}
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
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => window.open(meeting.meeting_link, "_blank")}
                        className="hover:bg-[#e91e63]/10 hover:text-[#e91e63] text-[#7b809a]"
                      >
                        <Video className="h-4 w-4 mr-1" />
                        Join
                      </Button>
                    </MDTableCell>
                  </MDTableRow>
                ))}
              </MDTableBody>
            </>
          )}
        </MDTable>
      </div>
    </DashboardLayout>
  );
};

export default ScheduledInterviewsPage;