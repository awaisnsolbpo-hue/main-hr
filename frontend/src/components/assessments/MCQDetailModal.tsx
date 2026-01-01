import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    Calendar,
    CheckCircle,
    XCircle,
    Clock,
    Video,
    ExternalLink,
    Play,
    CalendarPlus,
} from "lucide-react";
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
    time_taken?: number | null;
    questions?: any[];
    answers?: any;
    screen_recording_url?: string | null;
}

interface MCQDetailModalProps {
    test: MCQTest | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export const MCQDetailModal = ({ test, open, onOpenChange }: MCQDetailModalProps) => {
    const [scheduleMeetingOpen, setScheduleMeetingOpen] = useState(false);
    
    if (!test) return null;

    const getStatusBadge = (status: string, passed: boolean | null) => {
        if (status === "completed") {
            return passed 
                ? <Badge className="bg-green-600">Passed</Badge>
                : <Badge variant="destructive">Failed</Badge>;
        }
        if (status === "in_progress") {
            return <Badge className="bg-amber-600">In Progress</Badge>;
        }
        return <Badge variant="secondary">Scheduled</Badge>;
    };

    const getScoreColor = (score: number | null) => {
        if (!score) return "";
        if (score >= 80) return "text-green-600";
        if (score >= 60) return "text-amber-600";
        return "text-red-600";
    };

    const wrongAnswers = test.wrong_answers || (test.total_questions - (test.correct_answers || 0));

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
                <DialogHeader>
                    <div className="flex items-center justify-between gap-4">
                        <div>
                            <DialogTitle className="text-xl">MCQ Test Results</DialogTitle>
                            <p className="text-sm text-muted-foreground mt-1">
                                {test.candidate_name} • {test.candidate_email}
                            </p>
                        </div>
                        {getStatusBadge(test.status, test.passed)}
                    </div>
                </DialogHeader>

                <div className="space-y-6 mt-4">
                    {/* Score Summary */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="p-4 bg-primary/10 rounded-lg col-span-2">
                            <div className="flex items-center justify-between mb-2">
                                <p className="text-sm font-medium">Overall Score</p>
                                {test.passing_score && (
                                    <Badge variant="outline" className="text-xs">Pass: {test.passing_score}%</Badge>
                                )}
                            </div>
                            <p className={`text-4xl font-bold ${getScoreColor(test.percentage)}`}>
                                {test.percentage !== null ? `${Number(test.percentage).toFixed(0)}%` : "--"}
                            </p>
                            <div className="flex gap-4 mt-2 text-sm">
                                <span className="text-green-600">✓ {test.correct_answers} correct</span>
                                <span className="text-red-600">✗ {wrongAnswers} wrong</span>
                            </div>
                        </div>
                        <div className="p-4 bg-muted/30 rounded-lg">
                            <p className="text-xs text-muted-foreground">Questions</p>
                            <p className="text-2xl font-bold">{test.attempted_questions}/{test.total_questions}</p>
                            <p className="text-xs text-muted-foreground mt-1">
                                {test.total_questions > 0 
                                    ? formatPercentage((test.attempted_questions / test.total_questions) * 100)
                                    : '0%'} completed
                            </p>
                        </div>
                        {test.time_taken && (
                            <div className="p-4 bg-muted/30 rounded-lg">
                                <p className="text-xs text-muted-foreground">Time Taken</p>
                                <p className="text-2xl font-bold">{test.time_taken}</p>
                                <p className="text-xs text-muted-foreground mt-1">minutes</p>
                            </div>
                        )}
                    </div>

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

                    {/* Screen Recording */}
                    {test.screen_recording_url && (
                        <div className="space-y-2">
                            <p className="text-sm font-medium flex items-center gap-2">
                                <Video className="h-4 w-4" />
                                Screen Recording
                            </p>
                            <div className="p-3 bg-muted/30 rounded-lg space-y-3">
                                <div className="flex gap-2">
                                    <Button variant="outline" size="sm" onClick={() => window.open(test.screen_recording_url!, '_blank')}>
                                        <Play className="h-4 w-4 mr-2" />Play
                                    </Button>
                                    <Button variant="outline" size="sm" onClick={() => window.open(test.screen_recording_url!, '_blank')}>
                                        <ExternalLink className="h-4 w-4 mr-2" />Open
                                    </Button>
                                </div>
                                <video src={test.screen_recording_url} controls className="w-full max-h-[300px] rounded" preload="metadata" />
                            </div>
                        </div>
                    )}

                    {/* Timeline */}
                    {(test.started_at || test.completed_at) && (
                        <div className="grid grid-cols-2 gap-4">
                            {test.started_at && (
                                <div className="p-3 bg-muted/30 rounded-lg">
                                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                                        <Clock className="h-3 w-3" />Started
                                    </p>
                                    <p className="text-sm">{format(new Date(test.started_at), 'PP p')}</p>
                                </div>
                            )}
                            {test.completed_at && (
                                <div className="p-3 bg-muted/30 rounded-lg">
                                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                                        <CheckCircle className="h-3 w-3" />Completed
                                    </p>
                                    <p className="text-sm">{format(new Date(test.completed_at), 'PP p')}</p>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Questions Overview & Details */}
                    {test.questions && test.questions.length > 0 && (
                        <div className="space-y-4">
                            <p className="text-sm font-medium">Questions & Answers</p>
                            
                            {/* Question Grid Overview */}
                            <div className="p-4 bg-muted/30 rounded-lg">
                                <p className="text-xs text-muted-foreground mb-3">Quick Overview</p>
                                <div className="grid grid-cols-10 gap-2">
                                    {test.questions.map((question: any, index: number) => {
                                        const candidateAnswer = test.answers?.[question.id];
                                        const isCorrect = candidateAnswer === question.correct_answer;
                                        const isAnswered = candidateAnswer !== null && candidateAnswer !== undefined;
                                        
                                        return (
                                            <div
                                                key={question.id || index}
                                                className={`aspect-square flex items-center justify-center rounded text-xs font-bold ${
                                                    !isAnswered
                                                        ? 'bg-muted text-muted-foreground'
                                                        : isCorrect
                                                        ? 'bg-green-600 text-white'
                                                        : 'bg-red-600 text-white'
                                                }`}
                                                title={`Q${index + 1}: ${isAnswered ? (isCorrect ? 'Correct' : 'Incorrect') : 'Not Answered'}`}
                                            >
                                                {index + 1}
                                            </div>
                                        );
                                    })}
                                </div>
                                <div className="flex items-center gap-4 mt-3 text-xs">
                                    <div className="flex items-center gap-2">
                                        <div className="w-3 h-3 rounded bg-green-600"></div>
                                        <span>Correct</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="w-3 h-3 rounded bg-red-600"></div>
                                        <span>Incorrect</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="w-3 h-3 rounded bg-muted"></div>
                                        <span>Not Answered</span>
                                    </div>
                                </div>
                            </div>

                            {/* Detailed Questions */}
                            <div className="space-y-3 max-h-96 overflow-y-auto">
                                {test.questions.map((question: any, index: number) => {
                                    const candidateAnswer = test.answers?.[question.id];
                                    const isCorrect = candidateAnswer === question.correct_answer;
                                    const isAnswered = candidateAnswer !== null && candidateAnswer !== undefined;
                                    
                                    return (
                                        <div 
                                            key={question.id || index} 
                                            className={`p-4 rounded-lg border ${
                                                !isAnswered
                                                    ? 'bg-muted/30 border-muted'
                                                    : isCorrect 
                                                    ? 'bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800' 
                                                    : 'bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800'
                                            }`}
                                        >
                                            <div className="flex items-start justify-between mb-2">
                                                <span className="text-xs font-medium text-muted-foreground">Q{index + 1}</span>
                                                {!isAnswered ? (
                                                    <Badge variant="secondary" className="text-xs">Not Answered</Badge>
                                                ) : isCorrect ? (
                                                    <Badge className="bg-green-600 text-xs">Correct</Badge>
                                                ) : (
                                                    <Badge variant="destructive" className="text-xs">Incorrect</Badge>
                                                )}
                                            </div>
                                            
                                            <p className="text-sm font-medium mb-3">{question.question}</p>
                                            
                                            {question.options && typeof question.options === 'object' && (
                                                <div className="space-y-2 mb-3">
                                                    {Object.entries(question.options).map(([key, value]: [string, any]) => {
                                                        const isSelected = candidateAnswer === key;
                                                        const isCorrectOption = question.correct_answer === key;
                                                        
                                                        return (
                                                            <div 
                                                                key={key}
                                                                className={`p-2 rounded text-sm flex items-center justify-between ${
                                                                    isCorrectOption 
                                                                        ? 'bg-green-100 dark:bg-green-900/30' 
                                                                        : isSelected 
                                                                        ? 'bg-red-100 dark:bg-red-900/30'
                                                                        : 'bg-muted/50'
                                                                }`}
                                                            >
                                                                <span><strong>{key}.</strong> {value}</span>
                                                                {isCorrectOption && <CheckCircle className="h-4 w-4 text-green-600" />}
                                                                {isSelected && !isCorrectOption && <XCircle className="h-4 w-4 text-red-600" />}
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            )}
                                            
                                            <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t">
                                                <div>
                                                    <span className="text-muted-foreground">Your answer: </span>
                                                    <span className={!isAnswered ? 'text-muted-foreground' : isCorrect ? 'text-green-600' : 'text-red-600'}>
                                                        {!isAnswered ? 'Not answered' : `${candidateAnswer}. ${question.options?.[candidateAnswer] || ''}`}
                                                    </span>
                                                </div>
                                                <div>
                                                    <span className="text-muted-foreground">Correct: </span>
                                                    <span className="text-green-600">
                                                        {question.correct_answer}. {question.options?.[question.correct_answer] || ''}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>
            </DialogContent>
            
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
                onSuccess={() => {}}
            />
        </Dialog>
    );
};
