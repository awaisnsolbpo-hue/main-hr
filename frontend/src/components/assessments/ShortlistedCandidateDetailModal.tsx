import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { ScoreDisplay } from "@/components/assessments/ScoreDisplay";
import { candidatesApi } from "@/services/api";
import ScheduleMeetingDialog from "@/components/ScheduleMeetingDialog";
import { useToast } from "@/hooks/use-toast";
import {
    User,
    Mail,
    Phone,
    Briefcase,
    Calendar,
    CheckCircle,
    XCircle,
    Clock,
    FileText,
    Code2,
    Award,
    TrendingUp,
    FileCode,
    Play,
    ExternalLink,
    Video,
    Loader2,
    MessageSquare,
    FileVideo,
    BarChart3,
    Target,
    AlertCircle,
    CalendarPlus,
} from "lucide-react";
import { format } from "date-fns";
import { formatPercentage } from "@/lib/numberFormat";
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
    const job = data?.job;

    const getInitials = (name: string) => {
        return name
            .split(" ")
            .map((n) => n[0])
            .join("")
            .toUpperCase()
            .slice(0, 2);
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
            <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3 flex-1">
                            <Avatar className="h-10 w-10">
                                <AvatarFallback className="bg-gradient-to-br from-primary to-primary/80">
                                    {candidate?.name ? getInitials(candidate.name) : "?"}
                                </AvatarFallback>
                            </Avatar>
                            <div>
                                <div className="flex items-center gap-2">
                                    <span className="font-semibold">{candidate?.name || "Candidate Details"}</span>
                                    {shortlisted?.status === 'shortlisted' ? (
                                        <Badge className="bg-green-100 text-green-800 border-green-200">
                                            <CheckCircle className="h-3 w-3 mr-1" />
                                            Shortlisted
                                        </Badge>
                                    ) : shortlisted?.status === 'rejected' ? (
                                        <Badge variant="destructive">
                                            <XCircle className="h-3 w-3 mr-1" />
                                            Rejected
                                        </Badge>
                                    ) : null}
                                </div>
                                <p className="text-sm text-muted-foreground font-normal mt-1">
                                    {candidate?.email}
                                </p>
                            </div>
                        </div>
                        {candidate && (
                            <Button
                                variant="default"
                                size="sm"
                                onClick={() => setScheduleMeetingOpen(true)}
                                className="gap-2"
                            >
                                <CalendarPlus className="h-4 w-4" />
                                Schedule Meeting
                            </Button>
                        )}
                    </div>
                    <DialogDescription className="mt-2">
                        Comprehensive assessment overview and test results
                    </DialogDescription>
                </DialogHeader>

                {loading ? (
                    <div className="flex items-center justify-center py-12">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                ) : (
                    <Tabs defaultValue="overview" className="w-full">
                        <TabsList className="grid w-full grid-cols-5">
                            <TabsTrigger value="overview">Overview</TabsTrigger>
                            <TabsTrigger value="ats">ATS</TabsTrigger>
                            <TabsTrigger value="mcq">MCQ</TabsTrigger>
                            <TabsTrigger value="technical">Technical</TabsTrigger>
                            <TabsTrigger value="interview">Interview</TabsTrigger>
                        </TabsList>

                        {/* Overview Tab */}
                        <TabsContent value="overview" className="space-y-6 mt-4">
                            {/* Overall Score */}
                            <div className="p-6 rounded-xl border-2 bg-gradient-to-br from-primary/10 to-primary/5 border-primary/30">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-lg font-semibold flex items-center gap-2">
                                        <Award className="h-5 w-5" />
                                        Overall Assessment
                                    </h3>
                                    {shortlisted?.priority && (
                                        <Badge variant="outline">
                                            Priority: {shortlisted.priority}
                                        </Badge>
                                    )}
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                    <div>
                                        <ScoreDisplay
                                            label="Total Score"
                                            score={shortlisted?.total_score || shortlisted?.ai_score}
                                            size="lg"
                                            showBar={true}
                                        />
                                    </div>
                                    <div>
                                        <p className="text-sm text-muted-foreground mb-1">ATS Score</p>
                                        <p className="text-2xl font-bold">
                                            {shortlisted?.ats_score ? Number(shortlisted.ats_score).toFixed(2) : '0.00'}/100
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-muted-foreground mb-1">MCQ Score</p>
                                        <p className="text-2xl font-bold">
                                            {shortlisted?.mcq_score ? Number(shortlisted.mcq_score).toFixed(2) : '0.00'}/100
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-muted-foreground mb-1">Technical Score</p>
                                        <p className="text-2xl font-bold">
                                            {shortlisted?.technical_score ? Number(shortlisted.technical_score).toFixed(2) : '0.00'}/100
                                        </p>
                                    </div>
                                </div>
                                {analysis && (
                                    <div className="mt-4 space-y-2">
                                        <div>
                                            <p className="text-sm font-semibold mb-1">Recommendation</p>
                                            <Badge variant={analysis.recommendation === 'shortlist' ? 'default' : 'destructive'}>
                                                {analysis.recommendation === 'shortlist' ? 'Shortlist' : 'Reject'}
                                            </Badge>
                                            <span className="ml-2 text-sm text-muted-foreground">
                                                (Confidence: {analysis.confidence}%)
                                            </span>
                                        </div>
                                        <div>
                                            <p className="text-sm font-semibold mb-1">Hire Readiness</p>
                                            <Badge variant="outline">{analysis.hire_readiness || 'N/A'}</Badge>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* AI Analysis */}
                            {analysis && (
                                <div className="space-y-4">
                                    <h3 className="text-lg font-semibold flex items-center gap-2">
                                        <MessageSquare className="h-5 w-5" />
                                        AI Analysis
                                    </h3>
                                    
                                    {analysis.detailed_analysis && (
                                        <div className="p-4 rounded-lg border bg-card">
                                            <p className="text-sm whitespace-pre-wrap">{analysis.detailed_analysis}</p>
                                        </div>
                                    )}

                                    {analysis.strengths && analysis.strengths.length > 0 && (
                                        <div className="p-4 rounded-lg border bg-green-50 dark:bg-green-950/20">
                                            <p className="text-sm font-semibold mb-2 flex items-center gap-2">
                                                <CheckCircle className="h-4 w-4 text-green-600" />
                                                Strengths
                                            </p>
                                            <ul className="list-disc list-inside space-y-1 text-sm">
                                                {analysis.strengths.map((strength: string, idx: number) => (
                                                    <li key={idx}>{strength}</li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}

                                    {analysis.weaknesses && analysis.weaknesses.length > 0 && (
                                        <div className="p-4 rounded-lg border bg-red-50 dark:bg-red-950/20">
                                            <p className="text-sm font-semibold mb-2 flex items-center gap-2">
                                                <AlertCircle className="h-4 w-4 text-red-600" />
                                                Weaknesses
                                            </p>
                                            <ul className="list-disc list-inside space-y-1 text-sm">
                                                {analysis.weaknesses.map((weakness: string, idx: number) => (
                                                    <li key={idx}>{weakness}</li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}

                                    {analysis.recommendation_reason && (
                                        <div className="p-4 rounded-lg border bg-card">
                                            <p className="text-sm font-semibold mb-2">Recommendation Reason</p>
                                            <p className="text-sm whitespace-pre-wrap">{analysis.recommendation_reason}</p>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Score Breakdown */}
                            <div>
                                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                                    <BarChart3 className="h-5 w-5" />
                                    Score Breakdown
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="p-4 rounded-lg border bg-card">
                                        <p className="text-sm text-muted-foreground mb-1">ATS Evaluation</p>
                                        <p className="text-sm">{analysis?.ats_evaluation || 'Not available'}</p>
                                    </div>
                                    <div className="p-4 rounded-lg border bg-card">
                                        <p className="text-sm text-muted-foreground mb-1">MCQ Evaluation</p>
                                        <p className="text-sm">{analysis?.mcq_evaluation || 'Not available'}</p>
                                    </div>
                                    <div className="p-4 rounded-lg border bg-card">
                                        <p className="text-sm text-muted-foreground mb-1">Technical Evaluation</p>
                                        <p className="text-sm">{analysis?.technical_evaluation || 'Not available'}</p>
                                    </div>
                                    <div className="p-4 rounded-lg border bg-card">
                                        <p className="text-sm text-muted-foreground mb-1">Interview Evaluation</p>
                                        <p className="text-sm">{analysis?.interview_evaluation || 'Not available'}</p>
                                    </div>
                                </div>
                            </div>
                        </TabsContent>

                        {/* ATS Tab */}
                        <TabsContent value="ats" className="space-y-4 mt-4">
                            <div className="p-4 rounded-lg border bg-card">
                                <h3 className="text-lg font-semibold mb-4">Resume/CV Analysis</h3>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-sm text-muted-foreground">ATS Score</p>
                                        <p className="text-2xl font-bold">
                                            {shortlisted?.ats_score || candidate?.ats_score 
                                                ? Number(shortlisted?.ats_score || candidate?.ats_score).toFixed(2) 
                                                : '0.00'}/100
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-muted-foreground">Status</p>
                                        <Badge>{candidate?.status || 'N/A'}</Badge>
                                    </div>
                                </div>
                                {candidate?.ats_breakdown && (
                                    <div className="mt-4">
                                        <p className="text-sm font-semibold mb-2">Breakdown</p>
                                        <pre className="text-xs bg-muted p-3 rounded overflow-auto">
                                            {JSON.stringify(candidate.ats_breakdown, null, 2)}
                                        </pre>
                                    </div>
                                )}
                                {candidate?.cv_file_url && (
                                    <div className="mt-4">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => window.open(candidate.cv_file_url, '_blank')}
                                        >
                                            <FileText className="h-4 w-4 mr-2" />
                                            View CV
                                        </Button>
                                    </div>
                                )}
                            </div>
                        </TabsContent>

                        {/* MCQ Tab */}
                        <TabsContent value="mcq" className="space-y-4 mt-4">
                            {mcqTest ? (
                                <>
                                    <div className="p-4 rounded-lg border bg-card">
                                        <h3 className="text-lg font-semibold mb-4">MCQ Test Results</h3>
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                            <div>
                                                <p className="text-sm text-muted-foreground">Score</p>
                                                <p className="text-2xl font-bold">
                                                    {mcqTest.percentage || mcqTest.score 
                                                        ? Number(mcqTest.percentage || mcqTest.score).toFixed(2) 
                                                        : '0.00'}%
                                                </p>
                                            </div>
                                            <div>
                                                <p className="text-sm text-muted-foreground">Correct</p>
                                                <p className="text-2xl font-bold">{mcqTest.correct_answers || 0}</p>
                                            </div>
                                            <div>
                                                <p className="text-sm text-muted-foreground">Total Questions</p>
                                                <p className="text-2xl font-bold">{mcqTest.total_questions || 0}</p>
                                            </div>
                                            <div>
                                                <p className="text-sm text-muted-foreground">Status</p>
                                                <Badge variant={mcqTest.passed ? 'default' : 'destructive'}>
                                                    {mcqTest.passed ? 'Passed' : 'Failed'}
                                                </Badge>
                                            </div>
                                        </div>
                                        {mcqTest.completed_at && (
                                            <div className="mt-4">
                                                <p className="text-sm text-muted-foreground">
                                                    Completed: {format(new Date(mcqTest.completed_at), 'PPp')}
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                    {mcqTest.screen_recording_url && (
                                        <div className="p-4 rounded-lg border bg-card">
                                            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                                                <FileVideo className="h-5 w-5" />
                                                Screen Recording
                                            </h3>
                                            <div className="rounded-lg overflow-hidden border bg-muted/30">
                                                <video
                                                    src={mcqTest.screen_recording_url}
                                                    controls
                                                    className="w-full max-h-[400px]"
                                                    preload="metadata"
                                                >
                                                    Your browser does not support the video tag.
                                                </video>
                                            </div>
                                            <div className="mt-2 flex gap-2">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => window.open(mcqTest.screen_recording_url, '_blank')}
                                                >
                                                    <ExternalLink className="h-4 w-4 mr-2" />
                                                    Open in New Tab
                                                </Button>
                                            </div>
                                        </div>
                                    )}
                                </>
                            ) : (
                                <div className="p-8 text-center text-muted-foreground">
                                    <AlertCircle className="h-12 w-12 mx-auto mb-2" />
                                    <p>MCQ test data not available</p>
                                </div>
                            )}
                        </TabsContent>

                        {/* Technical Tab */}
                        <TabsContent value="technical" className="space-y-4 mt-4">
                            {technicalTest ? (
                                <>
                                    <div className="p-4 rounded-lg border bg-card">
                                        <h3 className="text-lg font-semibold mb-4">Technical Test Results</h3>
                                        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                                            <div>
                                                <p className="text-sm text-muted-foreground">Overall Score</p>
                                                <p className="text-2xl font-bold">
                                                    {technicalTest.overall_score ? Number(technicalTest.overall_score).toFixed(2) : '0.00'}/100
                                                </p>
                                            </div>
                                            <div>
                                                <p className="text-sm text-muted-foreground">Code Quality</p>
                                                <p className="text-xl font-semibold">
                                                    {technicalTest.code_quality_score ? Number(technicalTest.code_quality_score).toFixed(2) : '0.00'}/100
                                                </p>
                                            </div>
                                            <div>
                                                <p className="text-sm text-muted-foreground">Correctness</p>
                                                <p className="text-xl font-semibold">
                                                    {technicalTest.correctness_score ? Number(technicalTest.correctness_score).toFixed(2) : '0.00'}/100
                                                </p>
                                            </div>
                                            <div>
                                                <p className="text-sm text-muted-foreground">Approach</p>
                                                <p className="text-xl font-semibold">
                                                    {technicalTest.approach_score ? Number(technicalTest.approach_score).toFixed(2) : '0.00'}/100
                                                </p>
                                            </div>
                                            <div>
                                                <p className="text-sm text-muted-foreground">Communication</p>
                                                <p className="text-xl font-semibold">
                                                    {technicalTest.communication_score ? Number(technicalTest.communication_score).toFixed(2) : '0.00'}/100
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                    {technicalTest.recording_url && (
                                        <div className="p-4 rounded-lg border bg-card">
                                            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                                                <Video className="h-5 w-5" />
                                                Video Recording
                                            </h3>
                                            <div className="rounded-lg overflow-hidden border bg-muted/30">
                                                <video
                                                    src={technicalTest.recording_url}
                                                    controls
                                                    className="w-full max-h-[400px]"
                                                    preload="metadata"
                                                >
                                                    Your browser does not support the video tag.
                                                </video>
                                            </div>
                                        </div>
                                    )}
                                    {technicalTest.feedback && (
                                        <div className="p-4 rounded-lg border bg-card">
                                            <h3 className="text-lg font-semibold mb-2">Feedback</h3>
                                            <p className="text-sm whitespace-pre-wrap">{technicalTest.feedback}</p>
                                        </div>
                                    )}
                                    {technicalTest.code_review && (
                                        <div className="p-4 rounded-lg border bg-card">
                                            <h3 className="text-lg font-semibold mb-2">Code Review</h3>
                                            <pre className="text-xs bg-muted p-3 rounded overflow-auto">
                                                {technicalTest.code_review}
                                            </pre>
                                        </div>
                                    )}
                                </>
                            ) : (
                                <div className="p-8 text-center text-muted-foreground">
                                    <AlertCircle className="h-12 w-12 mx-auto mb-2" />
                                    <p>Technical test data not available</p>
                                </div>
                            )}
                        </TabsContent>

                        {/* Interview Tab */}
                        <TabsContent value="interview" className="space-y-4 mt-4">
                            {interviewRecord ? (
                                <>
                                    <div className="p-4 rounded-lg border bg-card">
                                        <h3 className="text-lg font-semibold mb-4">Interview Results</h3>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <p className="text-sm text-muted-foreground">Interview Score</p>
                                                <p className="text-2xl font-bold">
                                                    {interviewRecord.ai_score || interviewRecord.Score 
                                                        ? Number(interviewRecord.ai_score || interviewRecord.Score).toFixed(2) 
                                                        : '0.00'}/100
                                                </p>
                                            </div>
                                            <div>
                                                <p className="text-sm text-muted-foreground">Status</p>
                                                <Badge>{interviewRecord.interview_status || 'Completed'}</Badge>
                                            </div>
                                        </div>
                                    </div>
                                    {interviewRecord.Transcript && (
                                        <div className="p-4 rounded-lg border bg-card">
                                            <h3 className="text-lg font-semibold mb-2">Transcript</h3>
                                            <div className="max-h-96 overflow-y-auto">
                                                <p className="text-sm whitespace-pre-wrap">{interviewRecord.Transcript}</p>
                                            </div>
                                        </div>
                                    )}
                                    {interviewRecord.Analysis && (
                                        <div className="p-4 rounded-lg border bg-card">
                                            <h3 className="text-lg font-semibold mb-2">Analysis</h3>
                                            <p className="text-sm whitespace-pre-wrap">{interviewRecord.Analysis}</p>
                                        </div>
                                    )}
                                    {(interviewRecord['Recording URL'] || interviewRecord['Screen recording']) && (
                                        <div className="p-4 rounded-lg border bg-card">
                                            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                                                <Video className="h-5 w-5" />
                                                Recordings
                                            </h3>
                                            <div className="space-y-4">
                                                {interviewRecord['Recording URL'] && (
                                                    <div>
                                                        <p className="text-sm font-semibold mb-2">Interview Recording</p>
                                                        <div className="rounded-lg overflow-hidden border bg-muted/30">
                                                            <video
                                                                src={interviewRecord['Recording URL']}
                                                                controls
                                                                className="w-full max-h-[300px]"
                                                                preload="metadata"
                                                            >
                                                                Your browser does not support the video tag.
                                                            </video>
                                                        </div>
                                                    </div>
                                                )}
                                                {interviewRecord['Screen recording'] && (
                                                    <div>
                                                        <p className="text-sm font-semibold mb-2">Screen Recording</p>
                                                        <div className="rounded-lg overflow-hidden border bg-muted/30">
                                                            <video
                                                                src={interviewRecord['Screen recording']}
                                                                controls
                                                                className="w-full max-h-[300px]"
                                                                preload="metadata"
                                                            >
                                                                Your browser does not support the video tag.
                                                            </video>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </>
                            ) : (
                                <div className="p-8 text-center text-muted-foreground">
                                    <AlertCircle className="h-12 w-12 mx-auto mb-2" />
                                    <p>Interview data not available</p>
                                </div>
                            )}
                        </TabsContent>
                    </Tabs>
                )}
            </DialogContent>
        </Dialog>
        
        {/* Schedule Meeting Dialog - Separate dialog outside main modal */}
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
                    toast({
                        title: "Success",
                        description: "Meeting scheduled successfully!",
                    });
                    // Reload data to show updated meeting info
                    loadDetails();
                }}
            />
        )}
    </>
    );
};

