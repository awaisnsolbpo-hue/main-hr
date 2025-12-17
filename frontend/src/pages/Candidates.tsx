import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
    ArrowLeft,
    Search,
    Download,
    Calendar,
    MoreVertical,
    Eye,
    PenSquare,
    Trash2,
    FileText,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { candidatesApi } from "@/services/api";
import DashboardLayout from "@/components/DashboardLayout";
import DashboardHeader from "@/components/DashboardHeader";
import PageBackground from "@/components/PageBackground";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import ScheduleMeetingDialog from "@/components/ScheduleMeetingDialog";
import { CandidateDetailModal } from "@/components/candidates/CandidateDetailModal";
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
    source?: string | null;
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
    source: 'candidates' | 'Shortlisted' | 'Final Interview';
    stage_priority: number;
    Transcript?: string;
    'Recording URL'?: string;
    'Screen recording'?: string;
    Analysis?: string;
    'Question Ask by Client'?: string;
    'AI Generated Question'?: string;
    linkedin_profile_url?: string; // Alias for linkedin_url
    applied_via_linkedin?: boolean;
    source_linkedin?: boolean;
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

const Candidates = () => {
    const navigate = useNavigate();
    const { toast } = useToast();
    const [searchParams] = useSearchParams();

    const [candidates, setCandidates] = useState<Candidate[]>([]);
    const [filteredCandidates, setFilteredCandidates] = useState<Candidate[]>([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [loading, setLoading] = useState(true);
    const [filterSource] = useState<string>("all");
    const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);
    const [detailModalOpen, setDetailModalOpen] = useState(false);
    const [detailCandidate, setDetailCandidate] = useState<Candidate | null>(null);
    const [scheduleDialogOpen, setScheduleDialogOpen] = useState(false);
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

    const tableFilter = searchParams.get('table');

    useEffect(() => {
        fetchCandidates();
    }, [tableFilter]);

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

    useEffect(() => {
        let filtered = candidates;

        if (filterSource !== "all") {
            filtered = filtered.filter((c) => c.source === filterSource);
        }

        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            filtered = filtered.filter(
                (c) =>
                    (c.name || c.full_name || `${c.first_name || ''} ${c.last_name || ''}`.trim() || '').toLowerCase().includes(query) ||
                    c.email.toLowerCase().includes(query) ||
                    c.phone?.toLowerCase().includes(query) ||
                    c.jobs?.title?.toLowerCase().includes(query) ||
                    c.location?.toLowerCase().includes(query) ||
                    c.city?.toLowerCase().includes(query) ||
                    (c.skills && c.skills.some((skill: string) => skill.toLowerCase().includes(query)))
            );
        }

        setFilteredCandidates(filtered);
    }, [searchQuery, candidates, filterSource]);

    const fetchCandidates = async () => {
        try {
            const { data: auth } = await supabase.auth.getUser();
            if (!auth?.user) {
                navigate("/login");
                return;
            }

            setLoading(true);

            // Fetch candidates via API
            const { candidates: data } = await candidatesApi.getAll();

            const loaded = (data || []).map((c: any) => ({
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
                // Set source and priority
                source: "candidates" as const,
                stage_priority: 2,
                // Ensure arrays are arrays
                skills: Array.isArray(c.skills) ? c.skills : (c.skills ? [c.skills] : []),
                // Ensure numeric fields
                experience_years: c.experience_years ?? 0,
                total_experience_months: c.total_experience_months ?? null,
                ats_score: c.ats_score ? Number(c.ats_score) : null,
                // Ensure status defaults
                status: c.status || 'new',
                source: c.source || 'manual_upload',
            }));

            setCandidates(loaded);
        } catch (error: any) {
            console.error("Fetch error:", error);
            toast({
                title: "Error",
                description: error.message || "Failed to fetch candidates",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    const handleScheduleMeeting = (candidate: Candidate) => {
        setSelectedCandidate(candidate);
        setScheduleDialogOpen(true);
    };

    const getInterviewStatusBadge = (status?: string) => {
        if (!status) return <Badge variant="outline">Pending</Badge>;

        const variants: Record<string, "default" | "secondary" | "outline" | "destructive"> = {
            pending: "outline",
            scheduled: "secondary",
            completed: "default",
            passed: "default",
            failed: "destructive",
        };
        return <Badge variant={variants[status.toLowerCase()] || "outline"}>{status}</Badge>;
    };

    const getSourceBadge = (source: Candidate['source']) => {
        const sourceConfig = {
            'candidates': { variant: 'outline' as const, label: 'Candidate', color: 'bg-blue-100 text-blue-800' },
            'Shortlisted': { variant: 'default' as const, label: 'Shortlisted', color: 'bg-primary/10 text-primary dark:bg-primary/20 dark:text-primary' },
            'Final Interview': { variant: 'secondary' as const, label: 'Final Interview', color: 'bg-green-100 text-green-800' }
        };

        const config = sourceConfig[source] || { variant: 'outline' as const, label: source || 'Unknown', color: 'bg-gray-100 text-gray-800' };
        return <Badge variant={config.variant} className={config.color}>{config.label}</Badge>;
    };

    const getScore = (candidate: Candidate) => {
        // Priority: ats_score > ai_score > Score
        if (candidate.ats_score != null) return Number(candidate.ats_score);
        if (candidate.ai_score != null) return candidate.ai_score;
        if (candidate.Score != null) return candidate.Score;
        return null;
    };

    const getPageTitle = () => {
        if (tableFilter === 'qualified') return 'Qualified for Final Interview';
        if (tableFilter === 'shortlisted') return 'Shortlisted Candidates';
        return 'All Candidates';
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

            const payload = {
                id: candidate.id,
                name: candidate.name || candidate.full_name || candidate.email,
                email: candidate.email,
                phone: candidate.phone || null,
                ai_score: getScore(candidate),
                cv_file_url: candidate.cv_file_url || null,
                job_id: candidate.job_id || null,
                user_id: auth.user.id,
                interview_status: candidate.interview_status || null,
                interview_date: candidate.interview_date || null,
                interview_result: candidate.interview_result || null,
                status: candidate.source,
                notes: candidate.Analysis || null,
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
                            source: newSource as Candidate['source'],
                        }
                        : c
                )
            );

            toast({
                title: "Candidate updated",
                description: `Moved to ${destination === "qualified" ? "Initial Interview Qualified" : "Shortlisted"} stage.`,
            });
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
                full_name: editForm.name.trim(),
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

            // Update candidate via API
            await candidatesApi.update(editCandidate.id, updates);

            setCandidates((prev) =>
                prev.map((candidate) =>
                    candidate.id === editCandidate.id
                        ? {
                            ...candidate,
                            ...updates,
                            name: updates.full_name || candidate.name || candidate.full_name,
                            full_name: updates.full_name || candidate.full_name,
                            ai_score: updates.ai_score ?? candidate.ai_score,
                            interview_status: updates.interview_status,
                        }
                        : candidate
                )
            );

            toast({
                title: "Candidate updated",
                description: "Details saved successfully.",
            });

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
                description: `${deleteCandidate.name || deleteCandidate.full_name || deleteCandidate.email} has been deleted`,
            });
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

    // Background image for page
    const backgroundImage = "/assets/images/Whisk_579a33e11562e8e91524ff66af317885dr.jpeg";

    return (
        <DashboardLayout>
            <DashboardHeader 
                title={getPageTitle()}
                description={`Total: ${filteredCandidates.length} candidates`}
            />

            <main className="flex-1 overflow-y-auto overflow-x-hidden bg-background relative min-h-0">
                <PageBackground imagePath={backgroundImage} />
                
                <div className="page-container relative z-10 min-h-full">
                    <div className="page-content">
                        {tableFilter && (
                            <div className="flex justify-end">
                                <Button variant="outline" onClick={() => navigate('/candidates')} className="w-full sm:w-auto">
                                    <ArrowLeft className="h-4 w-4 mr-2" />
                                    View All Candidates
                                </Button>
                            </div>
                        )}

                        <Card>
                            <CardContent className="pt-6">
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        placeholder="Search by name, email, or job title..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="pl-10"
                                    />
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>Candidate List</CardTitle>
                            </CardHeader>
                            <CardContent>
                                {loading ? (
                                    <div className="text-center py-8">
                                        <div className="h-8 w-8 animate-spin text-primary mx-auto mb-4">...</div>
                                        <p className="text-muted-foreground">Loading candidates...</p>
                                    </div>
                            ) : filteredCandidates.length === 0 ? (
                                <div className="text-center py-8 text-muted-foreground">
                                    No candidates found
                                </div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Name</TableHead>
                                                <TableHead>Email</TableHead>
                                                <TableHead>Phone</TableHead>
                                                <TableHead>Job</TableHead>
                                                <TableHead>Score</TableHead>
                                                <TableHead>Actions</TableHead>
                                            </TableRow>
                                        </TableHeader>

                                        <TableBody>
                                            {filteredCandidates.map((candidate) => (
                                                <TableRow key={candidate.id}>
                                                    <TableCell className="font-medium">
                                                        <span className="text-sm">{candidate.name || candidate.full_name || candidate.email}</span>
                                                    </TableCell>

                                                    <TableCell>
                                                        <a href={`mailto:${candidate.email}`} className="hover:text-primary text-sm font-medium">
                                                            {candidate.email}
                                                        </a>
                                                    </TableCell>

                                                    <TableCell>
                                                        <span className="text-sm font-medium">{candidate.phone || "N/A"}</span>
                                                    </TableCell>

                                                    <TableCell>
                                                        <span className="text-sm font-medium">{candidate.jobs?.title || "N/A"}</span>
                                                    </TableCell>

                                                    <TableCell>
                                                        {getScore(candidate) !== null ? (
                                                            <Badge variant="secondary" className="font-semibold">{getScore(candidate)}%</Badge>
                                                        ) : (
                                                            <span className="text-sm text-muted-foreground">N/A</span>
                                                        )}
                                                    </TableCell>

                                                    <TableCell>
                                                        <div className="flex items-center gap-2">
                                                            <Button
                                                                variant="outline"
                                                                size="sm"
                                                                onClick={() => {
                                                                    setDetailCandidate(candidate);
                                                                    setDetailModalOpen(true);
                                                                }}
                                                            >
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
                                                                    <DropdownMenuItem onClick={() => navigate(`/candidates/${candidate.id}`)}>
                                                                        <Eye className="mr-2 h-4 w-4" />
                                                                        View Full Details
                                                                    </DropdownMenuItem>
                                                                    {candidate.cv_file_url ? (
                                                                        <DropdownMenuItem onClick={() => setCvViewerCandidate(candidate)}>
                                                                            <FileText className="mr-2 h-4 w-4" />
                                                                            View CV
                                                                        </DropdownMenuItem>
                                                                    ) : (
                                                                        <DropdownMenuItem disabled>
                                                                            <FileText className="mr-2 h-4 w-4" />
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
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>
                            )}
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </main>

            {selectedCandidate && (
                <ScheduleMeetingDialog
                    candidate={selectedCandidate}
                    open={scheduleDialogOpen}
                    onOpenChange={setScheduleDialogOpen}
                    onSuccess={fetchCandidates}
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
                                onChange={(e) =>
                                    setEditForm((prev) => ({ ...prev, interview_status: e.target.value }))
                                }
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
                            <span className="font-semibold">{deleteCandidate?.name || deleteCandidate?.full_name || deleteCandidate?.email}</span> from your candidates list.
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

            <CandidateDetailModal
                candidate={detailCandidate}
                open={detailModalOpen}
                onOpenChange={setDetailModalOpen}
            />
        </DashboardLayout>
    );
};

export default Candidates;
