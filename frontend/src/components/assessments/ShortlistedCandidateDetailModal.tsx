import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScoreDisplay } from "@/components/assessments/ScoreDisplay";
import { candidatesApi } from "@/services/api";
import ScheduleMeetingDialog from "@/components/ScheduleMeetingDialog";
import { useToast } from "@/hooks/use-toast";
import {
    CalendarPlus,
    Loader2,
    FileText,
    Video,
    ExternalLink,
    CheckCircle,
    AlertCircle,
    Clock,
    Code,
    MessageSquare,
    Play,
    Monitor,
    Calendar,
    Star,
} from "lucide-react";
import { format } from "date-fns";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface ShortlistedCandidateDetailModalProps {
    candidateId: string | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export const ShortlistedCandidateDetailModal = ({ candidateId, open, onOpenChange }: ShortlistedCandidateDetailModalProps) => {
    const [loading, setLoading] = useState(false);
    const [data, setData] = useState<any>(null);
    const [scheduleMeetingOpen, setScheduleMeetingOpen] = useState(false);
    const { toast } = useToast();

    useEffect(() => {
        if (open && candidateId) {
            loadDetails();
        }
    }, [open, candidateId]);

    const loadDetails = async () => {
        if (!candidateId) return;
        
        setLoading(true);
        try {
            const response = await candidatesApi.getShortlistedFullDetails(candidateId);
            setData(response);
        } catch (error) {
            console.error("Error loading candidate details:", error);
            toast({
                title: "Error",
                description: "Failed to load candidate details",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    if (!open || !candidateId) return null;

    const candidate = data?.candidate || data?.shortlisted;
    const shortlisted = data?.shortlisted;
    const mcqTest = data?.mcqTest;
    const technicalTest = data?.technicalTest;
    const interviewRecord = data?.interviewRecord;

    const getInitials = (name: string) => {
        return name?.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2) || "?";
    };

    const parseAnalysis = (analysisString: string | null) => {
        if (!analysisString) return null;
        try {
            return typeof analysisString === 'string' ? JSON.parse(analysisString) : analysisString;
        } catch {
            return null;
        }
    };

    const analysis = parseAnalysis(shortlisted?.Analysis);

    return (
        <>
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto">
                <DialogHeader>
                    <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-sm font-semibold">
                                {candidate?.name ? getInitials(candidate.name) : "?"}
                            </div>
                            <div>
                                <DialogTitle>{candidate?.name || "Candidate Details"}</DialogTitle>
                                <p className="text-sm text-muted-foreground">{candidate?.email}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            {shortlisted?.status === 'shortlisted' && (
                                <Badge className="bg-green-600">Shortlisted</Badge>
                            )}
                            {shortlisted?.status === 'rejected' && (
                                <Badge variant="destructive">Rejected</Badge>
                            )}
                            {candidate && (
                                <Button size="sm" onClick={() => setScheduleMeetingOpen(true)} className="gap-2">
                                    <CalendarPlus className="h-4 w-4" />
                                    Schedule
                                </Button>
                            )}
                        </div>
                    </div>
                </DialogHeader>

                {loading ? (
                    <div className="flex items-center justify-center py-12">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                ) : (
                    <Tabs defaultValue="overview" className="w-full mt-4">
                        <TabsList className="grid w-full grid-cols-5">
                            <TabsTrigger value="overview">Overview</TabsTrigger>
                            <TabsTrigger value="ats">ATS</TabsTrigger>
                            <TabsTrigger value="mcq">MCQ</TabsTrigger>
                            <TabsTrigger value="technical">Technical</TabsTrigger>
                            <TabsTrigger value="interview">Interview</TabsTrigger>
                        </TabsList>

                        {/* Overview Tab */}
                        <TabsContent value="overview" className="space-y-6 mt-4">
                            {/* Scores Grid */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <div className="p-4 bg-primary/10 rounded-lg">
                                    <ScoreDisplay label="Total Score" score={shortlisted?.total_score || shortlisted?.ai_score} size="lg" showBar={true} />
                                </div>
                                <div className="p-3 bg-muted/30 rounded-lg">
                                    <p className="text-xs text-muted-foreground">ATS</p>
                                    <p className="text-xl font-bold">{shortlisted?.ats_score ? Number(shortlisted.ats_score).toFixed(0) : '0'}</p>
                                </div>
                                <div className="p-3 bg-muted/30 rounded-lg">
                                    <p className="text-xs text-muted-foreground">MCQ</p>
                                    <p className="text-xl font-bold">{shortlisted?.mcq_score ? Number(shortlisted.mcq_score).toFixed(0) : '0'}</p>
                                </div>
                                <div className="p-3 bg-muted/30 rounded-lg">
                                    <p className="text-xs text-muted-foreground">Technical</p>
                                    <p className="text-xl font-bold">{shortlisted?.technical_score ? Number(shortlisted.technical_score).toFixed(0) : '0'}</p>
                                </div>
                            </div>

                            {/* Analysis Summary */}
                            {analysis && (
                                <div className="space-y-4">
                                    <div className="flex items-center gap-4">
                                        <Badge variant={analysis.recommendation === 'shortlist' ? 'default' : 'destructive'}>
                                            {analysis.recommendation === 'shortlist' ? 'Shortlist' : 'Reject'}
                                        </Badge>
                                        <span className="text-sm text-muted-foreground">
                                            Confidence: {analysis.confidence}%
                                        </span>
                                        {analysis.hire_readiness && (
                                            <Badge variant="outline">{analysis.hire_readiness}</Badge>
                                        )}
                                    </div>

                                    {analysis.detailed_analysis && (
                                        <div className="p-3 bg-muted/30 rounded-lg">
                                            <p className="text-sm">{analysis.detailed_analysis}</p>
                                        </div>
                                    )}

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {analysis.strengths?.length > 0 && (
                                            <div className="p-3 bg-green-50 dark:bg-green-950/20 rounded-lg">
                                                <p className="text-sm font-medium flex items-center gap-2 mb-2">
                                                    <CheckCircle className="h-4 w-4 text-green-600" />
                                                    Strengths
                                                </p>
                                                <ul className="list-disc list-inside space-y-1 text-sm">
                                                    {analysis.strengths.map((s: string, i: number) => <li key={i}>{s}</li>)}
                                                </ul>
                                            </div>
                                        )}
                                        {analysis.weaknesses?.length > 0 && (
                                            <div className="p-3 bg-red-50 dark:bg-red-950/20 rounded-lg">
                                                <p className="text-sm font-medium flex items-center gap-2 mb-2">
                                                    <AlertCircle className="h-4 w-4 text-red-600" />
                                                    Weaknesses
                                                </p>
                                                <ul className="list-disc list-inside space-y-1 text-sm">
                                                    {analysis.weaknesses.map((w: string, i: number) => <li key={i}>{w}</li>)}
                                                </ul>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </TabsContent>

                        {/* ATS Tab */}
                        <TabsContent value="ats" className="space-y-4 mt-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-4 bg-muted/30 rounded-lg">
                                    <p className="text-xs text-muted-foreground">ATS Score</p>
                                    <p className="text-2xl font-bold">
                                        {shortlisted?.ats_score || candidate?.ats_score 
                                            ? Number(shortlisted?.ats_score || candidate?.ats_score).toFixed(0) 
                                            : '0'}/100
                                    </p>
                                </div>
                                <div className="p-4 bg-muted/30 rounded-lg">
                                    <p className="text-xs text-muted-foreground">Status</p>
                                    <Badge className="mt-1">{candidate?.status || 'N/A'}</Badge>
                                </div>
                            </div>
                            {candidate?.cv_file_url && (
                                <Button variant="outline" size="sm" onClick={() => window.open(candidate.cv_file_url, '_blank')}>
                                    <FileText className="h-4 w-4 mr-2" />
                                    View CV
                                </Button>
                            )}
                        </TabsContent>

                        {/* MCQ Tab */}
                        <TabsContent value="mcq" className="space-y-4 mt-4">
                            {mcqTest ? (
                                <>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                        <div className="p-4 bg-muted/30 rounded-lg">
                                            <p className="text-xs text-muted-foreground">Score</p>
                                            <p className="text-2xl font-bold">
                                                {mcqTest.percentage || mcqTest.score 
                                                    ? Number(mcqTest.percentage || mcqTest.score).toFixed(0) 
                                                    : '0'}%
                                            </p>
                                        </div>
                                        <div className="p-4 bg-muted/30 rounded-lg">
                                            <p className="text-xs text-muted-foreground">Correct</p>
                                            <p className="text-2xl font-bold">{mcqTest.correct_answers || 0}</p>
                                        </div>
                                        <div className="p-4 bg-muted/30 rounded-lg">
                                            <p className="text-xs text-muted-foreground">Total</p>
                                            <p className="text-2xl font-bold">{mcqTest.total_questions || 0}</p>
                                        </div>
                                        <div className="p-4 bg-muted/30 rounded-lg">
                                            <p className="text-xs text-muted-foreground">Status</p>
                                            <Badge className={mcqTest.passed ? 'bg-green-600' : 'bg-red-600'}>
                                                {mcqTest.passed ? 'Passed' : 'Failed'}
                                            </Badge>
                                        </div>
                                    </div>
                                    {mcqTest.screen_recording_url && (
                                        <div className="p-3 bg-muted/30 rounded-lg">
                                            <p className="text-sm font-medium mb-2">Screen Recording</p>
                                            <video src={mcqTest.screen_recording_url} controls className="w-full max-h-[300px] rounded" preload="metadata" />
                                        </div>
                                    )}
                                </>
                            ) : (
                                <div className="p-8 text-center text-muted-foreground">
                                    <AlertCircle className="h-12 w-12 mx-auto mb-2 opacity-50" />
                                    <p>MCQ test data not available</p>
                                </div>
                            )}
                        </TabsContent>

                        {/* Technical Tab */}
                        <TabsContent value="technical" className="space-y-4 mt-4">
                            {technicalTest ? (
                                <>
                                    {/* Task Info */}
                                    {(technicalTest.task_title || technicalTest.task_description) && (
                                        <div className="p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
                                            <div className="flex items-center gap-2 mb-2">
                                                <Code className="h-4 w-4 text-blue-600" />
                                                <p className="font-semibold text-blue-900 dark:text-blue-100">{technicalTest.task_title || 'Technical Task'}</p>
                                            </div>
                                            {technicalTest.task_description && (
                                                <p className="text-sm text-blue-800 dark:text-blue-200">{technicalTest.task_description}</p>
                                            )}
                                        </div>
                                    )}

                                    {/* Scores Grid */}
                                    <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                                        <div className="p-4 bg-primary/10 rounded-lg text-center">
                                            <Star className="h-5 w-5 mx-auto mb-1 text-yellow-500 fill-yellow-500" />
                                            <p className="text-xs text-muted-foreground">Overall</p>
                                            <p className="text-2xl font-bold">{technicalTest.overall_score ? Number(technicalTest.overall_score).toFixed(0) : '0'}</p>
                                        </div>
                                        <div className="p-3 bg-muted/30 rounded-lg text-center">
                                            <p className="text-xs text-muted-foreground">Code Quality</p>
                                            <p className="text-xl font-bold">{technicalTest.code_quality_score ? Number(technicalTest.code_quality_score).toFixed(0) : '0'}</p>
                                            <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1">
                                                <div className="bg-blue-600 h-1.5 rounded-full" style={{ width: `${technicalTest.code_quality_score || 0}%` }}></div>
                                            </div>
                                        </div>
                                        <div className="p-3 bg-muted/30 rounded-lg text-center">
                                            <p className="text-xs text-muted-foreground">Correctness</p>
                                            <p className="text-xl font-bold">{technicalTest.correctness_score ? Number(technicalTest.correctness_score).toFixed(0) : '0'}</p>
                                            <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1">
                                                <div className="bg-green-600 h-1.5 rounded-full" style={{ width: `${technicalTest.correctness_score || 0}%` }}></div>
                                            </div>
                                        </div>
                                        <div className="p-3 bg-muted/30 rounded-lg text-center">
                                            <p className="text-xs text-muted-foreground">Approach</p>
                                            <p className="text-xl font-bold">{technicalTest.approach_score ? Number(technicalTest.approach_score).toFixed(0) : '0'}</p>
                                            <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1">
                                                <div className="bg-purple-600 h-1.5 rounded-full" style={{ width: `${technicalTest.approach_score || 0}%` }}></div>
                                            </div>
                                        </div>
                                        <div className="p-3 bg-muted/30 rounded-lg text-center">
                                            <p className="text-xs text-muted-foreground">Communication</p>
                                            <p className="text-xl font-bold">{technicalTest.communication_score ? Number(technicalTest.communication_score).toFixed(0) : '0'}</p>
                                            <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1">
                                                <div className="bg-orange-600 h-1.5 rounded-full" style={{ width: `${technicalTest.communication_score || 0}%` }}></div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Status & Time Info */}
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                        <div className="p-3 bg-muted/30 rounded-lg flex items-center gap-2">
                                            <Badge className={technicalTest.status === 'completed' ? 'bg-green-600' : 'bg-yellow-600'}>
                                                {technicalTest.status || 'Pending'}
                                            </Badge>
                                        </div>
                                        {technicalTest.recommendation && (
                                            <div className="p-3 bg-muted/30 rounded-lg">
                                                <p className="text-xs text-muted-foreground">Recommendation</p>
                                                <Badge variant={technicalTest.recommendation.toLowerCase().includes('hire') ? 'default' : 'secondary'}>
                                                    {technicalTest.recommendation}
                                                </Badge>
                                            </div>
                                        )}
                                        {technicalTest.time_taken && (
                                            <div className="p-3 bg-muted/30 rounded-lg flex items-center gap-2">
                                                <Clock className="h-4 w-4 text-muted-foreground" />
                                                <div>
                                                    <p className="text-xs text-muted-foreground">Time Taken</p>
                                                    <p className="font-semibold">{Math.round(technicalTest.time_taken / 60)} min</p>
                                                </div>
                                            </div>
                                        )}
                                        {technicalTest.completed_at && (
                                            <div className="p-3 bg-muted/30 rounded-lg flex items-center gap-2">
                                                <Calendar className="h-4 w-4 text-muted-foreground" />
                                                <div>
                                                    <p className="text-xs text-muted-foreground">Completed</p>
                                                    <p className="font-semibold text-sm">{format(new Date(technicalTest.completed_at), 'MMM d, yyyy')}</p>
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {/* Videos Section */}
                                    {(technicalTest.recording_url || technicalTest.submission_url) && (
                                        <div className="space-y-3">
                                            <p className="text-sm font-medium flex items-center gap-2">
                                                <Video className="h-4 w-4" />
                                                Recordings
                                            </p>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                {technicalTest.recording_url && (
                                                    <div className="p-3 bg-muted/30 rounded-lg">
                                                        <p className="text-xs text-muted-foreground mb-2 flex items-center gap-1">
                                                            <Play className="h-3 w-3" /> Test Recording
                                                        </p>
                                                        <video src={technicalTest.recording_url} controls className="w-full max-h-[200px] rounded" preload="metadata" />
                                                    </div>
                                                )}
                                                {technicalTest.submission_url && (
                                                    <div className="p-3 bg-muted/30 rounded-lg">
                                                        <p className="text-xs text-muted-foreground mb-2 flex items-center gap-1">
                                                            <Monitor className="h-3 w-3" /> Submission Video
                                                        </p>
                                                        <video src={technicalTest.submission_url} controls className="w-full max-h-[200px] rounded" preload="metadata" />
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    {/* Code Solution */}
                                    {technicalTest.code_solution && (
                                        <div className="p-3 bg-muted/30 rounded-lg">
                                            <p className="text-sm font-medium mb-2 flex items-center gap-2">
                                                <Code className="h-4 w-4" />
                                                Code Solution
                                            </p>
                                            <pre className="bg-gray-900 text-gray-100 p-3 rounded text-xs overflow-x-auto max-h-[200px]">
                                                {technicalTest.code_solution}
                                            </pre>
                                        </div>
                                    )}

                                    {/* Code URL */}
                                    {technicalTest.code_url && (
                                        <Button variant="outline" size="sm" onClick={() => window.open(technicalTest.code_url, '_blank')} className="gap-2">
                                            <ExternalLink className="h-4 w-4" />
                                            View Code Repository
                                        </Button>
                                    )}

                                    {/* Feedback */}
                                    {technicalTest.feedback && (
                                        <div className="p-3 bg-muted/30 rounded-lg">
                                            <p className="text-sm font-medium mb-2 flex items-center gap-2">
                                                <MessageSquare className="h-4 w-4" />
                                                Feedback
                                            </p>
                                            <p className="text-sm whitespace-pre-wrap">{technicalTest.feedback}</p>
                                        </div>
                                    )}
                                </>
                            ) : (
                                <div className="p-8 text-center text-muted-foreground">
                                    <AlertCircle className="h-12 w-12 mx-auto mb-2 opacity-50" />
                                    <p>Technical test data not available</p>
                                </div>
                            )}
                        </TabsContent>

                        {/* Interview Tab */}
                        <TabsContent value="interview" className="space-y-4 mt-4">
                            {interviewRecord ? (
                                <>
                                    {/* Score and Status Grid */}
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                        <div className="p-4 bg-primary/10 rounded-lg text-center">
                                            <Star className="h-5 w-5 mx-auto mb-1 text-yellow-500 fill-yellow-500" />
                                            <p className="text-xs text-muted-foreground">Interview Score</p>
                                            <p className="text-2xl font-bold">
                                                {interviewRecord.ai_score || interviewRecord.Score 
                                                    ? Number(interviewRecord.ai_score || interviewRecord.Score).toFixed(0) 
                                                    : '0'}/100
                                            </p>
                                        </div>
                                        <div className="p-4 bg-muted/30 rounded-lg">
                                            <p className="text-xs text-muted-foreground">Status</p>
                                            <Badge className={`mt-1 ${interviewRecord.interview_status === 'Completed' || interviewRecord.interview_status === 'completed' ? 'bg-green-600' : 'bg-yellow-600'}`}>
                                                {interviewRecord.interview_status || 'Completed'}
                                            </Badge>
                                        </div>
                                        {interviewRecord.interview_date && (
                                            <div className="p-4 bg-muted/30 rounded-lg flex items-center gap-2">
                                                <Calendar className="h-4 w-4 text-muted-foreground" />
                                                <div>
                                                    <p className="text-xs text-muted-foreground">Interview Date</p>
                                                    <p className="font-semibold text-sm">{format(new Date(interviewRecord.interview_date), 'MMM d, yyyy')}</p>
                                                </div>
                                            </div>
                                        )}
                                        {interviewRecord.interview_result && (
                                            <div className="p-4 bg-muted/30 rounded-lg">
                                                <p className="text-xs text-muted-foreground">Result</p>
                                                <Badge variant={interviewRecord.interview_result.toLowerCase().includes('pass') ? 'default' : 'destructive'} className="mt-1">
                                                    {interviewRecord.interview_result}
                                                </Badge>
                                            </div>
                                        )}
                                    </div>

                                    {/* Videos Section */}
                                    {(interviewRecord['Recording URL'] || interviewRecord['Screen recording'] || interviewRecord.recording_url || interviewRecord.screen_recording_url) && (
                                        <div className="space-y-3">
                                            <p className="text-sm font-medium flex items-center gap-2">
                                                <Video className="h-4 w-4" />
                                                Interview Recordings
                                            </p>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                {(interviewRecord['Recording URL'] || interviewRecord.recording_url) && (
                                                    <div className="p-3 bg-muted/30 rounded-lg">
                                                        <p className="text-xs text-muted-foreground mb-2 flex items-center gap-1">
                                                            <Play className="h-3 w-3" /> Interview Recording
                                                        </p>
                                                        <video 
                                                            src={interviewRecord['Recording URL'] || interviewRecord.recording_url} 
                                                            controls 
                                                            className="w-full max-h-[200px] rounded" 
                                                            preload="metadata" 
                                                        />
                                                    </div>
                                                )}
                                                {(interviewRecord['Screen recording'] || interviewRecord.screen_recording_url) && (
                                                    <div className="p-3 bg-muted/30 rounded-lg">
                                                        <p className="text-xs text-muted-foreground mb-2 flex items-center gap-1">
                                                            <Monitor className="h-3 w-3" /> Screen Recording
                                                        </p>
                                                        <video 
                                                            src={interviewRecord['Screen recording'] || interviewRecord.screen_recording_url} 
                                                            controls 
                                                            className="w-full max-h-[200px] rounded" 
                                                            preload="metadata" 
                                                        />
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    {/* Questions Asked */}
                                    {interviewRecord['Question Ask by Client'] && (
                                        <div className="p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
                                            <p className="text-sm font-medium mb-2 flex items-center gap-2 text-blue-900 dark:text-blue-100">
                                                <MessageSquare className="h-4 w-4" />
                                                Questions Asked by Client
                                            </p>
                                            <p className="text-sm whitespace-pre-wrap text-blue-800 dark:text-blue-200">{interviewRecord['Question Ask by Client']}</p>
                                        </div>
                                    )}

                                    {/* AI Generated Questions */}
                                    {interviewRecord['AI Generated Question'] && (
                                        <div className="p-3 bg-purple-50 dark:bg-purple-950/20 rounded-lg border border-purple-200 dark:border-purple-800">
                                            <p className="text-sm font-medium mb-2 flex items-center gap-2 text-purple-900 dark:text-purple-100">
                                                <MessageSquare className="h-4 w-4" />
                                                AI Generated Questions
                                            </p>
                                            <p className="text-sm whitespace-pre-wrap text-purple-800 dark:text-purple-200">{interviewRecord['AI Generated Question']}</p>
                                        </div>
                                    )}

                                    {/* Analysis */}
                                    {interviewRecord.Analysis && (
                                        <div className="p-3 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-800">
                                            <p className="text-sm font-medium mb-2 flex items-center gap-2 text-green-900 dark:text-green-100">
                                                <CheckCircle className="h-4 w-4" />
                                                AI Analysis
                                            </p>
                                            <p className="text-sm whitespace-pre-wrap text-green-800 dark:text-green-200">{interviewRecord.Analysis}</p>
                                        </div>
                                    )}

                                    {/* Transcript */}
                                    {interviewRecord.Transcript && (
                                        <div className="p-3 bg-muted/30 rounded-lg">
                                            <p className="text-sm font-medium mb-2 flex items-center gap-2">
                                                <FileText className="h-4 w-4" />
                                                Interview Transcript
                                            </p>
                                            <div className="max-h-64 overflow-y-auto bg-gray-50 dark:bg-gray-900 p-3 rounded border">
                                                <p className="text-sm whitespace-pre-wrap font-mono">{interviewRecord.Transcript}</p>
                                            </div>
                                        </div>
                                    )}
                                </>
                            ) : (
                                <div className="p-8 text-center text-muted-foreground">
                                    <AlertCircle className="h-12 w-12 mx-auto mb-2 opacity-50" />
                                    <p>Interview data not available</p>
                                </div>
                            )}
                        </TabsContent>
                    </Tabs>
                )}
            </DialogContent>
        </Dialog>
        
        {candidate && (
            <ScheduleMeetingDialog
                candidate={{
                    id: candidate.id || candidateId || '',
                    name: candidate.name || candidate.full_name || '',
                    email: candidate.email || '',
                    phone: candidate.phone || '',
                    cv_file_url: candidate.cv_file_url || '',
                    ai_score: shortlisted?.total_score || shortlisted?.ai_score || candidate?.ats_score || undefined,
                    job_id: candidate.job_id || shortlisted?.job_id || '',
                    source: 'shortlisted',
                }}
                open={scheduleMeetingOpen}
                onOpenChange={setScheduleMeetingOpen}
                onSuccess={() => {
                    toast({ title: "Success", description: "Meeting scheduled successfully!" });
                    loadDetails();
                }}
            />
        )}
    </>
    );
};
