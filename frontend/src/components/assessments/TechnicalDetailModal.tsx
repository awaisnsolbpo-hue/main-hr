import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScoreDisplay } from "@/components/assessments/ScoreDisplay";
import {
    Mail,
    Calendar,
    Clock,
    FileText,
    Code2,
    ExternalLink,
    Video,
    CalendarPlus,
    Play,
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
    time_taken?: number | null;
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

    const getStatusBadge = (status: string, recommendation: string | null) => {
        if (status === "completed") {
            if (recommendation?.toLowerCase().includes("hire") || recommendation?.toLowerCase().includes("strong")) {
                return <Badge className="bg-green-600">Recommended</Badge>;
            }
            return <Badge variant="secondary">Completed</Badge>;
        }
        if (status === "in_progress") {
            return <Badge className="bg-amber-600">In Progress</Badge>;
        }
        return <Badge variant="outline">Scheduled</Badge>;
    };

    const renderList = (items: string[] | string | null | undefined) => {
        if (!items) return null;
        const list = Array.isArray(items) ? items : [items];
        return (
            <ul className="list-disc list-inside space-y-1 text-sm">
                {list.map((item, idx) => <li key={idx}>{item}</li>)}
            </ul>
        );
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
                <DialogHeader>
                    <div className="flex items-center justify-between gap-4">
                        <div>
                            <DialogTitle className="text-xl">{test.task_title}</DialogTitle>
                            <p className="text-sm text-muted-foreground mt-1">
                                {test.candidate_name} • {test.candidate_email}
                            </p>
                        </div>
                        {getStatusBadge(test.status, test.recommendation)}
                    </div>
                </DialogHeader>

                <div className="space-y-6 mt-4">
                    {/* Candidate Info */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="p-3 bg-muted/30 rounded-lg">
                            <p className="text-xs text-muted-foreground">Candidate</p>
                            <p className="font-medium text-sm">{test.candidate_name}</p>
                            <a href={`mailto:${test.candidate_email}`} className="text-xs text-primary hover:underline">
                                {test.candidate_email}
                            </a>
                        </div>
                        {test.job_title && (
                            <div className="p-3 bg-muted/30 rounded-lg">
                                <p className="text-xs text-muted-foreground">Position</p>
                                <p className="font-medium text-sm">{test.job_title}</p>
                            </div>
                        )}
                    </div>

                    {/* Schedule Meeting Button */}
                    <Button onClick={() => setScheduleMeetingOpen(true)} className="w-full gap-2">
                        <CalendarPlus className="h-4 w-4" />
                        Schedule Meeting
                    </Button>

                    {/* Task Description */}
                    <div className="space-y-2">
                        <p className="text-sm font-medium">Task Description</p>
                        <div className="p-3 bg-muted/30 rounded-lg">
                            <p className="text-sm whitespace-pre-wrap">{test.task_description}</p>
                        </div>
                    </div>

                    {/* Task Requirements */}
                    {test.task_requirements && (
                        <div className="space-y-2">
                            <p className="text-sm font-medium">Requirements</p>
                            <div className="p-3 bg-muted/30 rounded-lg">
                                {renderList(test.task_requirements)}
                            </div>
                        </div>
                    )}

                    {/* Task Metadata */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {test.difficulty && (
                            <div className="p-3 bg-muted/30 rounded-lg">
                                <p className="text-xs text-muted-foreground">Difficulty</p>
                                <Badge variant="outline" className="mt-1 capitalize">{test.difficulty}</Badge>
                            </div>
                        )}
                        {test.time_limit_minutes && (
                            <div className="p-3 bg-muted/30 rounded-lg">
                                <p className="text-xs text-muted-foreground">Time Limit</p>
                                <p className="font-medium text-sm">{test.time_limit_minutes} min</p>
                            </div>
                        )}
                        {test.programming_language && (
                            <div className="p-3 bg-muted/30 rounded-lg">
                                <p className="text-xs text-muted-foreground">Language</p>
                                <p className="font-medium text-sm">{test.programming_language}</p>
                            </div>
                        )}
                        {test.tools_allowed && (
                            <div className="p-3 bg-muted/30 rounded-lg">
                                <p className="text-xs text-muted-foreground">Tools</p>
                                <div className="flex flex-wrap gap-1 mt-1">
                                    {(Array.isArray(test.tools_allowed) ? test.tools_allowed : [test.tools_allowed]).map((tool, idx) => (
                                        <Badge key={idx} variant="secondary" className="text-xs">{tool}</Badge>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Starter Code */}
                    {test.starter_code && (
                        <div className="space-y-2">
                            <p className="text-sm font-medium">Starter Code</p>
                            <pre className="p-3 bg-muted rounded-lg text-xs overflow-x-auto">
                                <code>{test.starter_code}</code>
                            </pre>
                        </div>
                    )}

                    {/* Success Criteria */}
                    {test.success_criteria && (
                        <div className="space-y-2">
                            <p className="text-sm font-medium">Success Criteria</p>
                            <div className="p-3 bg-muted/30 rounded-lg">
                                {renderList(test.success_criteria)}
                            </div>
                        </div>
                    )}

                    {/* Scores */}
                    {test.status === "completed" && (
                        <div className="space-y-3">
                            <p className="text-sm font-medium">Assessment Scores</p>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                <div className="p-4 bg-primary/10 rounded-lg">
                                    <ScoreDisplay label="Overall" score={test.overall_score} size="lg" showBar={true} />
                                </div>
                                {test.code_quality_score !== null && (
                                    <div className="p-3 bg-muted/30 rounded-lg">
                                        <ScoreDisplay label="Code Quality" score={test.code_quality_score} size="md" showBar={true} />
                                    </div>
                                )}
                                {test.correctness_score !== null && (
                                    <div className="p-3 bg-muted/30 rounded-lg">
                                        <ScoreDisplay label="Correctness" score={test.correctness_score} size="md" showBar={true} />
                                    </div>
                                )}
                                {test.approach_score !== null && (
                                    <div className="p-3 bg-muted/30 rounded-lg">
                                        <ScoreDisplay label="Approach" score={test.approach_score} size="md" showBar={true} />
                                    </div>
                                )}
                                {test.communication_score !== null && (
                                    <div className="p-3 bg-muted/30 rounded-lg">
                                        <ScoreDisplay label="Communication" score={test.communication_score} size="md" showBar={true} />
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Recommendation */}
                    {test.recommendation && (
                        <div className="space-y-2">
                            <p className="text-sm font-medium">Recommendation</p>
                            <div className="p-3 bg-muted/30 rounded-lg">
                                <p className="text-sm whitespace-pre-wrap">{test.recommendation}</p>
                            </div>
                        </div>
                    )}

                    {/* Feedback */}
                    {test.feedback && (
                        <div className="space-y-2">
                            <p className="text-sm font-medium">Feedback</p>
                            <div className="p-3 bg-muted/30 rounded-lg">
                                <p className="text-sm whitespace-pre-wrap">{test.feedback}</p>
                            </div>
                        </div>
                    )}

                    {/* Code Solution */}
                    {(test.code_solution || test.code_url) && (
                        <div className="space-y-2">
                            <p className="text-sm font-medium flex items-center gap-2">
                                <Code2 className="h-4 w-4" />
                                Code Solution
                            </p>
                            {test.code_url && (
                                <Button variant="outline" size="sm" asChild className="w-full">
                                    <a href={test.code_url} target="_blank" rel="noopener noreferrer">
                                        <ExternalLink className="h-4 w-4 mr-2" />
                                        View Repository
                                    </a>
                                </Button>
                            )}
                            {test.code_solution && (
                                <pre className="p-3 bg-muted rounded-lg text-xs overflow-x-auto max-h-64">
                                    <code>{test.code_solution}</code>
                                </pre>
                            )}
                        </div>
                    )}

                    {/* Code Review */}
                    {test.code_review && (
                        <div className="space-y-2">
                            <p className="text-sm font-medium">Code Review</p>
                            <div className="p-3 bg-muted/30 rounded-lg">
                                <p className="text-sm whitespace-pre-wrap">{test.code_review}</p>
                            </div>
                        </div>
                    )}

                    {/* Video Recording */}
                    {(test.recording_url || test.submission_url) && (
                        <div className="space-y-2">
                            <p className="text-sm font-medium flex items-center gap-2">
                                <Video className="h-4 w-4" />
                                Recording
                            </p>
                            <div className="p-3 bg-muted/30 rounded-lg space-y-3">
                                <div className="flex gap-2">
                                    <Button variant="outline" size="sm" onClick={() => window.open(test.submission_url || test.recording_url || '', '_blank')}>
                                        <Play className="h-4 w-4 mr-2" />
                                        Play
                                    </Button>
                                    <Button variant="outline" size="sm" onClick={() => window.open(test.submission_url || test.recording_url || '', '_blank')}>
                                        <ExternalLink className="h-4 w-4 mr-2" />
                                        Open
                                    </Button>
                                </div>
                                <video
                                    src={test.submission_url || test.recording_url || ''}
                                    controls
                                    className="w-full max-h-[300px] rounded"
                                    preload="metadata"
                                />
                            </div>
                        </div>
                    )}

                    {/* Timeline */}
                    <div className="space-y-2">
                        <p className="text-sm font-medium flex items-center gap-2">
                            <Calendar className="h-4 w-4" />
                            Timeline
                        </p>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                            {test.scheduled_at && (
                                <div className="p-3 bg-muted/30 rounded-lg">
                                    <p className="text-xs text-muted-foreground">Scheduled</p>
                                    <p className="text-sm">{format(new Date(test.scheduled_at), 'PP')}</p>
                                </div>
                            )}
                            {test.started_at && (
                                <div className="p-3 bg-muted/30 rounded-lg">
                                    <p className="text-xs text-muted-foreground">Started</p>
                                    <p className="text-sm">{format(new Date(test.started_at), 'PP p')}</p>
                                </div>
                            )}
                            {test.completed_at && (
                                <div className="p-3 bg-muted/30 rounded-lg">
                                    <p className="text-xs text-muted-foreground">Completed</p>
                                    <p className="text-sm">{format(new Date(test.completed_at), 'PP p')}</p>
                                </div>
                            )}
                            {(test.duration_minutes || test.time_taken) && (
                                <div className="p-3 bg-muted/30 rounded-lg">
                                    <p className="text-xs text-muted-foreground">Duration</p>
                                    <p className="text-sm">{test.duration_minutes || test.time_taken} min</p>
                                </div>
                            )}
                            <div className="p-3 bg-muted/30 rounded-lg">
                                <p className="text-xs text-muted-foreground">Created</p>
                                <p className="text-sm">{format(new Date(test.created_at), 'PP')}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </DialogContent>
            
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
                onSuccess={() => {}}
            />
        </Dialog>
    );
};
