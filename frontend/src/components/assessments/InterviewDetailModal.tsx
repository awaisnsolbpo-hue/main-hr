import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    Mail,
    Calendar,
    FileText,
    Video,
    ExternalLink,
    Play,
    Phone,
    Mic,
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

    const getStatusBadge = (status: string | null, result: string | null) => {
        if (!status) return <Badge variant="outline">Unknown</Badge>;
        const statusLower = status.toLowerCase();
        
        if (statusLower === "completed") {
            if (result?.toLowerCase() === "pass" || result?.toLowerCase() === "qualified") {
                return <Badge className="bg-green-600">Passed</Badge>;
            } else if (result?.toLowerCase() === "fail" || result?.toLowerCase() === "failed") {
                return <Badge variant="destructive">Failed</Badge>;
            }
            return <Badge className="bg-blue-600">Completed</Badge>;
        }
        if (statusLower === "in progress" || statusLower === "in_progress") {
            return <Badge className="bg-amber-600">In Progress</Badge>;
        }
        if (statusLower === "scheduled" || statusLower === "pending") {
            return <Badge variant="secondary">Scheduled</Badge>;
        }
        return <Badge variant="outline">{status}</Badge>;
    };

    const getScoreColor = (score: number | null | undefined) => {
        if (!score && score !== 0) return "";
        if (score >= 80) return "text-green-600";
        if (score >= 60) return "text-amber-600";
        return "text-red-600";
    };

    const overallScore = interview.ai_overall_score ?? interview.ai_score ?? null;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
                <DialogHeader>
                    <div className="flex items-center justify-between gap-4">
                        <div>
                            <DialogTitle className="text-xl">{interview.name}</DialogTitle>
                            <p className="text-sm text-muted-foreground mt-1">{interview.email}</p>
                        </div>
                        {getStatusBadge(interview.interview_status, interview.interview_result)}
                    </div>
                </DialogHeader>

                <div className="space-y-6 mt-4">
                    {/* AI Score */}
                    <div className="flex items-center justify-between p-4 bg-primary/10 rounded-lg">
                        <div>
                            <p className="text-sm font-medium">AI Interview Score</p>
                            {interview.hire_recommendation && (
                                <Badge variant="outline" className="mt-1 text-xs">{interview.hire_recommendation}</Badge>
                            )}
                        </div>
                        <p className={`text-4xl font-bold ${getScoreColor(overallScore)}`}>
                            {overallScore !== null ? `${overallScore}%` : "--"}
                        </p>
                    </div>

                    {/* Candidate & Job Info */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="p-3 bg-muted/30 rounded-lg space-y-1">
                            <p className="text-xs text-muted-foreground">Candidate</p>
                            <p className="font-medium text-sm">{interview.name}</p>
                            <a href={`mailto:${interview.email}`} className="text-xs text-primary hover:underline block">{interview.email}</a>
                            {interview.phone && (
                                <p className="text-xs text-muted-foreground flex items-center gap-1">
                                    <Phone className="h-3 w-3" />{interview.phone}
                                </p>
                            )}
                        </div>
                        <div className="p-3 bg-muted/30 rounded-lg space-y-1">
                            <p className="text-xs text-muted-foreground">Position</p>
                            <p className="font-medium text-sm">{interview.job_title || 'Not specified'}</p>
                            {interview.interview_type && (
                                <Badge variant="outline" className="text-xs">{interview.interview_type}</Badge>
                            )}
                        </div>
                    </div>

                    {/* Schedule Meeting Button */}
                    <Button onClick={() => setScheduleMeetingOpen(true)} className="w-full gap-2">
                        <CalendarPlus className="h-4 w-4" />
                        Schedule Meeting
                    </Button>

                    {/* Screen Recording */}
                    {interview.screen_recording_url && (
                        <div className="space-y-2">
                            <p className="text-sm font-medium flex items-center gap-2">
                                <Video className="h-4 w-4" />
                                Screen Recording
                            </p>
                            <div className="p-3 bg-muted/30 rounded-lg space-y-3">
                                <div className="flex gap-2">
                                    <Button variant="outline" size="sm" onClick={() => window.open(interview.screen_recording_url!, '_blank')}>
                                        <Play className="h-4 w-4 mr-2" />Play
                                    </Button>
                                    <Button variant="outline" size="sm" onClick={() => window.open(interview.screen_recording_url!, '_blank')}>
                                        <ExternalLink className="h-4 w-4 mr-2" />Open
                                    </Button>
                                </div>
                                <video src={interview.screen_recording_url} controls className="w-full max-h-[300px] rounded" preload="metadata" />
                            </div>
                        </div>
                    )}

                    {/* Timeline */}
                    {(interview.interview_date || interview.completed_at) && (
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            {interview.interview_date && (
                                <div className="p-3 bg-muted/30 rounded-lg">
                                    <p className="text-xs text-muted-foreground">Scheduled</p>
                                    <p className="text-sm">{format(new Date(interview.interview_date), 'PP')}</p>
                                </div>
                            )}
                            {interview.completed_at && (
                                <div className="p-3 bg-muted/30 rounded-lg">
                                    <p className="text-xs text-muted-foreground">Completed</p>
                                    <p className="text-sm">{format(new Date(interview.completed_at), 'PP')}</p>
                                </div>
                            )}
                            {interview.interview_duration_minutes && (
                                <div className="p-3 bg-muted/30 rounded-lg">
                                    <p className="text-xs text-muted-foreground">Duration</p>
                                    <p className="text-sm">{interview.interview_duration_minutes} min</p>
                                </div>
                            )}
                            {interview.hire_confidence !== null && interview.hire_confidence !== undefined && (
                                <div className="p-3 bg-muted/30 rounded-lg">
                                    <p className="text-xs text-muted-foreground">Confidence</p>
                                    <p className="text-sm font-semibold">{Math.round(interview.hire_confidence)}%</p>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Score Breakdown */}
                    {(interview.ats_score !== null || interview.mcq_score !== null || interview.technical_score !== null) && (
                        <div className="space-y-2">
                            <p className="text-sm font-medium">Score Breakdown</p>
                            <div className="grid grid-cols-3 gap-3">
                                {interview.ats_score !== null && interview.ats_score !== undefined && (
                                    <div className="p-3 bg-muted/30 rounded-lg text-center">
                                        <p className="text-xs text-muted-foreground">ATS</p>
                                        <p className={`text-xl font-bold ${getScoreColor(interview.ats_score)}`}>{interview.ats_score}%</p>
                                    </div>
                                )}
                                {interview.mcq_score !== null && interview.mcq_score !== undefined && (
                                    <div className="p-3 bg-muted/30 rounded-lg text-center">
                                        <p className="text-xs text-muted-foreground">MCQ</p>
                                        <p className={`text-xl font-bold ${getScoreColor(interview.mcq_score)}`}>{interview.mcq_score}%</p>
                                    </div>
                                )}
                                {interview.technical_score !== null && interview.technical_score !== undefined && (
                                    <div className="p-3 bg-muted/30 rounded-lg text-center">
                                        <p className="text-xs text-muted-foreground">Technical</p>
                                        <p className={`text-xl font-bold ${getScoreColor(interview.technical_score)}`}>{interview.technical_score}%</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Transcript */}
                    {interview.interview_transcript && (
                        <div className="space-y-2">
                            <p className="text-sm font-medium">Transcript</p>
                            <div className="p-3 bg-muted/30 rounded-lg max-h-64 overflow-y-auto">
                                <pre className="text-sm whitespace-pre-wrap font-sans">{interview.interview_transcript}</pre>
                            </div>
                        </div>
                    )}

                    {/* Audio Recording */}
                    {interview.interview_recording_url && (
                        <div className="space-y-2">
                            <p className="text-sm font-medium flex items-center gap-2">
                                <Mic className="h-4 w-4" />
                                Audio Recording
                            </p>
                            <div className="p-3 bg-muted/30 rounded-lg">
                                <audio src={interview.interview_recording_url} controls className="w-full" />
                            </div>
                        </div>
                    )}

                    {/* Interview Result */}
                    {interview.interview_result && (
                        <div className="space-y-2">
                            <p className="text-sm font-medium">Result</p>
                            <div className="flex items-center gap-2">
                                <Badge className={
                                    interview.interview_result.toLowerCase() === 'pass' || interview.interview_result.toLowerCase() === 'qualified'
                                        ? "bg-green-600" : interview.interview_result.toLowerCase() === 'fail' || interview.interview_result.toLowerCase() === 'failed'
                                        ? "bg-red-600" : "bg-blue-600"
                                }>
                                    {interview.interview_result}
                                </Badge>
                                {interview.hire_recommendation && (
                                    <Badge variant="outline">{interview.hire_recommendation}</Badge>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Feedback & Notes */}
                    {(interview.interview_feedback || interview.interviewer_notes || interview.notes) && (
                        <div className="space-y-3">
                            <p className="text-sm font-medium">Feedback & Notes</p>
                            {interview.interview_feedback && (
                                <div className="p-3 bg-muted/30 rounded-lg">
                                    <p className="text-xs text-muted-foreground mb-1">Feedback</p>
                                    <p className="text-sm whitespace-pre-wrap">{interview.interview_feedback}</p>
                                </div>
                            )}
                            {interview.interviewer_notes && (
                                <div className="p-3 bg-muted/30 rounded-lg">
                                    <p className="text-xs text-muted-foreground mb-1">Interviewer Notes</p>
                                    <p className="text-sm whitespace-pre-wrap">{interview.interviewer_notes}</p>
                                </div>
                            )}
                            {interview.notes && (
                                <div className="p-3 bg-muted/30 rounded-lg">
                                    <p className="text-xs text-muted-foreground mb-1">General Notes</p>
                                    <p className="text-sm whitespace-pre-wrap">{interview.notes}</p>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Next Actions */}
                    {(interview.next_action || interview.next_action_date) && (
                        <div className="grid grid-cols-2 gap-3">
                            {interview.next_action && (
                                <div className="p-3 bg-muted/30 rounded-lg">
                                    <p className="text-xs text-muted-foreground">Next Action</p>
                                    <p className="text-sm font-medium">{interview.next_action}</p>
                                </div>
                            )}
                            {interview.next_action_date && (
                                <div className="p-3 bg-muted/30 rounded-lg">
                                    <p className="text-xs text-muted-foreground">Action Date</p>
                                    <p className="text-sm">{format(new Date(interview.next_action_date), 'PP')}</p>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Documents */}
                    {(interview.cv_file_url || interview.resume_url) && (
                        <div className="flex gap-2">
                            {interview.cv_file_url && (
                                <Button variant="outline" size="sm" onClick={() => window.open(interview.cv_file_url!, '_blank')}>
                                    <FileText className="h-4 w-4 mr-2" />View CV
                                </Button>
                            )}
                            {interview.resume_url && (
                                <Button variant="outline" size="sm" onClick={() => window.open(interview.resume_url!, '_blank')}>
                                    <FileText className="h-4 w-4 mr-2" />View Resume
                                </Button>
                            )}
                        </div>
                    )}
                </div>
            </DialogContent>
            
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
                onSuccess={() => {}}
            />
        </Dialog>
    );
};
