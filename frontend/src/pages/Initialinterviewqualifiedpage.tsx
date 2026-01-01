import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { interviewsApi, candidatesApi } from "@/services/api";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  MDTable,
  MDTableHeader,
  MDTableHeaderCell,
  MDTableBody,
  MDTableRow,
  MDTableCell
} from "@/components/ui/MDTable";
import {
  CheckCircle,
  ArrowLeft,
  Mail,
  Phone,
  Calendar,
  Briefcase,
  Loader2,
  Star,
  MoreVertical,
  Eye,
  PenSquare,
  Trash2,
  Download,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import DashboardLayout from "@/components/DashboardLayout";
import { InterviewDetailModal } from "@/components/assessments/InterviewDetailModal";
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

interface QualifiedCandidate {
  id: string;
  name: string;
  email: string;
  phone?: string;
  Score?: number;
  ai_score?: number;
  cv_file_url?: string;
  job_id?: string;
  job_title?: string;
  status?: string;
  interview_status?: string;
  created_at: string;
  interview_date?: string;
  interview_result?: string;
  Analysis?: string;
  source?: string;
}

const InitialInterviewQualifiedPage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [candidates, setCandidates] = useState<QualifiedCandidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [cvViewerCandidate, setCvViewerCandidate] = useState<QualifiedCandidate | null>(null);
  const [editCandidate, setEditCandidate] = useState<QualifiedCandidate | null>(null);
  const [deleteCandidate, setDeleteCandidate] = useState<QualifiedCandidate | null>(null);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [editLoading, setEditLoading] = useState(false);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedInterview, setSelectedInterview] = useState<QualifiedCandidate | null>(null);
  const [editForm, setEditForm] = useState({
    name: "",
    email: "",
    phone: "",
    interview_status: "",
    ai_score: "",
    notes: "",
  });

  useEffect(() => {
    loadQualifiedCandidates();
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

  const loadQualifiedCandidates = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/login");
        return;
      }

      // Fetch qualified candidates via API
      const { candidates: data } = await interviewsApi.getQualified();

      const formattedData: QualifiedCandidate[] = (data || []).map((c: any) => ({
        ...c,
        job_title: c.jobs?.title,
        source: "Final Interview",
      }));

      setCandidates(formattedData);
      console.log('📊 Qualified Candidates Loaded:', formattedData.length);
    } catch (error: any) {
      console.error("Error loading qualified candidates:", error);
      toast({
        title: "Error",
        description: "Failed to load qualified candidates",
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

  const getScore = (candidate: QualifiedCandidate) => {
    if (typeof candidate.Score === "number") return candidate.Score;
    if (typeof candidate.ai_score === "number") return candidate.ai_score;
    return null;
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

  const handleMoveCandidate = async (candidate: QualifiedCandidate, destination: "qualified" | "shortlisted") => {
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
        status: candidate.source || "Final Interview",
        notes: candidate.Analysis || null,
        updated_at: new Date().toISOString(),
      };

      // Move candidate via API
      await candidatesApi.move(candidate.id, destination as 'qualified' | 'shortlisted');

      toast({
        title: "Candidate updated",
        description: `Moved to ${destination === "qualified" ? "Initial Interview Qualified" : "Shortlisted"} stage.`,
      });
      await loadQualifiedCandidates();
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

      const { error } = await supabase
        .from("qualified_for_final_interview")
        .update(updates)
        .eq("id", editCandidate.id);
      if (error) throw error;

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

      await loadQualifiedCandidates();
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
      const { error } = await supabase
        .from("qualified_for_final_interview")
        .delete()
        .eq("id", deleteCandidate.id);
      if (error) throw error;

      setCandidates((prev) => prev.filter((candidate) => candidate.id !== deleteCandidate.id));
      toast({
        title: "Candidate removed",
        description: `${deleteCandidate.name} has been deleted`,
      });
      await loadQualifiedCandidates();
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

  if (loading) {
    return (
      <DashboardLayout>
        <div className="min-h-screen bg-[#f0f2f5] flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-[#e91e63]" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-[#f0f2f5] p-6">
        {/* Page Header - Material Dashboard Style */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-[#344767] mb-2">Qualified for Final Interview</h1>
          <p className="text-sm font-light text-[#7b809a]">
            Candidates qualified for the final interview stage
          </p>
        </div>

        {/* Material Dashboard Table */}
        <MDTable
          title="Final Interview Candidates"
          headerActions={
            <Badge className="bg-gradient-to-br from-[#4CAF50] to-[#66BB6A] text-white border-0 shadow-green">
              {candidates.length} Total
            </Badge>
          }
        >
          {candidates.length === 0 ? (
            <tbody>
              <tr>
                <td colSpan={8}>
                  <div className="text-center py-12">
                    <CheckCircle className="h-16 w-16 text-[#7b809a] mx-auto mb-4 opacity-50" />
                    <h3 className="text-lg font-semibold text-[#344767] mb-2">No Qualified Candidates</h3>
                    <p className="text-sm font-light text-[#7b809a]">
                      Candidates who pass initial screening will appear here
                    </p>
                  </div>
                </td>
              </tr>
            </tbody>
          ) : (
            <>
              <MDTableHeader>
                <MDTableHeaderCell>Candidate</MDTableHeaderCell>
                <MDTableHeaderCell>Contact</MDTableHeaderCell>
                <MDTableHeaderCell>Job</MDTableHeaderCell>
                <MDTableHeaderCell>AI Score</MDTableHeaderCell>
                <MDTableHeaderCell>Interview Status</MDTableHeaderCell>
                <MDTableHeaderCell>Status</MDTableHeaderCell>
                <MDTableHeaderCell>Qualified Date</MDTableHeaderCell>
                <MDTableHeaderCell>Actions</MDTableHeaderCell>
              </MDTableHeader>
              <MDTableBody>
                {candidates.map((candidate) => (
                  <MDTableRow key={candidate.id}>
                    <MDTableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10 border-2 border-[#e91e63]/20">
                          <AvatarFallback className="bg-gradient-to-br from-[#EC407A] to-[#D81B60] text-white text-xs font-bold">
                            {getInitials(candidate.name)}
                          </AvatarFallback>
                        </Avatar>
                        <p className="text-sm font-semibold text-[#344767]">{candidate.name}</p>
                      </div>
                    </MDTableCell>
                    <MDTableCell>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-sm text-[#7b809a]">
                          <Mail className="h-3.5 w-3.5 flex-shrink-0" />
                          <a href={`mailto:${candidate.email}`} className="hover:text-[#e91e63] truncate">
                            {candidate.email}
                          </a>
                        </div>
                        {candidate.phone && (
                          <div className="flex items-center gap-2 text-sm text-[#7b809a]">
                            <Phone className="h-3.5 w-3.5 flex-shrink-0" />
                            <span>{candidate.phone}</span>
                          </div>
                        )}
                      </div>
                    </MDTableCell>
                    <MDTableCell>
                      {candidate.job_title ? (
                        <div className="flex items-center gap-2 text-sm text-[#7b809a]">
                          <Briefcase className="h-3.5 w-3.5 flex-shrink-0" />
                          <span className="truncate">{candidate.job_title}</span>
                        </div>
                      ) : (
                        <span className="text-xs text-[#7b809a]">-</span>
                      )}
                    </MDTableCell>
                    <MDTableCell>
                      {getScore(candidate) !== null ? (
                        <div className="flex items-center gap-2">
                          <Star className="h-4 w-4 fill-[#fb8c00] text-[#fb8c00]" />
                          <span className="font-bold text-lg text-[#344767]">{getScore(candidate)}%</span>
                        </div>
                      ) : (
                        <span className="text-xs text-[#7b809a]">-</span>
                      )}
                    </MDTableCell>
                    <MDTableCell>
                      {candidate.interview_status ? (
                        <Badge className="bg-[#1A73E8]/10 text-[#1A73E8] border border-[#1A73E8]/20">{candidate.interview_status}</Badge>
                      ) : (
                        <Badge className="bg-[#7b809a]/10 text-[#7b809a] border border-[#7b809a]/20">Pending</Badge>
                      )}
                    </MDTableCell>
                    <MDTableCell>
                      <Badge className="bg-[#4CAF50] text-white border-0 hover:bg-[#43A047]">
                        Qualified
                      </Badge>
                    </MDTableCell>
                    <MDTableCell>
                      <div className="flex items-center gap-2 text-sm text-[#7b809a]">
                        <Calendar className="h-3.5 w-3.5 flex-shrink-0" />
                        <span>{formatDate(candidate.created_at)}</span>
                      </div>
                    </MDTableCell>
                    <MDTableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedInterview(candidate);
                            setDetailModalOpen(true);
                          }}
                          className="hover:bg-[#e91e63]/10 hover:text-[#e91e63] text-[#7b809a]"
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          View
                        </Button>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="hover:bg-[#f0f2f5]">
                              <MoreVertical className="h-4 w-4 text-[#7b809a]" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-48 rounded-xl border-[#d2d6da]">
                            <DropdownMenuLabel className="text-[#344767] font-semibold">Actions</DropdownMenuLabel>
                            {candidate.cv_file_url && (
                              <DropdownMenuItem onClick={() => setCvViewerCandidate(candidate)} className="text-[#7b809a] focus:text-[#344767]">
                                <Eye className="mr-2 h-4 w-4" />
                                View CV
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem onClick={() => setEditCandidate(candidate)} className="text-[#7b809a] focus:text-[#344767]">
                              <PenSquare className="mr-2 h-4 w-4" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-[#F44335] focus:text-[#F44335]"
                              onClick={() => setDeleteCandidate(candidate)}
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </MDTableCell>
                  </MDTableRow>
                ))}
              </MDTableBody>
            </>
          )}
        </MDTable>
      </div>

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

      <InterviewDetailModal
        interview={selectedInterview as any}
        open={detailModalOpen}
        onOpenChange={setDetailModalOpen}
      />
    </DashboardLayout>
  );
};

export default InitialInterviewQualifiedPage;