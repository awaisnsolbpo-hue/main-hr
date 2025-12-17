import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { ArrowRight, Calendar, Clock, Video, UserCheck } from "lucide-react";
import { format, formatDistanceToNow, isToday, isTomorrow } from "date-fns";

interface UpcomingMeeting {
  id: string;
  candidate_name: string;
  candidate_email: string;
  job_title: string | null;
  meeting_date: string;
  meeting_duration: number;
  meeting_link?: string;
  meeting_status?: string;
  ai_score?: number | null;
}

interface UpcomingMeetingsProps {
  meetings: UpcomingMeeting[];
  loading?: boolean;
}

export const UpcomingMeetings = ({ meetings, loading = false }: UpcomingMeetingsProps) => {
  const formatMeetingTime = (dateString: string) => {
    const date = new Date(dateString);
    const time = format(date, 'h:mm a');
    
    if (isToday(date)) {
      return `Today, ${time}`;
    } else if (isTomorrow(date)) {
      return `Tomorrow, ${time}`;
    } else {
      return format(date, 'MMM d, h:mm a');
    }
  };

  const formatTimeUntil = (dateString: string) => {
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true });
    } catch {
      return "soon";
    }
  };

  const todayCount = meetings.filter(m => isToday(new Date(m.meeting_date))).length;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-foreground" />
            <CardTitle>Upcoming Interviews</CardTitle>
          </div>
          {todayCount > 0 && (
            <Badge className="text-xs font-bold">{todayCount} today</Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="p-4 rounded-md border animate-pulse">
                <div className="h-4 rounded w-3/4 bg-muted mb-2"></div>
                <div className="h-3 rounded w-1/2 bg-muted/50"></div>
              </div>
            ))}
          </div>
        ) : meetings.length > 0 ? (
          <div className="space-y-2">
            {meetings.slice(0, 3).map((meeting) => (
              <div
                key={meeting.id}
                className="p-4 rounded-md border-2 border-border/60 shadow-sm hover:shadow-md transition-all duration-300 bg-card/95 backdrop-blur-sm hover:bg-gradient-to-r hover:from-primary/5 hover:to-accent/5"
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm truncate text-foreground">
                      {meeting.candidate_name}
                    </p>
                    <p className="text-xs truncate mt-0.5 font-medium text-foreground/70">
                      {meeting.job_title || 'Interview'}
                    </p>
                  </div>
                  {meeting.ai_score && (
                    <Badge variant="outline" className="text-xs whitespace-nowrap">
                      {meeting.ai_score}% AI
                    </Badge>
                  )}
                </div>
                <div className="flex items-center justify-between mt-2 pt-2 border-t border-border">
                  <div className="flex items-center gap-1 text-xs font-medium text-foreground/70">
                    <Clock className="h-3 w-3" />
                    <span className="truncate">{formatMeetingTime(meeting.meeting_date)}</span>
                  </div>
                  <Badge className="text-xs">
                    {formatTimeUntil(meeting.meeting_date)}
                  </Badge>
                </div>
                <div className="flex items-center gap-2 mt-3">
                  {meeting.meeting_link && (
                    <Button size="sm" variant="outline" className="flex-1 text-xs" asChild>
                      <a href={meeting.meeting_link} target="_blank" rel="noopener noreferrer">
                        <Video className="h-3 w-3 mr-1" />
                        Join
                      </a>
                    </Button>
                  )}
                  <Button size="sm" variant="ghost" className="flex-1 text-xs" asChild>
                    <Link to={`/candidates?email=${meeting.candidate_email}`}>
                      <UserCheck className="h-3 w-3 mr-1" />
                      View
                    </Link>
                  </Button>
                </div>
              </div>
            ))}
            {meetings.length > 3 && (
              <Link to="/scheduled-meetings">
                <Button variant="outline" size="sm" className="w-full text-xs mt-2">
                  View All ({meetings.length}) <ArrowRight className="h-3 w-3 ml-1" />
                </Button>
              </Link>
            )}
          </div>
        ) : (
          <div className="text-center py-6">
            <Calendar className="h-10 w-10 mx-auto mb-2 text-foreground/40" />
            <p className="text-xs font-medium text-foreground/70">No upcoming meetings</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

