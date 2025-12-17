import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { candidatesApi, meetingsApi } from "@/services/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  MessageSquare,
  ArrowLeft,
  Mail,
  Phone,
  Calendar,
  Briefcase,
  Loader2,
  Star,
  Video,
  Check,
  X,
  Filter,
  Download,
  CalendarPlus,
  MoreVertical,
  Eye,
  PenSquare,
  Trash2,
  FileText,
  Sparkles,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import ScheduleMeetingDialog from "@/components/ScheduleMeetingDialog";
import DashboardLayout from "@/components/DashboardLayout";
import { ShortlistedCandidateDetailModal } from "@/components/assessments/ShortlistedCandidateDetailModal";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface ShortlistedCandidate {
  id: string;
  name: string;
  email: string;
  phone?: string;
  Score?: number;
  ai_score?: number;
  total_score?: number;
  ats_score?: number;
  mcq_score?: number;
  technical_score?: number;
  interview_score?: number;
  cv_file_url?: string;
  job_id?: string;
  job_title?: string;
  status?: string; // 'shortlisted' | 'rejected'
  recommendation?: string;
  confidence?: number;
  hire_readiness?: string;
  priority?: string;
  interview_status?: string;
  recording_url?: string;
  screen_recording_url?: string;
  'Recording URL'?: string;
  'Screen recording'?: string;
  Transcript?: string;
  scheduled_meeting_id?: string;
  scheduled_meeting_date?: string;
  created_at: string;
  interview_date?: string;
  interview_result?: string;
  Analysis?: string;
  source?: string;
}

type FilterType = 'all' | 'shortlisted' | 'rejected' | 'hire' | 'not-hire';

const ShortlistedCandidatesPage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [candidates, setCandidates] = useState<ShortlistedCandidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterType>('all');
  const [scheduleMeetingOpen, setScheduleMeetingOpen] = useState(false);
  const [selectedCandidate, setSelectedCandidate] = useState<ShortlistedCandidate | null>(null);
  const [cvViewerCandidate, setCvViewerCandidate] = useState<ShortlistedCandidate | null>(null);
  const [editCandidate, setEditCandidate] = useState<ShortlistedCandidate | null>(null);
  const [deleteCandidate, setDeleteCandidate] = useState<ShortlistedCandidate | null>(null);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [editLoading, setEditLoading] = useState(false);
  const [viewTranscriptCandidate, setViewTranscriptCandidate] = useState<ShortlistedCandidate | null>(null);
  const [viewDetailsCandidateId, setViewDetailsCandidateId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({
    name: "",
    email: "",
    phone: "",
    interview_status: "",
    ai_score: "",
    notes: "",
  });
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analyzingJobId, setAnalyzingJobId] = useState<string | null>(null);

  useEffect(() => {
    loadShortlistedCandidates();
  }, []);

  useEffect(() => {
    if (editCandidate) {
      setEditForm({
        name: editCandidate.name || "",
        email: editCandidate.email || "",
        phone: editCandidate.phone || "",
        interview_status: editCandidate.interview_status || "",
        ai_score: getScore(editCandidate)?.toString() || "",
        notes: editCandidate.Analysis || "",
      });
    }
  }, [editCandidate]);

  const loadShortlistedCandidates = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/login");
        return;
      }

      // Fetch shortlisted candidates via API
      const { candidates: data } = await candidatesApi.getShortlisted();

      // Fetch all scheduled meetings for this user via API
      const { meetings: meetingsData } = await meetingsApi.getAll();

      // Create a map of email to meeting data
      const meetingsMap = new Map();
      if (meetingsData) {
        meetingsData.forEach((meeting: any) => {
          // Only store the meeting if status is not completed or cancelled
          if (meeting.meeting_status !== 'completed' && meeting.meeting_status !== 'cancelled') {
            // Store only if we don't have a meeting for this email, or if this one is earlier
            const existing = meetingsMap.get(meeting.candidate_email);
            if (!existing || new Date(meeting.meeting_date) < new Date(existing.meeting_date)) {
              meetingsMap.set(meeting.candidate_email, meeting);
            }
          }
        });
      }

      const formattedData: ShortlistedCandidate[] = (data || []).map((c: any) => {
        const meeting = meetingsMap.get(c.email);
        return {
          ...c,
          job_title: c.jobs?.title,
          scheduled_meeting_id: meeting?.id,
          scheduled_meeting_date: meeting?.meeting_date,
          source: "Shortlisted",
        };
      });

      setCandidates(formattedData);
      console.log('📊 Shortlisted Candidates Loaded:', formattedData.length);
    } catch (error: any) {
      console.error("Error loading shortlisted candidates:", error);
      toast({
        title: "Error",
        description: "Failed to load shortlisted candidates",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const getScore = (candidate: ShortlistedCandidate) => {
    if (typeof candidate.total_score === "number") return candidate.total_score;
    if (typeof candidate.Score === "number") return candidate.Score;
    if (typeof candidate.ai_score === "number") return candidate.ai_score;
    return null;
  };

  const handleAnalyzeAndShortlist = async (jobId?: string) => {
    setIsAnalyzing(true);
    setAnalyzingJobId(jobId || null);
    
    try {
      const response = await candidatesApi.analyzeAndShortlist({
        job_id: jobId,
      });
      
      // Handle response - it's already the data object, not wrapped
      const data = response as any;
      const candidates = data.candidates || [];
      
      const shortlistedCount = candidates.filter((c: any) => c.status === 'shortlisted').length;
      const rejectedCount = candidates.filter((c: any) => c.status === 'rejected').length;
      
      toast({
        title: "Analysis Complete",
        description: `Analyzed ${data.analyzed || 0} candidates. ${shortlistedCount} shortlisted, ${rejectedCount} rejected.`,
      });
      
      // Reload candidates
      await loadShortlistedCandidates();
    } catch (error: any) {
      console.error("Error analyzing candidates:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to analyze candidates",
        variant: "destructive",
      });
    } finally {
      setIsAnalyzing(false);
      setAnalyzingJobId(null);
    }
  };

  const handleDownloadCV = (url: string) => {
    const link = document.createElement("a");
    link.href = url;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    link.download = "";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleMoveCandidate = async (candidate: ShortlistedCandidate, destination: "qualified" | "shortlisted") => {
    try {
      setActionLoadingId(candidate.id);
      const { data: auth } = await supabase.auth.getUser();
      if (!auth?.user) {
        navigate("/login");
        return;
      }

      const payload = {
        id: candidate.id,
        name: candidate.name,
        email: candidate.email,
        phone: candidate.phone || null,
        ai_score: getScore(candidate),
        cv_file_url: candidate.cv_file_url || null,
        job_id: candidate.job_id || null,
        user_id: auth.user.id,
        interview_status: candidate.interview_status || null,
        interview_date: candidate.interview_date || null,
        interview_result: candidate.interview_result || null,
        status: candidate.source || "Shortlisted",
        notes: candidate.Analysis || null,
        updated_at: new Date().toISOString(),
      };

      // Move candidate via API
      await candidatesApi.move(candidate.id, destination as 'qualified' | 'shortlisted');

      toast({
        title: "Candidate updated",
        description: `Moved to ${destination === "qualified" ? "Initial Interview Qualified" : "Shortlisted"} stage.`,
      });
      await loadShortlistedCandidates();
    } catch (error: any) {
      console.error("Move candidate error:", error);
      toast({
        title: "Error",
        description: error.message || "Unable to move candidate",
        variant: "destructive",
      });
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleEditSubmit = async () => {
    if (!editCandidate) return;

    try {
      setEditLoading(true);
      const updates: any = {
        name: editForm.name.trim(),
        email: editForm.email.trim(),
        phone: editForm.phone.trim() || null,
        interview_status: editForm.interview_status.trim() || null,
        updated_at: new Date().toISOString(),
      };

      if (editForm.ai_score) {
        const parsed = Number(editForm.ai_score);
        updates.ai_score = Number.isNaN(parsed) ? null : parsed;
      } else {
        updates.ai_score = null;
      }

      if (editForm.notes) {
        updates.notes = editForm.notes;
      }

      // Update shortlisted candidate via API
      await candidatesApi.updateShortlisted(editCandidate.id, updates);

      setCandidates((prev) =>
        prev.map((candidate) =>
          candidate.id === editCandidate.id
            ? {
                ...candidate,
                ...updates,
                ai_score: updates.ai_score ?? candidate.ai_score,
                interview_status: updates.interview_status,
                Analysis: updates.notes ?? candidate.Analysis,
              }
            : candidate
        )
      );

      toast({
        title: "Candidate updated",
        description: "Details saved successfully.",
      });

      await loadShortlistedCandidates();
      setEditCandidate(null);
    } catch (error: any) {
      console.error("Edit candidate error:", error);
      toast({
        title: "Error",
        description: error.message || "Unable to update candidate",
        variant: "destructive",
      });
    } finally {
      setEditLoading(false);
    }
  };

  const handleDeleteCandidateConfirm = async () => {
    if (!deleteCandidate) return;

    try {
      setActionLoadingId(deleteCandidate.id);
      // Delete shortlisted candidate via API
      await candidatesApi.deleteShortlisted(deleteCandidate.id);

      setCandidates((prev) => prev.filter((candidate) => candidate.id !== deleteCandidate.id));
      toast({
        title: "Candidate removed",
        description: `${deleteCandidate.name} has been deleted`,
      });
      await loadShortlistedCandidates();
      setDeleteCandidate(null);
    } catch (error: any) {
      console.error("Delete candidate error:", error);
      toast({
        title: "Error",
        description: error.message || "Unable to delete candidate",
        variant: "destructive",
      });
    } finally {
      setActionLoadingId(null);
    }
  };

  // Filter candidates based on AI score
  const filteredCandidates = candidates.filter((candidate) => {
    if (filter === 'shortlisted') {
      return candidate.status === 'shortlisted';
    } else if (filter === 'rejected') {
      return candidate.status === 'rejected';
    } else if (filter === 'hire') {
      const score = getScore(candidate);
      return typeof score === "number" && score >= 50;
    } else if (filter === 'not-hire') {
      const score = getScore(candidate);
      return typeof score === "number" && score < 50;
    }
    return true;
  });

  const hireCount = candidates.filter(c => {
    const score = getScore(c);
    return typeof score === "number" && score >= 50;
  }).length;
  const notHireCount = candidates.filter(c => {
    const score = getScore(c);
    return typeof score === "number" && score < 50;
  }).length;

  const handleScheduleMeeting = (candidate: ShortlistedCandidate) => {
    setSelectedCandidate(candidate);
    setScheduleMeetingOpen(true);
  };

  const handleScheduleSuccess = () => {
    // Reload candidates to refresh scheduled meeting data
    loadShortlistedCandidates();
    toast({
      title: "Success",
      description: "Meeting scheduled successfully!",
    });
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="min-h-screen bg-[var(--gradient-subtle)] flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-[var(--gradient-subtle)]">
        <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card className="shadow-elegant">
          <CardHeader>
            <div className="flex items-center justify-between flex-wrap gap-4">
              <CardTitle className="flex items-center gap-2">
                <span>Shortlisted Candidates</span>
                <Badge variant="secondary">{candidates.length} Total</Badge>
              </CardTitle>
              
              <div className="flex items-center gap-4 flex-wrap">
                {/* Analysis Button */}
                <Button
                  onClick={() => handleAnalyzeAndShortlist()}
                  disabled={isAnalyzing}
                  className="flex items-center gap-2"
                  variant="default"
                >
                  {isAnalyzing ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4" />
                      Analyze & Shortlist All
                    </>
                  )}
                </Button>
                
                {/* Filter Buttons */}
                <div className="flex items-center gap-2">
                  <Filter className="h-4 w-4 text-muted-foreground" />
                  <div className="flex gap-2 flex-wrap">
                    <Button
                      variant={filter === 'all' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setFilter('all')}
                      className="gap-2"
                    >
                      All
                      <Badge variant="secondary" className="ml-1">{candidates.length}</Badge>
                    </Button>
                    <Button
                      variant={filter === 'shortlisted' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setFilter('shortlisted')}
                      className="gap-2"
                    >
                      <CheckCircle2 className="h-3 w-3" />
                      Shortlisted
                      <Badge variant="secondary" className="ml-1 bg-green-100 text-green-800 border-green-200">
                        {candidates.filter(c => c.status === 'shortlisted').length}
                      </Badge>
                    </Button>
                    <Button
                      variant={filter === 'rejected' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setFilter('rejected')}
                      className="gap-2"
                    >
                      <XCircle className="h-3 w-3" />
                      Rejected
                      <Badge variant="secondary" className="ml-1 bg-red-100 text-red-800 border-red-200">
                        {candidates.filter(c => c.status === 'rejected').length}
                      </Badge>
                    </Button>
                    <Button
                      variant={filter === 'hire' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setFilter('hire')}
                      className="gap-2"
                    >
                      <Check className="h-4 w-4" />
                      Hire (≥50%)
                      <Badge variant="secondary" className="ml-1 bg-green-100 text-green-800 border-green-200">
                        {hireCount}
                      </Badge>
                    </Button>
                    <Button
                      variant={filter === 'not-hire' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setFilter('not-hire')}
                      className="gap-2"
                    >
                      <X className="h-4 w-4" />
                      Not Hire (&lt;50%)
                      <Badge variant="secondary" className="ml-1 bg-red-100 text-red-800 border-red-200">
                        {notHireCount}
                      </Badge>
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {filteredCandidates.length === 0 ? (
              <div className="text-center py-12">
                <MessageSquare className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">
                  {filter === 'shortlisted' ? 'No Shortlisted Candidates' :
                   filter === 'rejected' ? 'No Rejected Candidates' :
                   filter === 'hire' ? 'No Candidates to Hire' : 
                   filter === 'not-hire' ? 'No Candidates Below 50%' : 
                   'No Shortlisted Candidates'}
                </h3>
                <p className="text-muted-foreground">
                  {filter === 'all' 
                    ? 'Use "Analyze & Shortlist All" to analyze candidates and automatically shortlist or reject them'
                    : 'Try changing the filter to see more candidates'
                  }
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Candidate</TableHead>
                      <TableHead>Job</TableHead>
                      <TableHead>Total Score</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredCandidates.map((candidate) => {
                      const score = getScore(candidate);
                      const shouldHire = typeof score === "number" && score >= 50;
                      
                      return (
                        <TableRow key={candidate.id}>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <Avatar className="h-10 w-10">
                                <AvatarFallback className="bg-gradient-to-br from-blue-500 to-blue-600 text-primary-foreground">
                                  {getInitials(candidate.name)}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="font-semibold">{candidate.name}</p>
                                <p className="text-xs text-muted-foreground">{candidate.email}</p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            {candidate.job_title ? (
                              <div className="flex items-center gap-1 text-sm">
                                <Briefcase className="h-3 w-3" />
                                {candidate.job_title}
                              </div>
                            ) : (
                              <span className="text-xs text-muted-foreground">-</span>
                            )}
                          </TableCell>
                          <TableCell>
                            {candidate.total_score !== null && candidate.total_score !== undefined ? (
                              <div className="flex items-center gap-2">
                                <span className="font-semibold text-lg">{candidate.total_score}/100</span>
                                {candidate.priority && (
                                  <Badge variant="outline" className="text-xs">
                                    {candidate.priority}
                                  </Badge>
                                )}
                              </div>
                            ) : score !== null ? (
                              <div className="flex items-center gap-1">
                                <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                                <span className="font-semibold">{score}%</span>
                              </div>
                            ) : (
                              <span className="text-xs text-muted-foreground">-</span>
                            )}
                          </TableCell>
                          <TableCell>
                            {candidate.status === 'shortlisted' ? (
                              <Badge className="bg-green-100 text-green-800 border-green-200">
                                <CheckCircle2 className="h-3 w-3 mr-1" />
                                Shortlisted
                              </Badge>
                            ) : candidate.status === 'rejected' ? (
                              <Badge variant="destructive">
                                <XCircle className="h-3 w-3 mr-1" />
                                Rejected
                              </Badge>
                            ) : (
                              <Badge className="bg-blue-100 text-blue-800 border-blue-200">
                                Shortlisted
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setViewDetailsCandidateId(candidate.id)}
                                className="gap-2"
                              >
                                <Eye className="h-4 w-4" />
                                View Details
                              </Button>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon">
                                    <MoreVertical className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-64">
                                  <DropdownMenuLabel>Manage Candidate</DropdownMenuLabel>
                                  <DropdownMenuItem onClick={() => setViewDetailsCandidateId(candidate.id)}>
                                    <Eye className="mr-2 h-4 w-4" />
                                    View Full Details
                                  </DropdownMenuItem>
                                {candidate.cv_file_url ? (
                                  <DropdownMenuItem onClick={() => setCvViewerCandidate(candidate)}>
                                    <Eye className="mr-2 h-4 w-4" />
                                    View CV
                                  </DropdownMenuItem>
                                ) : (
                                  <DropdownMenuItem disabled>
                                    <Eye className="mr-2 h-4 w-4" />
                                    No CV Uploaded
                                  </DropdownMenuItem>
                                )}
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={() => setEditCandidate(candidate)}>
                                  <PenSquare className="mr-2 h-4 w-4" />
                                  Edit Candidate
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  className="text-destructive focus:text-destructive"
                                  onClick={() => setDeleteCandidate(candidate)}
                                >
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  Delete Candidate
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </main>

      {/* Schedule Meeting Dialog */}
      {selectedCandidate && (
        <ScheduleMeetingDialog
          candidate={{
            id: selectedCandidate.id,
            name: selectedCandidate.name,
            email: selectedCandidate.email,
            phone: selectedCandidate.phone,
            cv_file_url: selectedCandidate.cv_file_url,
            ai_score: getScore(selectedCandidate) ?? undefined,
            job_id: selectedCandidate.job_id,
            source: 'shortlisted',
          }}
          open={scheduleMeetingOpen}
          onOpenChange={setScheduleMeetingOpen}
          onSuccess={handleScheduleSuccess}
        />
      )}

      <Dialog open={!!cvViewerCandidate} onOpenChange={(open) => !open && setCvViewerCandidate(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Candidate CV</DialogTitle>
            <DialogDescription>
              {cvViewerCandidate?.name} &middot; {cvViewerCandidate?.email}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {cvViewerCandidate?.cv_file_url ? (
              <div className="h-[500px] rounded-md border">
                <iframe
                  src={cvViewerCandidate.cv_file_url}
                  title="Candidate CV"
                  className="w-full h-full rounded-md"
                />
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No CV uploaded for this candidate.</p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCvViewerCandidate(null)}>
              Close
            </Button>
            {cvViewerCandidate?.cv_file_url && (
              <Button onClick={() => handleDownloadCV(cvViewerCandidate.cv_file_url!)}>
                <Download className="mr-2 h-4 w-4" />
                Download CV
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!editCandidate} onOpenChange={(open) => !open && setEditCandidate(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Candidate</DialogTitle>
            <DialogDescription>Update the candidate information and save changes.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Name</Label>
              <Input
                id="edit-name"
                value={editForm.name}
                onChange={(e) => setEditForm((prev) => ({ ...prev, name: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-email">Email</Label>
              <Input
                id="edit-email"
                type="email"
                value={editForm.email}
                onChange={(e) => setEditForm((prev) => ({ ...prev, email: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-phone">Phone</Label>
              <Input
                id="edit-phone"
                value={editForm.phone}
                onChange={(e) => setEditForm((prev) => ({ ...prev, phone: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-status">Interview Status</Label>
              <Input
                id="edit-status"
                value={editForm.interview_status}
                onChange={(e) => setEditForm((prev) => ({ ...prev, interview_status: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-score">AI Score</Label>
              <Input
                id="edit-score"
                value={editForm.ai_score}
                onChange={(e) => setEditForm((prev) => ({ ...prev, ai_score: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-notes">Notes</Label>
              <Textarea
                id="edit-notes"
                rows={4}
                value={editForm.notes}
                onChange={(e) => setEditForm((prev) => ({ ...prev, notes: e.target.value }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditCandidate(null)}>
              Cancel
            </Button>
            <Button onClick={handleEditSubmit} disabled={editLoading}>
              {editLoading ? "Saving..." : "Save changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteCandidate} onOpenChange={(open) => !open && setDeleteCandidate(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete candidate</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently remove{" "}
              <span className="font-semibold">{deleteCandidate?.name}</span> from your candidates list.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeleteCandidate(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteCandidateConfirm}
              disabled={actionLoadingId === deleteCandidate?.id}
            >
              {actionLoadingId === deleteCandidate?.id ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Transcript Viewer Dialog */}
      <Dialog open={!!viewTranscriptCandidate} onOpenChange={(open) => !open && setViewTranscriptCandidate(null)}>
        <DialogContent className="max-w-4xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>Interview Transcript</DialogTitle>
            <DialogDescription>
              {viewTranscriptCandidate?.name} &middot; {viewTranscriptCandidate?.email}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {viewTranscriptCandidate?.Transcript ? (
              <div className="rounded-md border p-4 bg-muted/50 max-h-[60vh] overflow-y-auto">
                <pre className="whitespace-pre-wrap text-sm font-mono leading-relaxed">
                  {viewTranscriptCandidate.Transcript}
                </pre>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No transcript available for this candidate.</p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setViewTranscriptCandidate(null)}>
              Close
            </Button>
            {viewTranscriptCandidate?.Transcript && (
              <Button
                onClick={() => {
                  const blob = new Blob([viewTranscriptCandidate.Transcript || ''], { type: 'text/plain' });
                  const url = URL.createObjectURL(blob);
                  const link = document.createElement('a');
                  link.href = url;
                  link.download = `${viewTranscriptCandidate.name}_transcript.txt`;
                  document.body.appendChild(link);
                  link.click();
                  document.body.removeChild(link);
                  URL.revokeObjectURL(url);
                }}
              >
                <Download className="mr-2 h-4 w-4" />
                Download Transcript
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Full Details Modal */}
      <ShortlistedCandidateDetailModal
        candidateId={viewDetailsCandidateId}
        open={!!viewDetailsCandidateId}
        onOpenChange={(open) => !open && setViewDetailsCandidateId(null)}
      />
    </div>
    </DashboardLayout>
  );
};

export default ShortlistedCandidatesPage;