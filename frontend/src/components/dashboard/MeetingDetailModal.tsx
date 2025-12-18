import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    Mail,
    Calendar,
    Clock,
    Video,
    ExternalLink,
    Phone,
    FileText,
    Copy,
    Check,
} from "lucide-react";
import { format, formatDistanceToNow, isToday, isTomorrow, isPast } from "date-fns";

interface Meeting {
    id: string;
    candidate_name: string;
    candidate_email: string;
    candidate_phone?: string | null;
    job_id?: string | null;
    job_title?: string | null;
    meeting_date: string;
    meeting_duration: number;
    meeting_link?: string | null;
    meeting_status?: string | null;
    instructions?: string | null;
    ai_score?: number | null;
    cv_file_url?: string | null;
    created_at?: string;
    user_id?: string;
}

interface MeetingDetailModalProps {
    meeting: Meeting | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export const MeetingDetailModal = ({ meeting, open, onOpenChange }: MeetingDetailModalProps) => {
    const [copied, setCopied] = useState(false);

    if (!meeting) return null;

    const getStatusBadge = (status: string | null, meetingDate: string) => {
        const statusLower = status?.toLowerCase() || "scheduled";
        const isPastMeeting = isPast(new Date(meetingDate));

        if (statusLower === "completed") {
            return <Badge className="bg-green-600">Completed</Badge>;
        }
        if (statusLower === "cancelled") {
            return <Badge variant="destructive">Cancelled</Badge>;
        }
        if (statusLower === "confirmed") {
            return <Badge className="bg-blue-600">Confirmed</Badge>;
        }
        if (isPastMeeting && statusLower !== "completed") {
            return <Badge className="bg-amber-600">Pending Review</Badge>;
        }
        return <Badge variant="secondary">Scheduled</Badge>;
    };

    const formatMeetingTime = (dateString: string) => {
        const date = new Date(dateString);
        if (isToday(date)) {
            return `Today at ${format(date, 'h:mm a')}`;
        } else if (isTomorrow(date)) {
            return `Tomorrow at ${format(date, 'h:mm a')}`;
        } else {
            return format(date, 'EEEE, MMMM d, yyyy • h:mm a');
        }
    };

    const getTimeUntil = (dateString: string) => {
        return formatDistanceToNow(new Date(dateString), { addSuffix: true });
    };

    const copyToClipboard = async (text: string) => {
        await navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const isPastMeeting = isPast(new Date(meeting.meeting_date));

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-xl max-h-[85vh] overflow-y-auto">
                <DialogHeader>
                    <div className="flex items-center justify-between gap-4">
                        <div>
                            <DialogTitle className="text-xl">{meeting.candidate_name}</DialogTitle>
                            <p className="text-sm text-muted-foreground mt-1">
                                {meeting.job_title || 'Interview Meeting'}
                            </p>
                        </div>
                        {getStatusBadge(meeting.meeting_status, meeting.meeting_date)}
                    </div>
                </DialogHeader>

                <div className="space-y-6 mt-4">
                    {/* AI Score */}
                    {meeting.ai_score !== null && meeting.ai_score !== undefined && (
                        <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                            <span className="text-sm font-medium">AI Match Score</span>
                            <span className={`text-2xl font-bold ${
                                meeting.ai_score >= 80 ? 'text-green-600' :
                                meeting.ai_score >= 60 ? 'text-amber-600' : 'text-red-600'
                            }`}>
                                {meeting.ai_score}%
                            </span>
                        </div>
                    )}

                    {/* Meeting Time */}
                    <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm font-medium">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            <span>Meeting Time</span>
                        </div>
                        <div className="pl-6">
                            <p className="font-medium">{formatMeetingTime(meeting.meeting_date)}</p>
                            <p className="text-sm text-muted-foreground">
                                {getTimeUntil(meeting.meeting_date)} • {meeting.meeting_duration} minutes
                            </p>
                        </div>
                        
                        {!isPastMeeting && meeting.meeting_link && (
                            <a href={meeting.meeting_link} target="_blank" rel="noopener noreferrer" className="block pl-6 mt-3">
                                <Button className="w-full gap-2">
                                    <Video className="h-4 w-4" />
                                    Join Meeting
                                </Button>
                            </a>
                        )}
                    </div>

                    {/* Contact Info */}
                    <div className="space-y-3">
                        <p className="text-sm font-medium">Contact Information</p>
                        <div className="space-y-2 pl-0">
                            <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                                <div className="flex items-center gap-2">
                                    <Mail className="h-4 w-4 text-muted-foreground" />
                                    <a href={`mailto:${meeting.candidate_email}`} className="text-sm hover:underline">
                                        {meeting.candidate_email}
                                    </a>
                                </div>
                                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => copyToClipboard(meeting.candidate_email)}>
                                    {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                                </Button>
                            </div>
                            
                            {meeting.candidate_phone && (
                                <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                                    <div className="flex items-center gap-2">
                                        <Phone className="h-4 w-4 text-muted-foreground" />
                                        <a href={`tel:${meeting.candidate_phone}`} className="text-sm hover:underline">
                                            {meeting.candidate_phone}
                                        </a>
                                    </div>
                                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => copyToClipboard(meeting.candidate_phone!)}>
                                        {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                                    </Button>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Job Info */}
                    {meeting.job_title && (
                        <div className="space-y-2">
                            <p className="text-sm font-medium">Position</p>
                            <div className="p-3 bg-muted/30 rounded-lg">
                                <p className="font-medium">{meeting.job_title}</p>
                                {meeting.job_id && (
                                    <p className="text-xs text-muted-foreground mt-1">ID: {meeting.job_id}</p>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Instructions */}
                    {meeting.instructions && (
                        <div className="space-y-2">
                            <p className="text-sm font-medium">Instructions</p>
                            <div className="p-3 bg-muted/30 rounded-lg">
                                <p className="text-sm whitespace-pre-wrap">{meeting.instructions}</p>
                            </div>
                        </div>
                    )}

                    {/* Meeting Link */}
                    {meeting.meeting_link && (
                        <div className="space-y-2">
                            <p className="text-sm font-medium">Meeting Link</p>
                            <div className="flex items-center gap-2 p-3 bg-muted/30 rounded-lg">
                                <p className="text-sm truncate flex-1">{meeting.meeting_link}</p>
                                <Button variant="ghost" size="sm" onClick={() => copyToClipboard(meeting.meeting_link!)}>
                                    {copied ? 'Copied!' : 'Copy'}
                                </Button>
                                <Button size="sm" onClick={() => window.open(meeting.meeting_link!, '_blank')}>
                                    <ExternalLink className="h-3 w-3" />
                                </Button>
                            </div>
                        </div>
                    )}

                    {/* CV */}
                    {meeting.cv_file_url && (
                        <Button variant="outline" onClick={() => window.open(meeting.cv_file_url!, '_blank')} className="w-full gap-2">
                            <FileText className="h-4 w-4" />
                            View CV / Resume
                        </Button>
                    )}

                    {/* Footer */}
                    {meeting.created_at && (
                        <p className="text-xs text-muted-foreground text-center pt-4 border-t">
                            Scheduled on {format(new Date(meeting.created_at), 'MMMM d, yyyy')}
                        </p>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
};
