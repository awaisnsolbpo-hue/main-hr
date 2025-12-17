import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Calendar, ArrowLeft, Mail, Clock, Loader2, Video } from "lucide-react";
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

  const getStatusColor = (status: string | null) => {
    switch (status?.toLowerCase()) {
      case "scheduled":
        return "bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 border-blue-200 dark:border-blue-700";
      case "confirmed":
        return "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 border-green-200 dark:border-green-700";
      case "pending":
        return "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300 border-yellow-200 dark:border-yellow-700";
      default:
        return "bg-muted text-muted-foreground border-border";
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="min-h-screen bg-[var(--gradient-subtle)] flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-[var(--gradient-subtle)]">
        <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card className="shadow-elegant">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>All Scheduled Interviews</span>
              <Badge variant="secondary">{meetings.length} Total</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {meetings.length === 0 ? (
              <div className="text-center py-12">
                <Calendar className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Scheduled Interviews</h3>
                <p className="text-muted-foreground">
                  Schedule interviews with qualified candidates
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Candidate</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Job Position</TableHead>
                      <TableHead>Meeting Time</TableHead>
                      <TableHead>Duration</TableHead>
                      <TableHead>AI Score</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {meetings.map((meeting) => (
                      <TableRow key={meeting.id}>
                        <TableCell className="font-semibold">
                          {meeting.candidate_name}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1 text-sm">
                            <Mail className="h-3 w-3" />
                            <a
                              href={`mailto:${meeting.candidate_email}`}
                              className="hover:text-primary"
                            >
                              {meeting.candidate_email}
                            </a>
                          </div>
                        </TableCell>
                        <TableCell>
                          {meeting.job_title || <span className="text-xs text-muted-foreground">-</span>}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1 text-sm">
                            <Clock className="h-3 w-3" />
                            {formatDateTime(meeting.meeting_date)}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{meeting.meeting_duration} min</Badge>
                        </TableCell>
                        <TableCell>
                          {meeting.ai_score ? (
                            <span className="font-semibold">{meeting.ai_score}%</span>
                          ) : (
                            <span className="text-xs text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={getStatusColor(meeting.meeting_status)}
                          >
                            {meeting.meeting_status || "Scheduled"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => window.open(meeting.meeting_link, "_blank")}
                          >
                            <Video className="h-4 w-4 mr-1" />
                            Join
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
    </DashboardLayout>
  );
};

export default ScheduledInterviewsPage;