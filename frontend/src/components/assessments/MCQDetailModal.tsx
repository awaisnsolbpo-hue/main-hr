import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
    User,
    Mail,
    Briefcase,
    Calendar,
    CheckCircle,
    XCircle,
    Clock,
    FileText,
    Award,
    TrendingUp,
    Video,
    ExternalLink,
    Play,
    CalendarPlus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { formatPercentage } from "@/lib/numberFormat";
import ScheduleMeetingDialog from "@/components/ScheduleMeetingDialog";

interface MCQTest {
    id: string;
    candidate_id: string;
    candidate_name: string;
    candidate_email: string;
    job_id: string;
    job_title: string | null;
    status: string;
    score: number | null;
    percentage: number | null;
    total_questions: number;
    attempted_questions: number;
    correct_answers: number;
    wrong_answers?: number;
    passed: boolean | null;
    passing_score?: number | null;
    completed_at: string | null;
    started_at: string | null;
    created_at: string;
    time_taken?: number | null; // in minutes
    questions?: any[]; // Array of questions with answers
    answers?: any; // JSONB field with detailed answers
    screen_recording_url?: string | null; // Screen recording URL
}

interface MCQDetailModalProps {
    test: MCQTest | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export const MCQDetailModal = ({ test, open, onOpenChange }: MCQDetailModalProps) => {
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

    const getStatusBadge = (status: string, passed: boolean | null) => {
        if (status === "completed") {
            return passed ? (
                <Badge className="bg-green-100 text-green-800 border-green-200">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Passed
                </Badge>
            ) : (
                <Badge variant="destructive">
                    <XCircle className="h-3 w-3 mr-1" />
                    Failed
                </Badge>
            );
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
        if (!score) return "text-muted-foreground";
        if (score >= 80) return "text-green-600";
        if (score >= 60) return "text-yellow-600";
        return "text-red-600";
    };

    const wrongAnswers = test.wrong_answers || (test.total_questions - (test.correct_answers || 0));
    const accuracy = test.attempted_questions > 0 
        ? Number(formatPercentage((test.correct_answers / test.attempted_questions) * 100).replace('%', ''))
        : 0;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto bg-card border border-border/60 shadow-xl">
                <DialogHeader className="pb-4">
                    <div className="flex items-start gap-4">
                        <Avatar className="h-16 w-16 flex-shrink-0">
                            <AvatarFallback className="bg-gradient-to-br from-yellow-500 to-amber-500 text-primary-foreground text-xl">
                                {getInitials(test.candidate_name)}
                            </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                            <DialogTitle className="text-2xl font-bold mb-2 break-words">MCQ Test Results</DialogTitle>
                            <DialogDescription className="text-base font-medium text-foreground/80 break-words">
                                {test.candidate_name} • {test.candidate_email}
                            </DialogDescription>
                        </div>
                        <div className="flex-shrink-0">
                            {getStatusBadge(test.status, test.passed)}
                        </div>
                    </div>
                </DialogHeader>

                <div className="space-y-6 mt-4">
                    {/* Key Performance Metrics */}
                    <div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {/* Overall Score - Main Focus */}
                            <div className="md:col-span-2 p-6 rounded-xl border-2 bg-gradient-to-br from-blue-50 to-blue-100 border-blue-300 shadow-sm">
                                <div className="flex items-center justify-between mb-2">
                                    <p className="text-sm font-medium text-blue-900">Overall Score</p>
                                    {test.passing_score && (
                                        <Badge variant="outline" className="text-xs bg-white/50">
                                            Passing: {test.passing_score}%
                                        </Badge>
                                    )}
                                </div>
                                <p className={`text-5xl font-bold ${getScoreColor(test.percentage)} mb-2`}>
                                    {test.percentage !== null ? `${Number(test.percentage).toFixed(2)}%` : "--"}
                                </p>
                                <div className="flex items-center gap-4 mt-3 text-sm">
                                    <span className="text-green-700 font-semibold">
                                        ✓ {test.correct_answers} Correct
                                    </span>
                                    <span className="text-red-700 font-semibold">
                                        ✗ {wrongAnswers} Wrong
                                    </span>
                                </div>
                            </div>

                            {/* Quick Stats */}
                            <div className="space-y-3">
                                <div className="p-4 rounded-lg border bg-card">
                                    <p className="text-xs text-foreground/80 font-semibold mb-1">Questions</p>
                                    <p className="text-2xl font-bold text-foreground">
                                        {test.attempted_questions}/{test.total_questions}
                                    </p>
                                    <p className="text-xs text-muted-foreground mt-1">
                                        {test.total_questions > 0 
                                            ? formatPercentage((test.attempted_questions / test.total_questions) * 100)
                                            : '0%'} completed
                                    </p>
                                </div>
                                {test.time_taken && (
                                    <div className="p-4 rounded-lg border bg-card">
                                        <p className="text-xs text-foreground/80 font-semibold mb-1">Time Taken</p>
                                        <p className="text-2xl font-bold text-foreground">
                                            {test.time_taken}
                                        </p>
                                        <p className="text-xs text-foreground/80 font-medium mt-1">minutes</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    <Separator />

                    {/* Candidate & Job Info - Compact */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="p-4 rounded-lg border bg-card">
                            <p className="text-xs text-foreground/80 font-semibold mb-1">Candidate</p>
                            <p className="text-sm font-semibold text-foreground break-words">{test.candidate_name}</p>
                            <a href={`mailto:${test.candidate_email}`} className="text-xs text-primary hover:underline break-all">
                                {test.candidate_email}
                            </a>
                        </div>
                        {test.job_title && (
                            <div className="p-4 rounded-lg border bg-card">
                                <p className="text-xs text-foreground/80 font-semibold mb-1">Job Position</p>
                                <p className="text-sm font-semibold text-foreground break-words">{test.job_title}</p>
                            </div>
                        )}
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

                    {/* Screen Recording */}
                    {test.screen_recording_url && (
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
                                                <p className="text-sm font-semibold text-foreground">Test Recording</p>
                                                <p className="text-xs text-muted-foreground truncate">
                                                    Screen recording of MCQ test session
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex gap-2 flex-shrink-0">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => window.open(test.screen_recording_url!, '_blank')}
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
                                                    link.href = test.screen_recording_url!;
                                                    link.download = `mcq-recording-${test.candidate_name}-${test.id}.webm`;
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
                                            src={test.screen_recording_url}
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

                    {/* Test Timeline */}
                    {(test.started_at || test.completed_at) && (
                        <>
                            <Separator />
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {test.started_at && (
                                    <div className="p-3 rounded-lg border bg-card">
                                        <p className="text-xs text-muted-foreground mb-1 flex items-center gap-2">
                                            <Clock className="h-3 w-3" />
                                            Started
                                        </p>
                                        <p className="text-sm font-semibold text-foreground">
                                            {format(new Date(test.started_at), 'PPp')}
                                        </p>
                                    </div>
                                )}
                                {test.completed_at && (
                                    <div className="p-3 rounded-lg border bg-card">
                                        <p className="text-xs text-muted-foreground mb-1 flex items-center gap-2">
                                            <CheckCircle className="h-3 w-3" />
                                            Completed
                                        </p>
                                        <p className="text-sm font-semibold text-foreground">
                                            {format(new Date(test.completed_at), 'PPp')}
                                        </p>
                                    </div>
                                )}
                            </div>
                        </>
                    )}

                    {/* Questions & Answers Detail */}
                    {(test.questions && test.questions.length > 0) || test.answers ? (
                        <>
                            <Separator />
                            <div className="space-y-4">
                                <h3 className="text-lg font-bold flex items-center gap-2">
                                    <FileText className="h-5 w-5 flex-shrink-0" />
                                    Questions & Answers
                                </h3>
                                
                                {/* Calendar-style Question Grid */}
                                {test.questions && test.questions.length > 0 && (
                                    <div className="p-4 rounded-lg border bg-card">
                                        <p className="text-sm font-semibold text-muted-foreground mb-3">
                                            Question Overview
                                        </p>
                                        <div className="grid grid-cols-5 sm:grid-cols-10 md:grid-cols-10 lg:grid-cols-10 gap-2">
                                            {test.questions.map((question: any, index: number) => {
                                                const questionId = question.id;
                                                const candidateAnswer = test.answers && test.answers[questionId] 
                                                    ? test.answers[questionId] 
                                                    : null;
                                                const correctAnswer = question.correct_answer;
                                                const isCorrect = candidateAnswer === correctAnswer;
                                                const isAnswered = candidateAnswer !== null && candidateAnswer !== undefined;
                                                
                                                return (
                                                    <div
                                                        key={question.id || index}
                                                        className={`
                                                            aspect-square flex items-center justify-center rounded-lg border-2 font-bold text-sm transition-all
                                                            ${!isAnswered
                                                                ? 'bg-gray-100 border-gray-300 text-gray-600'
                                                                : isCorrect
                                                                ? 'bg-green-500 border-green-600 text-white shadow-md hover:bg-green-600'
                                                                : 'bg-red-500 border-red-600 text-white shadow-md hover:bg-red-600'
                                                            }
                                                        `}
                                                        title={`Question ${index + 1}: ${isAnswered ? (isCorrect ? 'Correct' : 'Incorrect') : 'Not Answered'}`}
                                                    >
                                                        {index + 1}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                        <div className="flex items-center gap-4 mt-4 text-xs">
                                            <div className="flex items-center gap-2">
                                                <div className="w-4 h-4 rounded bg-green-500 border-2 border-green-600"></div>
                                                <span className="text-muted-foreground">Correct</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <div className="w-4 h-4 rounded bg-red-500 border-2 border-red-600"></div>
                                                <span className="text-muted-foreground">Incorrect</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <div className="w-4 h-4 rounded bg-gray-100 border-2 border-gray-300"></div>
                                                <span className="text-muted-foreground">Not Answered</span>
                                            </div>
                                        </div>
                                    </div>
                                )}
                                
                                {test.questions && test.questions.length > 0 ? (
                                    <div className="space-y-4">
                                        {test.questions.map((question: any, index: number) => {
                                            // Get candidate's answer from the answers object using question ID
                                            const questionId = question.id;
                                            const candidateAnswer = test.answers && test.answers[questionId] 
                                                ? test.answers[questionId] 
                                                : null;
                                            
                                            // Get correct answer from question object
                                            const correctAnswer = question.correct_answer;
                                            
                                            // Determine if answer is correct
                                            const isCorrect = candidateAnswer === correctAnswer;
                                            
                                            // Check if question was answered
                                            const isAnswered = candidateAnswer !== null && candidateAnswer !== undefined;
                                            
                                            return (
                                                <div 
                                                    key={question.id || index} 
                                                    className={`p-4 rounded-lg border-2 ${
                                                        !isAnswered
                                                            ? 'bg-gray-50 border-gray-200'
                                                            : isCorrect 
                                                            ? 'bg-green-50 border-green-200' 
                                                            : 'bg-red-50 border-red-200'
                                                    }`}
                                                >
                                                    <div className="flex items-start justify-between mb-3">
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-sm font-bold text-muted-foreground">
                                                                Q{index + 1} ({question.id})
                                                            </span>
                                                            {!isAnswered ? (
                                                                <Badge variant="outline" className="bg-gray-100 text-gray-800 border-gray-200">
                                                                    <Clock className="h-3 w-3 mr-1" />
                                                                    Not Answered
                                                                </Badge>
                                                            ) : isCorrect ? (
                                                                <Badge className="bg-green-100 text-green-800 border-green-200">
                                                                    <CheckCircle className="h-3 w-3 mr-1" />
                                                                    Correct
                                                                </Badge>
                                                            ) : (
                                                                <Badge variant="destructive">
                                                                    <XCircle className="h-3 w-3 mr-1" />
                                                                    Incorrect
                                                                </Badge>
                                                            )}
                                                        </div>
                                                        {question.category && (
                                                            <Badge variant="outline" className="text-xs">
                                                                {question.category}
                                                            </Badge>
                                                        )}
                                                    </div>
                                                    
                                                    <div className="space-y-3">
                                                        <div>
                                                            <p className="text-sm font-semibold text-foreground mb-2">
                                                                {question.question}
                                                            </p>
                                                            {question.difficulty && (
                                                                <Badge variant="outline" className="text-xs mb-2">
                                                                    Difficulty: {question.difficulty}
                                                                </Badge>
                                                            )}
                                                        </div>
                                                        
                                                        {question.options && typeof question.options === 'object' && !Array.isArray(question.options) ? (
                                                            <div className="space-y-2">
                                                                <p className="text-xs font-semibold text-muted-foreground mb-2">Options:</p>
                                                                <div className="grid grid-cols-1 gap-2">
                                                                    {Object.entries(question.options).map(([key, value]: [string, any]) => {
                                                                        const isSelected = candidateAnswer === key;
                                                                        const isCorrectOption = correctAnswer === key;
                                                                        
                                                                        return (
                                                                            <div 
                                                                                key={key}
                                                                                className={`p-2 rounded border ${
                                                                                    isCorrectOption 
                                                                                        ? 'bg-green-100 border-green-300' 
                                                                                        : isSelected 
                                                                                        ? 'bg-red-100 border-red-300'
                                                                                        : 'bg-muted/50 border-border'
                                                                                }`}
                                                                            >
                                                                                <div className="flex items-center gap-2">
                                                                                    <span className="text-xs font-bold">{key}.</span>
                                                                                    <span className="text-sm flex-1">{value}</span>
                                                                                    {isCorrectOption && (
                                                                                        <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
                                                                                    )}
                                                                                    {isSelected && !isCorrectOption && (
                                                                                        <XCircle className="h-4 w-4 text-red-600 flex-shrink-0" />
                                                                                    )}
                                                                                </div>
                                                                            </div>
                                                                        );
                                                                    })}
                                                                </div>
                                                            </div>
                                                        ) : null}
                                                        
                                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2 border-t">
                                                            <div>
                                                                <p className="text-xs font-semibold text-muted-foreground mb-1">Candidate's Answer:</p>
                                                                <p className={`text-sm font-medium ${
                                                                    !isAnswered 
                                                                        ? 'text-gray-600' 
                                                                        : isCorrect 
                                                                        ? 'text-green-700' 
                                                                        : 'text-red-700'
                                                                }`}>
                                                                    {!isAnswered 
                                                                        ? 'Not answered' 
                                                                        : candidateAnswer 
                                                                            ? `${candidateAnswer}. ${question.options?.[candidateAnswer] || candidateAnswer}`
                                                                            : 'N/A'
                                                                    }
                                                                </p>
                                                            </div>
                                                            <div>
                                                                <p className="text-xs font-semibold text-muted-foreground mb-1">Correct Answer:</p>
                                                                <p className="text-sm font-medium text-green-700">
                                                                    {correctAnswer 
                                                                        ? `${correctAnswer}. ${question.options?.[correctAnswer] || correctAnswer}`
                                                                        : 'N/A'
                                                                    }
                                                                </p>
                                                            </div>
                                                        </div>
                                                        
                                                        {question.explanation && (
                                                            <div className="pt-2 border-t">
                                                                <p className="text-xs font-semibold text-muted-foreground mb-1">Explanation:</p>
                                                                <p className="text-xs text-foreground bg-muted/30 p-2 rounded">
                                                                    {question.explanation}
                                                                </p>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                ) : test.answers ? (
                                    <div className="p-4 rounded-lg border bg-card">
                                        <p className="text-sm text-muted-foreground mb-2">Answer Details:</p>
                                        <pre className="text-xs overflow-x-auto p-3 bg-muted/50 rounded border">
                                            {JSON.stringify(test.answers, null, 2)}
                                        </pre>
                                    </div>
                                ) : null}
                            </div>
                        </>
                    ) : null}
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
                    ai_score: test.percentage || undefined,
                    job_id: test.job_id,
                    source: 'mcq',
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

