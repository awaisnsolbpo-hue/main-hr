import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { ScoreDisplay } from "@/components/assessments/ScoreDisplay";
import {
    User,
    Mail,
    Briefcase,
    Calendar,
    CheckCircle,
    Clock,
    FileText,
    Code2,
    Award,
    TrendingUp,
    FileCode,
    Play,
    ExternalLink,
    Video,
    CalendarPlus,
} from "lucide-react";
import { format } from "date-fns";
import ScheduleMeetingDialog from "@/components/ScheduleMeetingDialog";

interface TechnicalTest {
    id: string;
    candidate_id: string;
    candidate_name: string;
    candidate_email: string;
    job_id: string;
    job_title: string | null;
    task_title: string;
    task_description: string;
    task_requirements?: string[] | string | null;
    difficulty?: string | null;
    time_limit_minutes?: number | null;
    programming_language?: string | null;
    tools_allowed?: string[] | string | null;
    starter_code?: string | null;
    expected_output_example?: string | null;
    success_criteria?: string[] | string | null;
    bonus_features?: string[] | string | null;
    disqualifying_factors?: string[] | string | null;
    evaluation_focus?: any | null;
    task_notes?: string | null;
    status: string;
    submission_url?: string | null;
    submission_code?: string | null;
    submitted_at?: string | null;
    video_duration_seconds?: number | null;
    overall_score: number | null;
    approach_score: number | null;
    code_quality_score: number | null;
    correctness_score: number | null;
    communication_score: number | null;
    ai_analysis?: any | null;
    code_review?: string | null;
    recommendation: string | null;
    feedback?: string | null;
    code_solution?: string | null;
    code_url?: string | null;
    recording_url?: string | null;
    screen_recording_saved?: boolean | null;
    screen_resolution?: string | null;
    tools_used?: string | null;
    scheduled_at?: string | null;
    started_at: string | null;
    completed_at: string | null;
    duration_minutes?: number | null;
    time_taken?: number | null; // in minutes
    created_at: string;
    updated_at?: string | null;
    reviewed_at?: string | null;
}

interface TechnicalDetailModalProps {
    test: TechnicalTest | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export const TechnicalDetailModal = ({ test, open, onOpenChange }: TechnicalDetailModalProps) => {
    const [scheduleMeetingOpen, setScheduleMeetingOpen] = useState(false);
    
    if (!test) return null;

    const getInitials = (name: string) => {
        return name
            .split(" ")
            .map((n) => n[0])
            .join("")
            .toUpperCase()
            .slice(0, 2);
    };

    const getStatusBadge = (status: string, recommendation: string | null) => {
        if (status === "completed") {
            if (recommendation?.toLowerCase().includes("hire") || recommendation?.toLowerCase().includes("strong")) {
                return (
                    <Badge className="bg-green-100 text-green-800 border-green-200">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Recommended
                    </Badge>
                );
            }
            return <Badge variant="outline">Completed</Badge>;
        }
        if (status === "in_progress") {
            return (
                <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">
                    <Clock className="h-3 w-3 mr-1" />
                    In Progress
                </Badge>
            );
        }
        return <Badge variant="outline">Scheduled</Badge>;
    };

    const getScoreColor = (score: number | null) => {
        if (!score) return "text-foreground/70 font-semibold";
        if (score >= 80) return "text-green-600";
        if (score >= 60) return "text-yellow-600";
        return "text-red-600";
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-card border border-border/60 shadow-xl">
                <DialogHeader className="pb-4">
                    <div className="flex items-start gap-4">
                        <Avatar className="h-16 w-16 flex-shrink-0">
                            <AvatarFallback className="bg-gradient-to-br from-primary to-accent text-primary-foreground text-xl">
                                {getInitials(test.candidate_name)}
                            </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                            <DialogTitle className="text-2xl font-bold mb-2 break-words">{test.task_title}</DialogTitle>
                            <DialogDescription className="text-base font-medium text-foreground/80 break-words">
                                {test.candidate_name} • {test.candidate_email}
                            </DialogDescription>
                        </div>
                        <div className="flex-shrink-0">
                            {getStatusBadge(test.status, test.recommendation)}
                        </div>
                    </div>
                </DialogHeader>

                <div className="space-y-6 mt-4">
                    {/* Candidate & Job Information */}
                    <div className="space-y-3">
                        <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                            <User className="h-5 w-5 flex-shrink-0" />
                            Candidate Information
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="flex items-start gap-3 p-3 rounded-lg border bg-card">
                                <User className="h-4 w-4 text-foreground/70 flex-shrink-0 mt-0.5" />
                                <div className="min-w-0 flex-1">
                                    <p className="text-xs text-foreground/80 font-semibold mb-1">Name</p>
                                    <p className="text-sm font-semibold text-foreground break-words">{test.candidate_name}</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3 p-3 rounded-lg border bg-card">
                                <Mail className="h-4 w-4 text-foreground/70 flex-shrink-0 mt-0.5" />
                                <div className="min-w-0 flex-1">
                                    <p className="text-xs text-foreground/80 font-semibold mb-1">Email</p>
                                    <a href={`mailto:${test.candidate_email}`} className="text-sm font-semibold text-foreground hover:text-primary break-all">
                                        {test.candidate_email}
                                    </a>
                                </div>
                            </div>
                            {test.job_title && (
                                <div className="flex items-start gap-3 p-3 rounded-lg border bg-card md:col-span-2">
                                    <Briefcase className="h-4 w-4 text-foreground/70 flex-shrink-0 mt-0.5" />
                                    <div className="min-w-0 flex-1">
                                        <p className="text-xs text-foreground/80 font-semibold mb-1">Job Title</p>
                                        <p className="text-sm font-semibold text-foreground break-words">{test.job_title}</p>
                                    </div>
                                </div>
                            )}
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

                    <Separator />

                    {/* Task Details */}
                    <div className="space-y-4">
                        <h3 className="text-lg font-bold flex items-center gap-2">
                            <FileText className="h-5 w-5 flex-shrink-0" />
                            Task Details
                        </h3>
                        
                        {/* Task Description */}
                        <div className="p-4 rounded-lg border bg-card">
                            <p className="text-xs font-bold text-foreground mb-2">Description</p>
                            <p className="text-sm font-medium text-foreground whitespace-pre-wrap break-words leading-relaxed">
                                {test.task_description}
                            </p>
                        </div>

                        {/* Task Requirements */}
                        {test.task_requirements && (
                            <div className="p-4 rounded-lg border bg-card">
                                <p className="text-xs font-bold text-foreground mb-2">Requirements</p>
                                <ul className="list-disc list-inside space-y-1 text-sm text-foreground">
                                    {Array.isArray(test.task_requirements) ? (
                                        test.task_requirements.map((req: string, idx: number) => (
                                            <li key={idx} className="break-words">{req}</li>
                                        ))
                                    ) : typeof test.task_requirements === 'string' ? (
                                        <li className="whitespace-pre-wrap break-words">{test.task_requirements}</li>
                                    ) : null}
                                </ul>
                            </div>
                        )}

                        {/* Task Metadata */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {test.difficulty && (
                                <div className="p-3 rounded-lg border bg-card">
                                    <p className="text-xs text-foreground/80 font-semibold mb-1">Difficulty</p>
                                    <Badge variant="outline" className="capitalize">{test.difficulty}</Badge>
                                </div>
                            )}
                            {test.time_limit_minutes && (
                                <div className="p-3 rounded-lg border bg-card">
                                    <p className="text-xs text-foreground/80 font-semibold mb-1">Time Limit</p>
                                    <p className="text-sm font-semibold text-foreground">{test.time_limit_minutes} minutes</p>
                                </div>
                            )}
                            {test.programming_language && (
                                <div className="p-3 rounded-lg border bg-card">
                                    <p className="text-xs text-foreground/80 font-semibold mb-1">Programming Language</p>
                                    <p className="text-sm font-semibold text-foreground">{test.programming_language}</p>
                                </div>
                            )}
                            {test.tools_allowed && (
                                <div className="p-3 rounded-lg border bg-card">
                                    <p className="text-xs text-foreground/80 font-semibold mb-1">Tools Allowed</p>
                                    <div className="flex flex-wrap gap-1 mt-1">
                                        {Array.isArray(test.tools_allowed) ? (
                                            test.tools_allowed.map((tool: string, idx: number) => (
                                                <Badge key={idx} variant="secondary" className="text-xs">{tool}</Badge>
                                            ))
                                        ) : (
                                            <Badge variant="secondary" className="text-xs">{test.tools_allowed}</Badge>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Starter Code */}
                        {test.starter_code && (
                            <div className="p-4 rounded-lg border bg-card">
                                <p className="text-xs font-bold text-foreground mb-2">Starter Code</p>
                                <pre className="text-xs overflow-x-auto bg-muted/50 p-3 rounded border">
                                    <code className="text-foreground">{test.starter_code}</code>
                                </pre>
                            </div>
                        )}

                        {/* Expected Output */}
                        {test.expected_output_example && (
                            <div className="p-4 rounded-lg border bg-card">
                                <p className="text-xs font-bold text-foreground mb-2">Expected Output Example</p>
                                <p className="text-sm text-foreground whitespace-pre-wrap break-words">{test.expected_output_example}</p>
                            </div>
                        )}

                        {/* Success Criteria */}
                        {test.success_criteria && (
                            <div className="p-4 rounded-lg border bg-card">
                                <p className="text-xs font-bold text-foreground mb-2">Success Criteria</p>
                                <ul className="list-disc list-inside space-y-1 text-sm text-foreground">
                                    {Array.isArray(test.success_criteria) ? (
                                        test.success_criteria.map((criteria: string, idx: number) => (
                                            <li key={idx} className="break-words">{criteria}</li>
                                        ))
                                    ) : (
                                        <li className="whitespace-pre-wrap break-words">{test.success_criteria}</li>
                                    )}
                                </ul>
                            </div>
                        )}

                        {/* Bonus Features */}
                        {test.bonus_features && (
                            <div className="p-4 rounded-lg border bg-card">
                                <p className="text-xs font-bold text-foreground mb-2">Bonus Features</p>
                                <ul className="list-disc list-inside space-y-1 text-sm text-foreground">
                                    {Array.isArray(test.bonus_features) ? (
                                        test.bonus_features.map((feature: string, idx: number) => (
                                            <li key={idx} className="break-words">{feature}</li>
                                        ))
                                    ) : (
                                        <li className="whitespace-pre-wrap break-words">{test.bonus_features}</li>
                                    )}
                                </ul>
                            </div>
                        )}

                        {/* Disqualifying Factors */}
                        {test.disqualifying_factors && (
                            <div className="p-4 rounded-lg border bg-card">
                                <p className="text-xs font-bold text-foreground mb-2">Disqualifying Factors</p>
                                <ul className="list-disc list-inside space-y-1 text-sm text-foreground">
                                    {Array.isArray(test.disqualifying_factors) ? (
                                        test.disqualifying_factors.map((factor: string, idx: number) => (
                                            <li key={idx} className="break-words">{factor}</li>
                                        ))
                                    ) : (
                                        <li className="whitespace-pre-wrap break-words">{test.disqualifying_factors}</li>
                                    )}
                                </ul>
                            </div>
                        )}

                        {/* Evaluation Focus */}
                        {test.evaluation_focus && (
                            <div className="p-4 rounded-lg border bg-card">
                                <p className="text-xs font-bold text-foreground mb-2">Evaluation Focus</p>
                                {typeof test.evaluation_focus === 'object' ? (
                                    <div className="space-y-2 text-sm text-foreground">
                                        {Object.entries(test.evaluation_focus).map(([key, value]: [string, any]) => (
                                            <div key={key} className="flex justify-between">
                                                <span className="font-medium capitalize">{key.replace(/_/g, ' ')}:</span>
                                                <span>{value}</span>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-sm text-foreground whitespace-pre-wrap break-words">{String(test.evaluation_focus)}</p>
                                )}
                            </div>
                        )}

                        {/* Task Notes */}
                        {test.task_notes && (
                            <div className="p-4 rounded-lg border bg-card">
                                <p className="text-xs font-bold text-foreground mb-2">Task Notes</p>
                                <p className="text-sm text-foreground whitespace-pre-wrap break-words">{test.task_notes}</p>
                            </div>
                        )}
                    </div>

                    {/* Scores */}
                    {test.status === "completed" && (
                        <>
                            <Separator />
                            <div>
                                <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                                    <Award className="h-5 w-5" />
                                    Assessment Scores
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="p-4 rounded-lg border-2 bg-gradient-to-br from-primary/10 to-primary/5 dark:from-primary/20 dark:to-primary/10 border-primary/30 dark:border-primary/40">
                                        <ScoreDisplay
                                            label="Overall Score"
                                            score={test.overall_score}
                                            size="lg"
                                            showBar={true}
                                        />
                                        {test.passing_score && (
                                            <p className="text-xs text-foreground/80 font-medium mt-2">
                                                Passing Score: {test.passing_score}%
                                            </p>
                                        )}
                                    </div>
                                    {test.code_quality_score !== null && (
                                        <div className="p-4 rounded-lg border bg-card">
                                            <ScoreDisplay
                                                label="Code Quality"
                                                score={test.code_quality_score}
                                                size="md"
                                                showBar={true}
                                            />
                                        </div>
                                    )}
                                    {test.correctness_score !== null && (
                                        <div className="p-4 rounded-lg border bg-card">
                                            <ScoreDisplay
                                                label="Correctness"
                                                score={test.correctness_score}
                                                size="md"
                                                showBar={true}
                                            />
                                        </div>
                                    )}
                                    {test.approach_score !== null && (
                                        <div className="p-4 rounded-lg border bg-card">
                                            <ScoreDisplay
                                                label="Approach"
                                                score={test.approach_score}
                                                size="md"
                                                showBar={true}
                                            />
                                        </div>
                                    )}
                                    {test.communication_score !== null && (
                                        <div className="p-4 rounded-lg border bg-card">
                                            <ScoreDisplay
                                                label="Communication"
                                                score={test.communication_score}
                                                size="md"
                                                showBar={true}
                                            />
                                        </div>
                                    )}
                                </div>
                            </div>
                        </>
                    )}

                    {/* Recommendation */}
                    {test.recommendation && (
                        <>
                            <Separator />
                            <div className="space-y-3">
                                <h3 className="text-lg font-bold flex items-center gap-2">
                                    <TrendingUp className="h-5 w-5 flex-shrink-0" />
                                    Recommendation
                                </h3>
                                <div className="p-4 rounded-lg border bg-card">
                                    <p className="text-sm font-medium text-foreground whitespace-pre-wrap break-words leading-relaxed">
                                        {test.recommendation}
                                    </p>
                                </div>
                            </div>
                        </>
                    )}

                    {/* Feedback */}
                    {test.feedback && (
                        <>
                            <Separator />
                            <div className="space-y-3">
                                <h3 className="text-lg font-bold flex items-center gap-2">
                                    <FileText className="h-5 w-5 flex-shrink-0" />
                                    Detailed Feedback
                                </h3>
                                <div className="p-4 rounded-lg border bg-card">
                                    <p className="text-sm font-medium text-foreground whitespace-pre-wrap break-words leading-relaxed">
                                        {test.feedback}
                                    </p>
                                </div>
                            </div>
                        </>
                    )}

                    {/* Submission Details */}
                    {(test.submission_url || test.submission_code || test.submitted_at) && (
                        <>
                            <Separator />
                            <div className="space-y-3">
                                <h3 className="text-lg font-bold flex items-center gap-2">
                                    <FileCode className="h-5 w-5 flex-shrink-0" />
                                    Submission Details
                                </h3>
                                
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {test.submitted_at && (
                                        <div className="p-3 rounded-lg border bg-card">
                                            <p className="text-xs text-foreground/80 font-semibold mb-1">Submitted At</p>
                                            <p className="text-sm font-semibold text-foreground">
                                                {format(new Date(test.submitted_at), 'PPp')}
                                            </p>
                                        </div>
                                    )}
                                    {test.video_duration_seconds && (
                                        <div className="p-3 rounded-lg border bg-card">
                                            <p className="text-xs text-foreground/80 font-semibold mb-1">Video Duration</p>
                                            <p className="text-sm font-semibold text-foreground">
                                                {Math.floor(test.video_duration_seconds / 60)}:{(test.video_duration_seconds % 60).toString().padStart(2, '0')}
                                            </p>
                                        </div>
                                    )}
                                    {test.screen_resolution && (
                                        <div className="p-3 rounded-lg border bg-card">
                                            <p className="text-xs text-foreground/80 font-semibold mb-1">Screen Resolution</p>
                                            <p className="text-sm font-semibold text-foreground">{test.screen_resolution}</p>
                                        </div>
                                    )}
                                    {test.tools_used && (
                                        <div className="p-3 rounded-lg border bg-card">
                                            <p className="text-xs text-foreground/80 font-semibold mb-1">Tools Used</p>
                                            <p className="text-sm font-semibold text-foreground">{test.tools_used}</p>
                                        </div>
                                    )}
                                    {test.screen_recording_saved !== undefined && (
                                        <div className="p-3 rounded-lg border bg-card">
                                            <p className="text-xs text-foreground/80 font-semibold mb-1">Screen Recording</p>
                                            <Badge className={test.screen_recording_saved ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}>
                                                {test.screen_recording_saved ? "Saved" : "Not Saved"}
                                            </Badge>
                                        </div>
                                    )}
                                </div>

                                {test.submission_code && (
                                    <div className="p-4 rounded-lg border bg-card">
                                        <p className="text-xs font-bold text-foreground mb-2">Submission Code</p>
                                        <pre className="text-xs overflow-x-auto bg-muted/50 p-3 rounded border">
                                            <code className="text-foreground">{test.submission_code}</code>
                                        </pre>
                                    </div>
                                )}
                            </div>
                        </>
                    )}

                    {/* Code Solution */}
                    {(test.code_solution || test.code_url) && (
                        <>
                            <Separator />
                            <div>
                                <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                                    <Code2 className="h-5 w-5" />
                                    Code Solution
                                </h3>
                                <div className="space-y-3">
                                    {test.code_url && (
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            asChild
                                            className="w-full"
                                        >
                                            <a href={test.code_url} target="_blank" rel="noopener noreferrer">
                                                <ExternalLink className="h-4 w-4 mr-2" />
                                                View Code Repository
                                            </a>
                                        </Button>
                                    )}
                                    {test.code_solution && (
                                        <div className="p-4 rounded-lg border bg-card">
                                            <pre className="text-xs overflow-x-auto">
                                                <code className="text-foreground/90 font-medium">
                                                    {test.code_solution}
                                                </code>
                                            </pre>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </>
                    )}

                    {/* AI Analysis */}
                    {test.ai_analysis && (
                        <>
                            <Separator />
                            <div className="space-y-3">
                                <h3 className="text-lg font-bold flex items-center gap-2">
                                    <TrendingUp className="h-5 w-5 flex-shrink-0" />
                                    AI Analysis
                                </h3>
                                <div className="p-4 rounded-lg border bg-card space-y-3">
                                    {typeof test.ai_analysis === 'object' && test.ai_analysis !== null ? (
                                        <>
                                            {test.ai_analysis.errors && Array.isArray(test.ai_analysis.errors) && test.ai_analysis.errors.length > 0 && (
                                                <div>
                                                    <p className="text-xs font-bold text-foreground mb-2">Errors Identified</p>
                                                    <ul className="list-disc list-inside space-y-1 text-sm text-red-600">
                                                        {test.ai_analysis.errors.map((error: string, idx: number) => (
                                                            <li key={idx} className="break-words">{error}</li>
                                                        ))}
                                                    </ul>
                                                </div>
                                            )}
                                            {test.ai_analysis.explanation && (
                                                <div>
                                                    <p className="text-xs font-bold text-foreground mb-2">Explanation</p>
                                                    <p className="text-sm text-foreground whitespace-pre-wrap break-words">
                                                        {test.ai_analysis.explanation}
                                                    </p>
                                                </div>
                                            )}
                                            {test.ai_analysis.classification && (
                                                <div>
                                                    <p className="text-xs font-bold text-foreground mb-1">Classification</p>
                                                    <Badge variant="outline" className="capitalize">
                                                        {test.ai_analysis.classification}
                                                    </Badge>
                                                </div>
                                            )}
                                            {test.ai_analysis.accuracy_rating !== undefined && (
                                                <div>
                                                    <p className="text-xs font-bold text-foreground mb-1">Accuracy Rating</p>
                                                    <p className="text-sm font-semibold text-foreground">{test.ai_analysis.accuracy_rating}%</p>
                                                </div>
                                            )}
                                        </>
                                    ) : (
                                        <p className="text-sm text-foreground whitespace-pre-wrap break-words">
                                            {String(test.ai_analysis)}
                                        </p>
                                    )}
                                </div>
                            </div>
                        </>
                    )}

                    {/* Code Review */}
                    {test.code_review && (
                        <>
                            <Separator />
                            <div className="space-y-3">
                                <h3 className="text-lg font-bold flex items-center gap-2">
                                    <FileCode className="h-5 w-5 flex-shrink-0" />
                                    Code Review
                                </h3>
                                <div className="p-4 rounded-lg border bg-card">
                                    <p className="text-sm font-medium text-foreground whitespace-pre-wrap break-words leading-relaxed">
                                        {test.code_review}
                                    </p>
                                </div>
                            </div>
                        </>
                    )}

                    {/* Video Recording / Submission */}
                    {(test.recording_url || test.submission_url) && (
                        <>
                            <Separator />
                            <div className="space-y-3">
                                <h3 className="text-lg font-bold flex items-center gap-2">
                                    <Video className="h-5 w-5 flex-shrink-0" />
                                    {test.submission_url ? 'Test Submission Video' : 'Recording'}
                                </h3>
                                <div className="p-4 rounded-lg border bg-card">
                                    <div className="flex items-center justify-between gap-4 mb-4">
                                        <div className="flex items-center gap-3 flex-1 min-w-0">
                                            <div className="p-2 rounded-lg bg-primary/10">
                                                <Video className="h-5 w-5 text-primary" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-semibold text-foreground">
                                                    {test.submission_url ? 'Practical Test Submission' : 'Test Recording'}
                                                </p>
                                                <p className="text-xs text-foreground/80 font-medium truncate">
                                                    {test.submission_url ? 'Screen recording of practical test solution' : 'Recording of test session'}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex gap-2 flex-shrink-0">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => window.open(test.submission_url || test.recording_url || '', '_blank')}
                                                className="gap-2 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-primary focus-visible:ring-offset-background"
                                            >
                                                <Play className="h-4 w-4" />
                                                Play
                                            </Button>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => {
                                                    const url = test.submission_url || test.recording_url || '';
                                                    const link = document.createElement('a');
                                                    link.href = url;
                                                    link.download = `technical-test-${test.candidate_name}-${test.id}.${url.includes('.webm') ? 'webm' : 'mp4'}`;
                                                    link.click();
                                                }}
                                                className="gap-2 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-primary focus-visible:ring-offset-background"
                                            >
                                                <ExternalLink className="h-4 w-4" />
                                                Open
                                            </Button>
                                        </div>
                                    </div>
                                    <div className="rounded-lg overflow-hidden border bg-muted/30">
                                        <video
                                            src={test.submission_url || test.recording_url || ''}
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

                    {/* Timestamps */}
                    <Separator />
                    <div className="space-y-3">
                        <h3 className="text-lg font-bold flex items-center gap-2">
                            <Calendar className="h-5 w-5 flex-shrink-0" />
                            Timeline & Metadata
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {test.scheduled_at && (
                                <div className="p-3 rounded-lg border bg-card">
                                    <p className="text-xs text-foreground/80 font-semibold mb-1">Scheduled</p>
                                    <p className="text-sm font-semibold text-foreground flex items-center gap-2">
                                        <Calendar className="h-4 w-4 flex-shrink-0" />
                                        <span className="break-words">{format(new Date(test.scheduled_at), 'PPp')}</span>
                                    </p>
                                </div>
                            )}
                            {test.started_at && (
                                <div className="p-3 rounded-lg border bg-card">
                                    <p className="text-xs text-foreground/80 font-semibold mb-1">Started</p>
                                    <p className="text-sm font-semibold text-foreground flex items-center gap-2">
                                        <Clock className="h-4 w-4 flex-shrink-0" />
                                        <span className="break-words">{format(new Date(test.started_at), 'PPp')}</span>
                                    </p>
                                </div>
                            )}
                            {test.completed_at && (
                                <div className="p-3 rounded-lg border bg-card">
                                    <p className="text-xs text-foreground/80 font-semibold mb-1">Completed</p>
                                    <p className="text-sm font-semibold text-foreground flex items-center gap-2">
                                        <CheckCircle className="h-4 w-4 flex-shrink-0" />
                                        <span className="break-words">{format(new Date(test.completed_at), 'PPp')}</span>
                                    </p>
                                </div>
                            )}
                            {(test.duration_minutes || test.time_taken) && (
                                <div className="p-3 rounded-lg border bg-card">
                                    <p className="text-xs text-foreground/80 font-semibold mb-1">Duration</p>
                                    <p className="text-sm font-semibold text-foreground">
                                        {test.duration_minutes || test.time_taken || (test.started_at && test.completed_at 
                                            ? `${Math.round((new Date(test.completed_at).getTime() - new Date(test.started_at).getTime()) / 60000)} minutes`
                                            : 'N/A')}
                                    </p>
                                </div>
                            )}
                            <div className="p-3 rounded-lg border bg-card">
                                <p className="text-xs text-foreground/80 font-semibold mb-1">Created</p>
                                <p className="text-sm font-semibold text-foreground break-words">
                                    {format(new Date(test.created_at), 'PPp')}
                                </p>
                            </div>
                            {test.updated_at && (
                                <div className="p-3 rounded-lg border bg-card">
                                    <p className="text-xs text-foreground/80 font-semibold mb-1">Last Updated</p>
                                    <p className="text-sm font-semibold text-foreground break-words">
                                        {format(new Date(test.updated_at), 'PPp')}
                                    </p>
                                </div>
                            )}
                            {test.reviewed_at && (
                                <div className="p-3 rounded-lg border bg-card">
                                    <p className="text-xs text-foreground/80 font-semibold mb-1">Reviewed At</p>
                                    <p className="text-sm font-semibold text-foreground break-words">
                                        {format(new Date(test.reviewed_at), 'PPp')}
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </DialogContent>
            
            {/* Schedule Meeting Dialog */}
            <ScheduleMeetingDialog
                candidate={{
                    id: test.candidate_id,
                    name: test.candidate_name,
                    email: test.candidate_email,
                    phone: undefined,
                    cv_file_url: undefined,
                    ai_score: test.overall_score || undefined,
                    job_id: test.job_id,
                    source: 'technical',
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

