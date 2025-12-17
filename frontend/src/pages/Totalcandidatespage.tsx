import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { candidatesApi } from "@/services/api";
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
        return "bg-blue-100 text-blue-800 border-blue-200";
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
        <div className="min-h-screen bg-[var(--gradient-subtle)] flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-[var(--gradient-subtle)]">
        {/* Main Content */}
        <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card className="shadow-elegant">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>AI Hiring - All Candidates</span>
              <Badge variant="secondary">{candidates.length} Total</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {candidates.length === 0 ? (
              <div className="text-center py-12">
                <Users className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Candidates Yet</h3>
                <p className="text-muted-foreground mb-4">
                  Import candidates or wait for applications
                </p>
                <Button onClick={() => navigate("/import-candidates")}>
                  Import Candidates
                </Button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Candidate</TableHead>
                      <TableHead>Contact</TableHead>
                      <TableHead>Source</TableHead>
                      <TableHead>Job Applied</TableHead>
                      <TableHead>AI Score</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Applied Date</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {candidates.map((candidate) => (
                      <TableRow key={candidate.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar className="h-10 w-10">
                              <AvatarFallback className="bg-gradient-to-br from-primary to-accent text-primary-foreground">
                                {getInitials(candidate.name || candidate.full_name || candidate.email)}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-semibold">{candidate.name || candidate.full_name || `${candidate.first_name || ''} ${candidate.last_name || ''}`.trim() || candidate.email}</p>
                              {candidate.Stage && (
                                <Badge variant="outline" className="text-xs mt-1">
                                  {candidate.Stage}
                                </Badge>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <div className="flex items-center gap-1 text-sm">
                              <Mail className="h-3 w-3" />
                              <a
                                href={`mailto:${candidate.email}`}
                                className="hover:text-primary"
                              >
                                {candidate.email}
                              </a>
                            </div>
                            {candidate.phone && (
                              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                <Phone className="h-3 w-3" />
                                {candidate.phone}
                              </div>
                            )}
                            {(candidate.location || candidate.city || candidate.state || candidate.country) && (
                              <div className="text-xs text-muted-foreground">
                                {[candidate.city, candidate.state, candidate.country].filter(Boolean).join(', ') || candidate.location}
                              </div>
                            )}
                            {candidate.experience_years !== null && candidate.experience_years !== undefined && (
                              <div className="text-xs text-muted-foreground">
                                {candidate.experience_years} {candidate.experience_years === 1 ? 'year' : 'years'} exp
                              </div>
                            )}
                            <div className="flex gap-2 mt-1">
                              {candidate.linkedin_url && (
                                <a
                                  href={candidate.linkedin_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-xs text-blue-600 hover:underline"
                                >
                                  LinkedIn
                                </a>
                              )}
                              {candidate.github_url && (
                                <a
                                  href={candidate.github_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-xs text-gray-600 hover:underline"
                                >
                                  GitHub
                                </a>
                              )}
                              {candidate.portfolio_url && (
                                <a
                                  href={candidate.portfolio_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-xs text-primary hover:underline"
                                >
                                  Portfolio
                                </a>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={getSourceColor(candidate.source)}>
                            {candidate.source}
                          </Badge>
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
                          <div className="flex flex-col gap-1">
                            {getScore(candidate) !== null ? (
                              <div className="flex items-center gap-1">
                                <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                                <span className="font-semibold">{getScore(candidate)}%</span>
                              </div>
                            ) : (
                              <span className="text-xs text-muted-foreground">-</span>
                            )}
                            {candidate.ats_recommendation && (
                              <span className="text-xs text-muted-foreground">
                                {candidate.ats_recommendation}
                              </span>
                            )}
                            {candidate.skills && candidate.skills.length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-1">
                                {candidate.skills.slice(0, 3).map((skill: string, idx: number) => (
                                  <Badge key={idx} variant="outline" className="text-xs">
                                    {skill}
                                  </Badge>
                                ))}
                                {candidate.skills.length > 3 && (
                                  <Badge variant="outline" className="text-xs">
                                    +{candidate.skills.length - 3}
                                  </Badge>
                                )}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          {candidate.interview_status ? (
                            <Badge variant="secondary">{candidate.interview_status}</Badge>
                          ) : (
                            <Badge variant="outline">Pending</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            <Calendar className="h-3 w-3" />
                            {formatDate(candidate.created_at)}
                          </div>
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-64">
                              <DropdownMenuLabel>Manage Candidate</DropdownMenuLabel>
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
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </main>

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
    </div>
    </DashboardLayout>
  );
};

export default TotalCandidatesPage;