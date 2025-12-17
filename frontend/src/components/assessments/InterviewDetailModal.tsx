import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
    User,
    Mail,
    Briefcase,
    Calendar,
    CheckCircle,
    XCircle,
    Clock,
    FileText,
    Video,
    ExternalLink,
    Play,
    MessageSquare,
    Award,
    TrendingUp,
    Phone,
    Mic,
    FileVideo,
    CalendarPlus,
} from "lucide-react";
import { format } from "date-fns";
import ScheduleMeetingDialog from "@/components/ScheduleMeetingDialog";

interface Interview {
    id: string;
    candidate_id: string;
    name: string;
    email: string;
    phone?: string | null;
    job_id: string;
    job_title?: string | null;
    interview_status: string | null;
    interview_date?: string | null;
    interview_duration_minutes?: number | null;
    interview_type?: string | null;
    interviewer_name?: string | null;
    interviewer_email?: string | null;
    client_custom_questions?: string | null;
    ai_generated_questions?: string | null;
    interview_transcript?: string | null;
    interview_recording_url?: string | null;
    screen_recording_url?: string | null;
    interview_result?: string | null;
    interview_feedback?: string | null;
    interviewer_notes?: string | null;
    hire_recommendation?: string | null;
    hire_confidence?: number | null;
    next_action?: string | null;
    next_action_date?: string | null;
    ai_overall_score?: number | null;
    ai_score?: number | null;
    ats_score?: number | null;
    mcq_score?: number | null;
    technical_score?: number | null;
    created_at?: string | null;
    updated_at?: string | null;
    completed_at?: string | null;
    internal_notes?: string | null;
    cv_file_url?: string | null;
    resume_url?: string | null;
    notes?: string | null;
    user_id?: string | null;
}

interface InterviewDetailModalProps {
    interview: Interview | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export const InterviewDetailModal = ({ interview, open, onOpenChange }: InterviewDetailModalProps) => {
    const [scheduleMeetingOpen, setScheduleMeetingOpen] = useState(false);
    
    if (!interview) return null;

    const getInitials = (name: string) => {
        return name
            .split(" ")
            .map((n) => n[0])
            .join("")
            .toUpperCase()
            .slice(0, 2);
    };

    const getStatusBadge = (status: string | null, result: string | null) => {
        if (!status) return <Badge variant="outline">Unknown</Badge>;
        
        const statusLower = status.toLowerCase();
        
        if (statusLower === "completed") {
            if (result?.toLowerCase() === "pass" || result?.toLowerCase() === "qualified") {
                return (
                    <Badge className="bg-green-100 text-green-800 border-green-200">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Passed
                    </Badge>
                );
            } else if (result?.toLowerCase() === "fail" || result?.toLowerCase() === "failed") {
                return (
                    <Badge variant="destructive">
                        <XCircle className="h-3 w-3 mr-1" />
                        Failed
                    </Badge>
                );
            }
            return (
                <Badge className="bg-blue-100 text-blue-800 border-blue-200">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Completed
                </Badge>
            );
        }
        
        if (statusLower === "in progress" || statusLower === "in_progress") {
            return (
                <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">
                    <Clock className="h-3 w-3 mr-1" />
                    In Progress
                </Badge>
            );
        }
        
        if (statusLower === "scheduled" || statusLower === "pending") {
            return (
                <Badge variant="outline">
                    <Calendar className="h-3 w-3 mr-1" />
                    Scheduled
                </Badge>
            );
        }
        
        return <Badge variant="outline">{status}</Badge>;
    };

    const getScoreColor = (score: number | null | undefined) => {
        if (!score && score !== 0) return "text-muted-foreground";
        if (score >= 80) return "text-green-600";
        if (score >= 60) return "text-yellow-600";
        return "text-red-600";
    };

    const overallScore = interview.ai_overall_score ?? interview.ai_score ?? null;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-card border border-border/60 shadow-xl">
                <DialogHeader className="pb-4">
                    <div className="flex items-start gap-4">
                        <Avatar className="h-16 w-16 flex-shrink-0">
                            <AvatarFallback className="bg-gradient-to-br from-primary to-accent text-primary-foreground text-xl">
                                {getInitials(interview.name)}
                            </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                            <DialogTitle className="text-2xl font-bold mb-2 break-words">Interview Details</DialogTitle>
                            <DialogDescription className="text-base font-medium text-foreground/80 break-words">
                                {interview.name} • {interview.email}
                            </DialogDescription>
                        </div>
                        <div className="flex-shrink-0">
                            {getStatusBadge(interview.interview_status, interview.interview_result)}
                        </div>
                    </div>
                </DialogHeader>

                <div className="space-y-6 mt-4">
                    {/* Key Performance Metrics */}
                    <div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {/* Overall Score - Main Focus */}
                            <div className="md:col-span-2 p-6 rounded-xl border-2 bg-gradient-to-br from-primary/10 via-primary/5 to-accent/10 dark:from-primary/20 dark:via-primary/10 dark:to-accent/20 border-primary/30 dark:border-primary/40 shadow-sm">
                                <div className="flex items-center justify-between mb-2">
                                    <p className="text-sm font-medium text-foreground font-semibold">AI Interview Score</p>
                                </div>
                                <p className={`text-5xl font-bold ${getScoreColor(overallScore)} mb-2`}>
                                    {overallScore !== null ? `${overallScore}%` : "--"}
                                </p>
                                {interview.hire_recommendation && (
                                    <div className="mt-3">
                                        <Badge variant="outline" className="text-xs">
                                            {interview.hire_recommendation}
                                        </Badge>
                                    </div>
                                )}
                            </div>

                            {/* Quick Stats */}
                            <div className="space-y-3">
                                {interview.interview_duration_minutes && (
                                    <div className="p-4 rounded-lg border bg-card">
                                        <p className="text-xs text-muted-foreground mb-1">Duration</p>
                                        <p className="text-2xl font-bold text-foreground">
                                            {interview.interview_duration_minutes}
                                        </p>
                                        <p className="text-xs text-muted-foreground mt-1">minutes</p>
                                    </div>
                                )}
                                {interview.hire_confidence !== null && interview.hire_confidence !== undefined && (
                                    <div className="p-4 rounded-lg border bg-card">
                                        <p className="text-xs text-foreground/80 font-semibold mb-1">Confidence</p>
                                        <p className="text-2xl font-bold text-foreground">
                                            {Math.round(interview.hire_confidence)}%
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    <Separator />

                    {/* Candidate & Job Info */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="p-4 rounded-lg border bg-card">
                            <p className="text-xs text-foreground/80 font-semibold mb-1 flex items-center gap-2">
                                <User className="h-3 w-3" />
                                Candidate Information
                            </p>
                            <div className="space-y-2">
                                <p className="text-sm font-semibold text-foreground break-words">{interview.name}</p>
                                <a href={`mailto:${interview.email}`} className="text-xs text-primary hover:underline break-all block">
                                    {interview.email}
                                </a>
                                {interview.phone && (
                                    <p className="text-xs text-foreground/80 font-medium flex items-center gap-1">
                                        <Phone className="h-3 w-3" />
                                        {interview.phone}
                                    </p>
                                )}
                                {interview.candidate_id && (
                                    <p className="text-xs text-foreground/80 font-medium mt-2">
                                        <span className="font-semibold">Candidate ID:</span> {interview.candidate_id}
                                    </p>
                                )}
                            </div>
                        </div>
                        <div className="p-4 rounded-lg border bg-card">
                            <p className="text-xs text-foreground/80 font-semibold mb-1 flex items-center gap-2">
                                <Briefcase className="h-3 w-3" />
                                Job Information
                            </p>
                            <div className="space-y-2">
                                {interview.job_title ? (
                                    <p className="text-sm font-semibold text-foreground break-words">{interview.job_title}</p>
                                ) : (
                                    <p className="text-sm text-foreground/70 font-medium italic">No job title specified</p>
                                )}
                                {interview.job_id && (
                                    <p className="text-xs text-muted-foreground">
                                        <span className="font-semibold">Job ID:</span> {interview.job_id}
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Schedule Meeting Button */}
                    <div className="flex justify-end">
                        <Button
                            onClick={() => setScheduleMeetingOpen(true)}
                            className="gap-2"
                        >
                            <CalendarPlus className="h-4 w-4" />
                            Schedule Meeting
                        </Button>
                    </div>

                    {/* Screen Recording - Moved to top after candidate details */}
                    {interview.screen_recording_url && (
                        <>
                            <Separator />
                            <div className="space-y-3">
                                <h3 className="text-lg font-bold flex items-center gap-2">
                                    <Video className="h-5 w-5 flex-shrink-0" />
                                    Screen Recording
                                </h3>
                                <div className="p-4 rounded-lg border bg-card">
                                    <div className="flex items-center justify-between gap-4 mb-4">
                                        <div className="flex items-center gap-3 flex-1 min-w-0">
                                            <div className="p-2 rounded-lg bg-primary/10">
                                                <Video className="h-5 w-5 text-primary" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-semibold text-foreground">Screen Recording</p>
                                                <p className="text-xs text-muted-foreground truncate">
                                                    Screen recording of interview session
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex gap-2 flex-shrink-0">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => window.open(interview.screen_recording_url!, '_blank')}
                                                className="gap-2 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-primary focus-visible:ring-offset-background"
                                            >
                                                <Play className="h-4 w-4" />
                                                Play
                                            </Button>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => {
                                                    const link = document.createElement('a');
                                                    link.href = interview.screen_recording_url!;
                                                    link.download = `interview-screen-${interview.name}-${interview.id}.webm`;
                                                    link.click();
                                                }}
                                                className="gap-2 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-primary focus-visible:ring-offset-background"
                                            >
                                                <ExternalLink className="h-4 w-4" />
                                                Open
                                            </Button>
                                        </div>
                                    </div>
                                    <div className="mt-4 rounded-lg overflow-hidden border bg-muted/30">
                                        <video
                                            src={interview.screen_recording_url}
                                            controls
                                            className="w-full max-h-[400px]"
                                            preload="metadata"
                                        >
                                            Your browser does not support the video tag.
                                        </video>
                                    </div>
                                </div>
                            </div>
                        </>
                    )}

                    {/* Interview Timeline & Type */}
                    {(interview.interview_date || interview.completed_at || interview.created_at || interview.updated_at || interview.interview_type) && (
                        <>
                            <Separator />
                            <div className="space-y-4">
                                {interview.interview_type && (
                                    <div className="p-3 rounded-lg border bg-card">
                                        <p className="text-xs text-foreground/80 font-semibold mb-1 flex items-center gap-2">
                                            <Briefcase className="h-3 w-3" />
                                            Interview Type
                                        </p>
                                        <p className="text-sm font-semibold text-foreground">{interview.interview_type}</p>
                                    </div>
                                )}
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                    {interview.interview_date && (
                                        <div className="p-3 rounded-lg border bg-card">
                                            <p className="text-xs text-foreground/80 font-semibold mb-1 flex items-center gap-2">
                                                <Calendar className="h-3 w-3" />
                                                Scheduled
                                            </p>
                                            <p className="text-sm font-semibold text-foreground">
                                                {format(new Date(interview.interview_date), 'PPp')}
                                            </p>
                                        </div>
                                    )}
                                    {interview.completed_at && (
                                        <div className="p-3 rounded-lg border bg-card">
                                            <p className="text-xs text-foreground/80 font-semibold mb-1 flex items-center gap-2">
                                                <CheckCircle className="h-3 w-3" />
                                                Completed
                                            </p>
                                            <p className="text-sm font-semibold text-foreground">
                                                {format(new Date(interview.completed_at), 'PPp')}
                                            </p>
                                        </div>
                                    )}
                                    {interview.created_at && (
                                        <div className="p-3 rounded-lg border bg-card">
                                            <p className="text-xs text-foreground/80 font-semibold mb-1 flex items-center gap-2">
                                                <Clock className="h-3 w-3" />
                                                Created
                                            </p>
                                            <p className="text-sm font-semibold text-foreground">
                                                {format(new Date(interview.created_at), 'PPp')}
                                            </p>
                                        </div>
                                    )}
                                    {interview.updated_at && (
                                        <div className="p-3 rounded-lg border bg-card">
                                            <p className="text-xs text-foreground/80 font-semibold mb-1 flex items-center gap-2">
                                                <Clock className="h-3 w-3" />
                                                Last Updated
                                            </p>
                                            <p className="text-sm font-semibold text-foreground">
                                                {format(new Date(interview.updated_at), 'PPp')}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </>
                    )}

                    {/* Score Breakdown */}
                    {(interview.ats_score !== null || interview.mcq_score !== null || interview.technical_score !== null) && (
                        <>
                            <Separator />
                            <div className="space-y-3">
                                <h3 className="text-lg font-bold flex items-center gap-2">
                                    <TrendingUp className="h-5 w-5 flex-shrink-0" />
                                    Score Breakdown
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    {interview.ats_score !== null && interview.ats_score !== undefined && (
                                        <div className="p-4 rounded-lg border bg-card">
                                            <p className="text-xs text-muted-foreground mb-1">ATS Score</p>
                                            <p className={`text-2xl font-bold ${getScoreColor(interview.ats_score)}`}>
                                                {interview.ats_score}%
                                            </p>
                                        </div>
                                    )}
                                    {interview.mcq_score !== null && interview.mcq_score !== undefined && (
                                        <div className="p-4 rounded-lg border bg-card">
                                            <p className="text-xs text-muted-foreground mb-1">MCQ Score</p>
                                            <p className={`text-2xl font-bold ${getScoreColor(interview.mcq_score)}`}>
                                                {interview.mcq_score}%
                                            </p>
                                        </div>
                                    )}
                                    {interview.technical_score !== null && interview.technical_score !== undefined && (
                                        <div className="p-4 rounded-lg border bg-card">
                                            <p className="text-xs text-muted-foreground mb-1">Technical Score</p>
                                            <p className={`text-2xl font-bold ${getScoreColor(interview.technical_score)}`}>
                                                {interview.technical_score}%
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </>
                    )}

                    {/* Interview Questions */}
                    {(interview.client_custom_questions || interview.ai_generated_questions) && (
                        <>
                            <Separator />
                            <div className="space-y-4">
                                <h3 className="text-lg font-bold flex items-center gap-2">
                                    <FileText className="h-5 w-5 flex-shrink-0" />
                                    Interview Questions
                                </h3>
                                
                                {interview.client_custom_questions && (
                                    <div className="p-4 rounded-lg border bg-card">
                                        <p className="text-sm font-semibold text-foreground mb-2 flex items-center gap-2">
                                            <User className="h-4 w-4" />
                                            Client Custom Questions
                                        </p>
                                        <div className="text-sm text-foreground whitespace-pre-wrap">
                                            {interview.client_custom_questions}
                                        </div>
                                    </div>
                                )}
                                
                                {interview.ai_generated_questions && (
                                    <div className="p-4 rounded-lg border bg-card">
                                        <p className="text-sm font-semibold text-foreground mb-2 flex items-center gap-2">
                                            <Award className="h-4 w-4" />
                                            AI Generated Questions
                                        </p>
                                        <div className="text-sm text-foreground whitespace-pre-wrap">
                                            {interview.ai_generated_questions}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </>
                    )}

                    {/* Interview Transcript */}
                    {interview.interview_transcript && (
                        <>
                            <Separator />
                            <div className="space-y-3">
                                <h3 className="text-lg font-bold flex items-center gap-2">
                                    <MessageSquare className="h-5 w-5 flex-shrink-0" />
                                    Interview Transcript
                                </h3>
                                <div className="p-4 rounded-lg border bg-card max-h-[400px] overflow-y-auto">
                                    <pre className="text-sm text-foreground whitespace-pre-wrap font-sans">
                                        {interview.interview_transcript}
                                    </pre>
                                </div>
                            </div>
                        </>
                    )}

                    {/* Audio Recording */}
                    {interview.interview_recording_url && (
                        <>
                            <Separator />
                            <div className="space-y-3">
                                <h3 className="text-lg font-bold flex items-center gap-2">
                                    <Mic className="h-5 w-5 flex-shrink-0" />
                                    Audio Recording
                                </h3>
                                <div className="p-4 rounded-lg border bg-card">
                                    <div className="flex items-center justify-between gap-4 mb-4">
                                        <div className="flex items-center gap-3 flex-1 min-w-0">
                                            <div className="p-2 rounded-lg bg-primary/10">
                                                <Mic className="h-5 w-5 text-primary" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-semibold text-foreground">Audio Recording</p>
                                                <p className="text-xs text-muted-foreground truncate">
                                                    Audio recording of interview session
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex gap-2 flex-shrink-0">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => window.open(interview.interview_recording_url!, '_blank')}
                                                className="gap-2 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-primary focus-visible:ring-offset-background"
                                            >
                                                <Play className="h-4 w-4" />
                                                Play
                                            </Button>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => {
                                                    const link = document.createElement('a');
                                                    link.href = interview.interview_recording_url!;
                                                    link.download = `interview-audio-${interview.name}-${interview.id}.webm`;
                                                    link.click();
                                                }}
                                                className="gap-2 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-primary focus-visible:ring-offset-background"
                                            >
                                                <ExternalLink className="h-4 w-4" />
                                                Open
                                            </Button>
                                        </div>
                                    </div>
                                    <div className="mt-4 rounded-lg overflow-hidden border bg-muted/30">
                                        <audio
                                            src={interview.interview_recording_url}
                                            controls
                                            className="w-full"
                                        >
                                            Your browser does not support the audio tag.
                                        </audio>
                                    </div>
                                </div>
                            </div>
                        </>
                    )}


                    {/* Interview Result */}
                    {interview.interview_result && (
                        <>
                            <Separator />
                            <div className="space-y-3">
                                <h3 className="text-lg font-bold flex items-center gap-2">
                                    <Award className="h-5 w-5 flex-shrink-0" />
                                    Interview Result
                                </h3>
                                <div className="p-4 rounded-lg border bg-card">
                                    <div className="flex items-center gap-3">
                                        <Badge 
                                            className={
                                                interview.interview_result.toLowerCase() === 'pass' || 
                                                interview.interview_result.toLowerCase() === 'qualified'
                                                    ? "bg-green-100 text-green-800 border-green-200"
                                                    : interview.interview_result.toLowerCase() === 'fail' ||
                                                      interview.interview_result.toLowerCase() === 'failed'
                                                    ? "bg-red-100 text-red-800 border-red-200"
                                                    : "bg-blue-100 text-blue-800 border-blue-200"
                                            }
                                        >
                                            {interview.interview_result}
                                        </Badge>
                                        {interview.hire_recommendation && (
                                            <Badge variant="outline" className="text-xs">
                                                {interview.hire_recommendation}
                                            </Badge>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </>
                    )}

                    {/* Feedback & Notes */}
                    {(interview.interview_feedback || interview.interviewer_notes || interview.internal_notes || interview.notes) && (
                        <>
                            <Separator />
                            <div className="space-y-4">
                                <h3 className="text-lg font-bold flex items-center gap-2">
                                    <FileText className="h-5 w-5 flex-shrink-0" />
                                    Feedback & Notes
                                </h3>
                                
                                {interview.interview_feedback && (
                                    <div className="p-4 rounded-lg border bg-card">
                                        <p className="text-sm font-semibold text-foreground mb-2 flex items-center gap-2">
                                            <MessageSquare className="h-4 w-4" />
                                            Interview Feedback
                                        </p>
                                        <div className="text-sm text-foreground whitespace-pre-wrap">
                                            {interview.interview_feedback}
                                        </div>
                                    </div>
                                )}
                                
                                {interview.interviewer_notes && (
                                    <div className="p-4 rounded-lg border bg-card">
                                        <p className="text-sm font-semibold text-foreground mb-2 flex items-center gap-2">
                                            <User className="h-4 w-4" />
                                            Interviewer Notes
                                        </p>
                                        <div className="text-sm text-foreground whitespace-pre-wrap">
                                            {interview.interviewer_notes}
                                        </div>
                                    </div>
                                )}
                                
                                {interview.internal_notes && (
                                    <div className="p-4 rounded-lg border bg-card">
                                        <p className="text-sm font-semibold text-foreground mb-2 flex items-center gap-2">
                                            <FileText className="h-4 w-4" />
                                            Internal Notes
                                        </p>
                                        <div className="text-sm text-foreground whitespace-pre-wrap">
                                            {interview.internal_notes}
                                        </div>
                                    </div>
                                )}

                                {interview.notes && (
                                    <div className="p-4 rounded-lg border bg-card">
                                        <p className="text-sm font-semibold text-foreground mb-2 flex items-center gap-2">
                                            <FileText className="h-4 w-4" />
                                            General Notes
                                        </p>
                                        <div className="text-sm text-foreground whitespace-pre-wrap">
                                            {interview.notes}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </>
                    )}

                    {/* Next Actions */}
                    {(interview.next_action || interview.next_action_date) && (
                        <>
                            <Separator />
                            <div className="space-y-3">
                                <h3 className="text-lg font-bold flex items-center gap-2">
                                    <Calendar className="h-5 w-5 flex-shrink-0" />
                                    Next Actions
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {interview.next_action && (
                                        <div className="p-4 rounded-lg border bg-card">
                                            <p className="text-xs text-muted-foreground mb-1">Action</p>
                                            <p className="text-sm font-semibold text-foreground">{interview.next_action}</p>
                                        </div>
                                    )}
                                    {interview.next_action_date && (
                                        <div className="p-4 rounded-lg border bg-card">
                                            <p className="text-xs text-muted-foreground mb-1">Action Date</p>
                                            <p className="text-sm font-semibold text-foreground">
                                                {format(new Date(interview.next_action_date), 'PPp')}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </>
                    )}

                    {/* Interviewer Info */}
                    {(interview.interviewer_name || interview.interviewer_email) && (
                        <>
                            <Separator />
                            <div className="p-4 rounded-lg border bg-card">
                                <p className="text-sm font-semibold text-foreground mb-2">Interviewer Information</p>
                                <div className="space-y-1">
                                    {interview.interviewer_name && (
                                        <p className="text-sm text-foreground">
                                            <span className="text-muted-foreground">Name:</span> {interview.interviewer_name}
                                        </p>
                                    )}
                                    {interview.interviewer_email && (
                                        <a href={`mailto:${interview.interviewer_email}`} className="text-sm text-primary hover:underline">
                                            <span className="text-muted-foreground">Email:</span> {interview.interviewer_email}
                                        </a>
                                    )}
                                </div>
                            </div>
                        </>
                    )}

                    {/* CV/Resume Links */}
                    {(interview.cv_file_url || interview.resume_url) && (
                        <>
                            <Separator />
                            <div className="space-y-3">
                                <h3 className="text-lg font-bold flex items-center gap-2">
                                    <FileText className="h-5 w-5 flex-shrink-0" />
                                    Documents
                                </h3>
                                <div className="flex gap-2">
                                    {interview.cv_file_url && (
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => window.open(interview.cv_file_url!, '_blank')}
                                            className="gap-2"
                                        >
                                            <FileText className="h-4 w-4" />
                                            View CV
                                        </Button>
                                    )}
                                    {interview.resume_url && (
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => window.open(interview.resume_url!, '_blank')}
                                            className="gap-2"
                                        >
                                            <FileText className="h-4 w-4" />
                                            View Resume
                                        </Button>
                                    )}
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </DialogContent>
            
            {/* Schedule Meeting Dialog */}
            <ScheduleMeetingDialog
                candidate={{
                    id: interview.candidate_id,
                    name: interview.name,
                    email: interview.email,
                    phone: interview.phone || undefined,
                    cv_file_url: interview.cv_file_url || interview.resume_url || undefined,
                    ai_score: overallScore || undefined,
                    job_id: interview.job_id,
                    source: 'interview',
                }}
                open={scheduleMeetingOpen}
                onOpenChange={setScheduleMeetingOpen}
                onSuccess={() => {
                    // Optionally refresh data or show success message
                }}
            />
        </Dialog>
    );
};

