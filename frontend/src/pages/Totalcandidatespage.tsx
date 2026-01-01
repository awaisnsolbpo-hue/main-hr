import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { candidatesApi } from "@/services/api";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Users,
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  MDDialog,
  MDDialogContent,
  MDDialogDescription,
  MDDialogFooter,
  MDDialogHeader,
  MDDialogTitle,
} from "@/components/ui/MDDialog";
import { Label } from "@/components/ui/label";
import { MDInput } from "@/components/ui/MDInput";
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
import {
  MDTable,
  MDTableHeader,
  MDTableHeaderCell,
  MDTableBody,
  MDTableRow,
  MDTableCell
} from "@/components/ui/MDTable";

interface Candidate {
  // Core fields from candidates table schema
  id: string;
  user_id?: string | null;
  job_id?: string | null;
  first_name?: string | null;
  last_name?: string | null;
  full_name?: string | null; // Generated column
  email: string;
  phone?: string | null;
  location?: string | null;
  city?: string | null;
  state?: string | null;
  country?: string | null;
  summary?: string | null;
  skills?: string[];
  experience_years?: number | null;
  total_experience_months?: number | null;
  education?: any; // jsonb
  linkedin_url?: string | null;
  github_url?: string | null;
  portfolio_url?: string | null;
  website_url?: string | null;
  cv_file_url?: string | null;
  cv_file_name?: string | null;
  cv_file_size?: number | null;
  status?: string | null;
  interview_status?: string | null;
  ats_score?: number | null;
  ats_breakdown?: any; // jsonb
  ats_recommendation?: string | null;
  import_source?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
  reviewed_at?: string | null;
  Work_Experience?: string | null;
  Projects?: string | null;
  ats_Weekness?: string | null;
  ats_strength?: string | null;
  matching_summary?: string | null;
  Stage?: string | null;
  // Computed/legacy fields for UI compatibility
  name?: string; // Computed from full_name or first_name + last_name
  ai_score?: number; // Alias for ats_score
  Score?: number; // Legacy field
  interview_date?: string; // Legacy field
  interview_result?: string; // Legacy field
  source: string; // Required for UI, can be 'candidates' | 'Shortlisted' | 'Final Interview'
  Analysis?: string; // Legacy field, maps to summary
  job_title?: string; // From jobs relation
  jobs?: {
    id?: string;
    title?: string;
    description?: string;
    status?: string;
    location?: string;
    city?: string;
    country?: string;
  };
}

const TotalCandidatesPage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [cvViewerCandidate, setCvViewerCandidate] = useState<Candidate | null>(null);
  const [editCandidate, setEditCandidate] = useState<Candidate | null>(null);
  const [deleteCandidate, setDeleteCandidate] = useState<Candidate | null>(null);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [editLoading, setEditLoading] = useState(false);
  const [editForm, setEditForm] = useState({
    name: "",
    email: "",
    phone: "",
    interview_status: "",
    ai_score: "",
    notes: "",
  });

  useEffect(() => {
    loadCandidates();
  }, []);

  useEffect(() => {
    if (editCandidate) {
      setEditForm({
        name: editCandidate.full_name || editCandidate.name || `${editCandidate.first_name || ''} ${editCandidate.last_name || ''}`.trim() || "",
        email: editCandidate.email || "",
        phone: editCandidate.phone || "",
        interview_status: editCandidate.interview_status || "",
        ai_score: getScore(editCandidate)?.toString() || "",
        notes: editCandidate.summary || editCandidate.Analysis || "",
      });
    }
  }, [editCandidate]);

  const loadCandidates = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/login");
        return;
      }

      // Fetch candidates via API
      const { candidates: applicants } = await candidatesApi.getAll();

      // Format candidates data with all schema fields
      const allCandidates: Candidate[] = (applicants || []).map((c: any) => ({
        ...c,
        // Compute name from available fields
        name: c.full_name || (c.first_name && c.last_name 
          ? `${c.first_name} ${c.last_name}`.trim() 
          : c.first_name || c.last_name || c.email),
        // Map score fields
        ai_score: c.ats_score || c.ai_score || null,
        Score: c.ats_score || c.Score || null,
        // Map linkedin URL
        linkedin_profile_url: c.linkedin_url || c.linkedin_profile_url || null,
        // Set source
        source: c.source || "candidates",
        // Job information
        job_title: c.jobs?.title,
        // Ensure arrays are arrays
        skills: Array.isArray(c.skills) ? c.skills : (c.skills ? [c.skills] : []),
        // Ensure numeric fields
        experience_years: c.experience_years ?? 0,
        total_experience_months: c.total_experience_months ?? null,
        ats_score: c.ats_score ? Number(c.ats_score) : null,
        // Ensure status defaults
        status: c.status || 'new',
        // Map legacy fields
        Analysis: c.summary || c.Analysis || null,
      }));
      setCandidates(allCandidates);
      console.log('📊 Total Candidates Loaded:', allCandidates.length);
    } catch (error: any) {
      console.error("Error loading candidates:", error);
      toast({
        title: "Error",
        description: "Failed to load candidates",
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

  const getSourceColor = (source: string) => {
    switch (source) {
      case "candidates":
        return "bg-blue-500 text-white border-blue-600";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const getScore = (candidate: Candidate) => {
    // Priority: ats_score > ai_score > Score
    if (candidate.ats_score != null) return Number(candidate.ats_score);
    if (candidate.ai_score != null) return candidate.ai_score;
    if (candidate.Score != null) return candidate.Score;
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

  const handleMoveCandidate = async (candidate: Candidate, destination: "qualified" | "shortlisted") => {
    try {
      setActionLoadingId(candidate.id);
      const { data: auth } = await supabase.auth.getUser();
      if (!auth?.user) {
        navigate("/login");
        return;
      }

      // Prepare payload with all candidate fields for moving
      const payload = {
        id: candidate.id,
        name: candidate.full_name || candidate.name || `${candidate.first_name || ''} ${candidate.last_name || ''}`.trim() || candidate.email,
        first_name: candidate.first_name,
        last_name: candidate.last_name,
        full_name: candidate.full_name || candidate.name,
        email: candidate.email,
        phone: candidate.phone || null,
        location: candidate.location || null,
        city: candidate.city || null,
        state: candidate.state || null,
        country: candidate.country || null,
        summary: candidate.summary || candidate.Analysis || null,
        skills: candidate.skills || [],
        experience_years: candidate.experience_years || 0,
        total_experience_months: candidate.total_experience_months || null,
        education: candidate.education || null,
        linkedin_url: candidate.linkedin_url || null,
        github_url: candidate.github_url || null,
        portfolio_url: candidate.portfolio_url || null,
        website_url: candidate.website_url || null,
        cv_file_url: candidate.cv_file_url || null,
        cv_file_name: candidate.cv_file_name || null,
        cv_file_size: candidate.cv_file_size || null,
        status: candidate.status || 'new',
        interview_status: candidate.interview_status || null,
        ats_score: candidate.ats_score || getScore(candidate) || null,
        ats_breakdown: candidate.ats_breakdown || null,
        ats_recommendation: candidate.ats_recommendation || null,
        source: candidate.source || 'manual_upload',
        import_source: candidate.import_source || null,
        job_id: candidate.job_id || null,
        user_id: auth.user.id,
        Work_Experience: candidate.Work_Experience || null,
        Projects: candidate.Projects || null,
        ats_Weekness: candidate.ats_Weekness || null,
        ats_strength: candidate.ats_strength || null,
        matching_summary: candidate.matching_summary || null,
        Stage: candidate.Stage || null,
        updated_at: new Date().toISOString(),
      };

      // Move candidate via API
      await candidatesApi.move(candidate.id, destination as 'qualified' | 'shortlisted');

      const newSource = destination === "qualified" ? "Final Interview" : "Shortlisted";
      setCandidates((prev) =>
        prev.map((c) =>
          c.id === candidate.id
            ? {
                ...c,
                source: newSource,
              }
            : c
        )
      );

      toast({
        title: "Candidate updated",
        description: `Moved to ${destination === "qualified" ? "Initial Interview Qualified" : "Shortlisted"} stage.`,
      });
      await loadCandidates();
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
      
      // Parse name into first_name and last_name if needed
      const nameParts = editForm.name.trim().split(' ');
      const firstName = nameParts[0] || null;
      const lastName = nameParts.slice(1).join(' ') || nameParts[0] || null;

      const updates: any = {
        first_name: firstName,
        last_name: lastName,
        email: editForm.email.trim(),
        phone: editForm.phone.trim() || null,
        interview_status: editForm.interview_status.trim() || null,
        updated_at: new Date().toISOString(),
      };

      if (editForm.ai_score) {
        const parsed = Number(editForm.ai_score);
        updates.ats_score = Number.isNaN(parsed) ? null : parsed;
      } else {
        updates.ats_score = null;
      }

      if (editForm.notes) {
        updates.summary = editForm.notes;
      }

      // Update candidate via API
      await candidatesApi.update(editCandidate.id, updates);

      setCandidates((prev) =>
        prev.map((candidate) =>
          candidate.id === editCandidate.id
            ? {
                ...candidate,
                ...updates,
                first_name: updates.first_name || candidate.first_name,
                last_name: updates.last_name || candidate.last_name,
                full_name: candidate.full_name || `${updates.first_name || ''} ${updates.last_name || ''}`.trim(),
                name: candidate.full_name || `${updates.first_name || ''} ${updates.last_name || ''}`.trim() || candidate.email,
                ats_score: updates.ats_score ?? candidate.ats_score,
                ai_score: updates.ats_score ?? candidate.ats_score,
                interview_status: updates.interview_status,
                summary: updates.summary || candidate.summary,
                Analysis: updates.summary || candidate.Analysis,
              }
            : candidate
        )
      );

      toast({
        title: "Candidate updated",
        description: "Details saved successfully.",
      });

      await loadCandidates();
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
      // Delete candidate via API
      await candidatesApi.delete(deleteCandidate.id);

      setCandidates((prev) => prev.filter((candidate) => candidate.id !== deleteCandidate.id));
      toast({
        title: "Candidate removed",
        description: `${deleteCandidate.name} has been deleted`,
      });
      await loadCandidates();
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
          <h1 className="text-2xl font-bold text-[#344767] mb-2">All Candidates</h1>
          <p className="text-sm font-light text-[#7b809a]">
            Manage and review all candidates in your pipeline
          </p>
        </div>

        {/* Material Dashboard Table */}
        <MDTable
          title="Candidate Database"
          headerActions={
            <Badge className="bg-gradient-to-br from-[#EC407A] to-[#D81B60] text-white border-0 shadow-pink">
              {candidates.length} Total
            </Badge>
          }
        >
          {candidates.length === 0 ? (
            <tbody>
              <tr>
                <td colSpan={8}>
                  <div className="text-center py-12">
                    <Users className="h-16 w-16 text-[#7b809a] mx-auto mb-4 opacity-50" />
                    <h3 className="text-lg font-semibold text-[#344767] mb-2">No Candidates Yet</h3>
                    <p className="text-sm font-light text-[#7b809a] mb-4">
                      Import candidates or wait for applications
                    </p>
                    <Button
                      onClick={() => navigate("/recruiter/import-candidates")}
                      className="bg-gradient-to-r from-[#EC407A] to-[#D81B60] text-white border-0 shadow-pink hover:shadow-md transition-all duration-200"
                    >
                      Import Candidates
                    </Button>
                  </div>
                </td>
              </tr>
            </tbody>
          ) : (
            <>
              <MDTableHeader>
                <MDTableHeaderCell>Candidate</MDTableHeaderCell>
                <MDTableHeaderCell>Contact</MDTableHeaderCell>
                <MDTableHeaderCell>Source</MDTableHeaderCell>
                <MDTableHeaderCell>Job Applied</MDTableHeaderCell>
                <MDTableHeaderCell>AI Score</MDTableHeaderCell>
                <MDTableHeaderCell>Status</MDTableHeaderCell>
                <MDTableHeaderCell>Applied Date</MDTableHeaderCell>
                <MDTableHeaderCell>Actions</MDTableHeaderCell>
              </MDTableHeader>
              <MDTableBody>
                    {candidates.map((candidate) => (
                      <MDTableRow key={candidate.id}>
                        <MDTableCell>
                          <div className="flex items-center gap-3">
                            <Avatar className="h-10 w-10 border-2 border-[#e91e63]/20">
                              <AvatarFallback className="bg-gradient-to-br from-[#EC407A] to-[#D81B60] text-white text-xs font-bold">
                                {getInitials(candidate.name || candidate.full_name || candidate.email)}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="text-sm font-semibold text-[#344767]">{candidate.name || candidate.full_name || `${candidate.first_name || ''} ${candidate.last_name || ''}`.trim() || candidate.email}</p>
                              {candidate.Stage && (
                                <Badge className="bg-[#1A73E8]/10 text-[#1A73E8] border border-[#1A73E8]/20 text-xs mt-1">
                                  {candidate.Stage}
                                </Badge>
                              )}
                            </div>
                          </div>
                        </MDTableCell>
                        <MDTableCell>
                          <div className="space-y-1">
                            <div className="flex items-center gap-1 text-sm text-[#7b809a]">
                              <Mail className="h-3 w-3" />
                              <a
                                href={`mailto:${candidate.email}`}
                                className="hover:text-[#e91e63] transition-colors"
                              >
                                {candidate.email}
                              </a>
                            </div>
                            {candidate.phone && (
                              <div className="flex items-center gap-1 text-sm text-[#7b809a]">
                                <Phone className="h-3 w-3" />
                                {candidate.phone}
                              </div>
                            )}
                            {(candidate.location || candidate.city || candidate.state || candidate.country) && (
                              <div className="text-xs font-light text-[#7b809a]">
                                {[candidate.city, candidate.state, candidate.country].filter(Boolean).join(', ') || candidate.location}
                              </div>
                            )}
                            {candidate.experience_years !== null && candidate.experience_years !== undefined && (
                              <div className="text-xs font-light text-[#7b809a]">
                                {candidate.experience_years} {candidate.experience_years === 1 ? 'year' : 'years'} exp
                              </div>
                            )}
                            <div className="flex gap-2 mt-1">
                              {candidate.linkedin_url && (
                                <a
                                  href={candidate.linkedin_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-xs text-[#1A73E8] hover:underline"
                                >
                                  LinkedIn
                                </a>
                              )}
                              {candidate.github_url && (
                                <a
                                  href={candidate.github_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-xs text-[#344767] hover:underline"
                                >
                                  GitHub
                                </a>
                              )}
                              {candidate.portfolio_url && (
                                <a
                                  href={candidate.portfolio_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-xs text-[#e91e63] hover:underline"
                                >
                                  Portfolio
                                </a>
                              )}
                            </div>
                          </div>
                        </MDTableCell>
                        <MDTableCell>
                          <Badge className="bg-[#1A73E8]/10 text-[#1A73E8] border border-[#1A73E8]/20">
                            {candidate.source}
                          </Badge>
                        </MDTableCell>
                        <MDTableCell>
                          {candidate.job_title ? (
                            <div className="flex items-center gap-1 text-sm text-[#7b809a]">
                              <Briefcase className="h-3 w-3" />
                              {candidate.job_title}
                            </div>
                          ) : (
                            <span className="text-xs text-[#7b809a]">-</span>
                          )}
                        </MDTableCell>
                        <MDTableCell>
                          <div className="flex flex-col gap-1">
                            {getScore(candidate) !== null ? (
                              <div className="flex items-center gap-1">
                                <Star className="h-3 w-3 fill-[#fb8c00] text-[#fb8c00]" />
                                <span className="text-sm font-semibold text-[#344767]">{getScore(candidate)}%</span>
                              </div>
                            ) : (
                              <span className="text-xs text-[#7b809a]">-</span>
                            )}
                            {candidate.ats_recommendation && (
                              <span className="text-xs font-light text-[#7b809a]">
                                {candidate.ats_recommendation}
                              </span>
                            )}
                            {candidate.skills && candidate.skills.length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-1">
                                {candidate.skills.slice(0, 3).map((skill: string, idx: number) => (
                                  <Badge key={idx} className="bg-[#4CAF50]/10 text-[#4CAF50] border border-[#4CAF50]/20 text-xs">
                                    {skill}
                                  </Badge>
                                ))}
                                {candidate.skills.length > 3 && (
                                  <Badge className="bg-[#7b809a]/10 text-[#7b809a] border border-[#7b809a]/20 text-xs">
                                    +{candidate.skills.length - 3}
                                  </Badge>
                                )}
                              </div>
                            )}
                          </div>
                        </MDTableCell>
                        <MDTableCell>
                          {candidate.interview_status ? (
                            <Badge className="bg-[#1A73E8] text-white border-0 hover:bg-[#1662C4]">{candidate.interview_status}</Badge>
                          ) : (
                            <Badge className="bg-[#7b809a]/10 text-[#7b809a] border border-[#7b809a]/20">Pending</Badge>
                          )}
                        </MDTableCell>
                        <MDTableCell>
                          <div className="flex items-center gap-1 text-sm text-[#7b809a]">
                            <Calendar className="h-3 w-3" />
                            {formatDate(candidate.created_at)}
                          </div>
                        </MDTableCell>
                        <MDTableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="hover:bg-[#e91e63]/10 hover:text-[#e91e63]">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-64 rounded-xl shadow-md-lg">
                              <DropdownMenuLabel className="text-[#344767] font-bold">Manage Candidate</DropdownMenuLabel>
                              {candidate.cv_file_url ? (
                                <DropdownMenuItem onClick={() => setCvViewerCandidate(candidate)} className="text-[#7b809a] hover:text-[#344767] hover:bg-[#f0f2f5]">
                                  <Eye className="mr-2 h-4 w-4" />
                                  View CV
                                </DropdownMenuItem>
                              ) : (
                                <DropdownMenuItem disabled className="text-[#7b809a]">
                                  <Eye className="mr-2 h-4 w-4" />
                                  No CV Uploaded
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuSeparator className="bg-[#dee2e6]" />
                              <DropdownMenuItem onClick={() => setEditCandidate(candidate)} className="text-[#7b809a] hover:text-[#344767] hover:bg-[#f0f2f5]">
                                <PenSquare className="mr-2 h-4 w-4" />
                                Edit Candidate
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                className="text-[#F44335] focus:text-[#F44335] hover:bg-[#F44335]/10"
                                onClick={() => setDeleteCandidate(candidate)}
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete Candidate
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </MDTableCell>
                      </MDTableRow>
                    ))}
                  </MDTableBody>
            </>
          )}
        </MDTable>
      </div>

      {/* Material Dashboard Modals */}
      <MDDialog open={!!cvViewerCandidate} onOpenChange={(open) => !open && setCvViewerCandidate(null)}>
        <MDDialogContent className="max-w-3xl">
          <MDDialogHeader>
            <MDDialogTitle>Candidate CV</MDDialogTitle>
            <MDDialogDescription>
              {cvViewerCandidate?.name} &middot; {cvViewerCandidate?.email}
            </MDDialogDescription>
          </MDDialogHeader>
          <div className="space-y-4">
            {cvViewerCandidate?.cv_file_url ? (
              <div className="h-[500px] rounded-xl border border-[#dee2e6]">
                <iframe
                  src={cvViewerCandidate.cv_file_url}
                  title="Candidate CV"
                  className="w-full h-full rounded-xl"
                />
              </div>
            ) : (
              <p className="text-sm font-light text-[#7b809a]">No CV uploaded for this candidate.</p>
            )}
          </div>
          <MDDialogFooter>
            <Button
              variant="outline"
              onClick={() => setCvViewerCandidate(null)}
              className="border-[#dee2e6] text-[#7b809a] hover:bg-[#f0f2f5]"
            >
              Close
            </Button>
            {cvViewerCandidate?.cv_file_url && (
              <Button
                onClick={() => handleDownloadCV(cvViewerCandidate.cv_file_url!)}
                className="bg-gradient-to-r from-[#EC407A] to-[#D81B60] text-white border-0 shadow-pink hover:shadow-md transition-all duration-200"
              >
                <Download className="mr-2 h-4 w-4" />
                Download CV
              </Button>
            )}
          </MDDialogFooter>
        </MDDialogContent>
      </MDDialog>

      <MDDialog open={!!editCandidate} onOpenChange={(open) => !open && setEditCandidate(null)}>
        <MDDialogContent>
          <MDDialogHeader>
            <MDDialogTitle>Edit Candidate</MDDialogTitle>
            <MDDialogDescription>Update the candidate information and save changes.</MDDialogDescription>
          </MDDialogHeader>
          <div className="space-y-4">
            <MDInput
              label="Name"
              id="edit-name"
              value={editForm.name}
              onChange={(e) => setEditForm((prev) => ({ ...prev, name: e.target.value }))}
            />
            <MDInput
              label="Email"
              id="edit-email"
              type="email"
              value={editForm.email}
              onChange={(e) => setEditForm((prev) => ({ ...prev, email: e.target.value }))}
            />
            <MDInput
              label="Phone"
              id="edit-phone"
              value={editForm.phone}
              onChange={(e) => setEditForm((prev) => ({ ...prev, phone: e.target.value }))}
            />
            <MDInput
              label="Interview Status"
              id="edit-status"
              value={editForm.interview_status}
              onChange={(e) => setEditForm((prev) => ({ ...prev, interview_status: e.target.value }))}
            />
            <MDInput
              label="AI Score"
              id="edit-score"
              value={editForm.ai_score}
              onChange={(e) => setEditForm((prev) => ({ ...prev, ai_score: e.target.value }))}
            />
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-[#344767]">Notes</label>
              <Textarea
                id="edit-notes"
                rows={4}
                value={editForm.notes}
                onChange={(e) => setEditForm((prev) => ({ ...prev, notes: e.target.value }))}
                className="rounded-xl border-[#d2d6da] focus:border-[#e91e63] focus:ring-2 focus:ring-[#e91e63]/20"
              />
            </div>
          </div>
          <MDDialogFooter>
            <Button
              variant="outline"
              onClick={() => setEditCandidate(null)}
              className="border-[#dee2e6] text-[#7b809a] hover:bg-[#f0f2f5]"
            >
              Cancel
            </Button>
            <Button
              onClick={handleEditSubmit}
              disabled={editLoading}
              className="bg-gradient-to-r from-[#EC407A] to-[#D81B60] text-white border-0 shadow-pink hover:shadow-md transition-all duration-200"
            >
              {editLoading ? "Saving..." : "Save changes"}
            </Button>
          </MDDialogFooter>
        </MDDialogContent>
      </MDDialog>

      <AlertDialog open={!!deleteCandidate} onOpenChange={(open) => !open && setDeleteCandidate(null)}>
        <AlertDialogContent className="rounded-2xl shadow-md-xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl font-bold text-[#344767]">Delete candidate</AlertDialogTitle>
            <AlertDialogDescription className="text-sm font-light text-[#7b809a]">
              This action cannot be undone. This will permanently remove{" "}
              <span className="font-semibold text-[#344767]">{deleteCandidate?.name}</span> from your candidates list.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() => setDeleteCandidate(null)}
              className="border-[#dee2e6] text-[#7b809a] hover:bg-[#f0f2f5]"
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteCandidateConfirm}
              disabled={actionLoadingId === deleteCandidate?.id}
              className="bg-[#F44335] text-white hover:bg-[#E53935] border-0"
            >
              {actionLoadingId === deleteCandidate?.id ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
};

export default TotalCandidatesPage;