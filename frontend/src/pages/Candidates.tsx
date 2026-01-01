import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
    Search,
    Download,
    Calendar,
    MoreVertical,
    Eye,
    PenSquare,
    Trash2,
    FileText,
    XCircle,
    CheckCircle,
    CheckCircle2,
    Mail,
    Phone,
    Briefcase,
    Star,
    Loader2,
    Users,
    ArrowLeft,
} from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { candidatesApi } from "@/services/api";
import DashboardLayout from "@/components/DashboardLayout";
import { MDTable } from "@/components/ui/MDTable";
import { MDInput } from "@/components/ui/MDInput";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
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
    const [statusFilter, setStatusFilter] = useState("all");
    const [scoreFilter, setScoreFilter] = useState("all");

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

        // Source filter
        if (filterSource !== "all") {
            filtered = filtered.filter((c) => c.source === filterSource);
        }

        // Status filter
        if (statusFilter !== "all") {
            filtered = filtered.filter((c) => {
                const status = (c.interview_status || c.status || "").toLowerCase();
                return status === statusFilter.toLowerCase();
            });
        }

        // Score filter
        if (scoreFilter !== "all") {
            const minScore = parseInt(scoreFilter);
            filtered = filtered.filter((c) => {
                const score = getScore(c);
                return score !== null && score >= minScore;
            });
        }

        // Search filter
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
    }, [searchQuery, candidates, filterSource, statusFilter, scoreFilter]);

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
                source: c.source || 'manual_upload',
                stage_priority: 2,
                // Ensure arrays are arrays
                skills: Array.isArray(c.skills) ? c.skills : (c.skills ? [c.skills] : []),
                // Ensure numeric fields
                experience_years: c.experience_years ?? 0,
                total_experience_months: c.total_experience_months ?? null,
                ats_score: c.ats_score ? Number(c.ats_score) : null,
                // Ensure status defaults
                status: c.status || 'new',
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

    const getInitials = (name: string) => {
        return name
            .split(" ")
            .map((n) => n[0])
            .join("")
            .toUpperCase()
            .slice(0, 2);
    };

    const getInterviewStatusBadge = (status?: string) => {
        if (!status) return <Badge className="bg-[#7b809a]/10 text-[#7b809a] border border-[#7b809a]/20">Pending</Badge>;

        const statusLower = status.toLowerCase();

        if (statusLower.includes("pending")) {
            return <Badge className="bg-[#fb8c00]/10 text-[#fb8c00] border border-[#fb8c00]/20">Pending</Badge>;
        }
        if (statusLower.includes("scheduled")) {
            return <Badge className="bg-[#1A73E8]/10 text-[#1A73E8] border border-[#1A73E8]/20">Scheduled</Badge>;
        }
        if (statusLower.includes("completed") || statusLower.includes("passed")) {
            return <Badge className="bg-[#4CAF50] text-white border-0"><CheckCircle className="h-3 w-3 mr-1" />Completed</Badge>;
        }
        if (statusLower.includes("failed")) {
            return <Badge className="bg-[#F44335] text-white border-0"><XCircle className="h-3 w-3 mr-1" />Failed</Badge>;
        }

        return <Badge className="bg-[#7b809a]/10 text-[#7b809a] border border-[#7b809a]/20">{status}</Badge>;
    };

    const getScoreColor = (score: number | null) => {
        if (!score) return "text-[#7b809a]";
        if (score >= 80) return "text-[#4CAF50]";
        if (score >= 60) return "text-[#fb8c00]";
        return "text-[#F44335]";
    };

    const getSourceBadge = (source: Candidate['source']) => {
        const sourceConfig = {
            'candidates': { variant: 'outline' as const, label: 'Candidate', color: 'bg-blue-500 text-white border-blue-600' },
            'Shortlisted': { variant: 'default' as const, label: 'Shortlisted', color: 'bg-primary text-white dark:bg-primary dark:text-white' },
            'Final Interview': { variant: 'secondary' as const, label: 'Final Interview', color: 'bg-green-500 text-white' }
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

    // Calculate summary metrics
    const totalCandidates = filteredCandidates.length;
    const scheduledCount = filteredCandidates.filter(c => c.interview_status === 'scheduled').length;
    const completedCount = filteredCandidates.filter(c => c.interview_status === 'completed').length;
    const avgScore = filteredCandidates.length > 0
        ? Math.round(filteredCandidates.reduce((sum, c) => sum + (getScore(c) || 0), 0) / filteredCandidates.length)
        : 0;

    return (
        <DashboardLayout>
            <main className="flex-1 overflow-y-auto bg-[#f0f2f5] p-6">
                {/* Page Header */}
                <div className="mb-6">
                    <h1 className="text-2xl font-bold text-[#344767] mb-1">{getPageTitle()}</h1>
                    <p className="text-sm text-[#7b809a]">Manage and track all candidates in your recruitment pipeline</p>
                </div>

                {tableFilter && (
                    <div className="mb-4">
                        <Button variant="outline" onClick={() => navigate('/candidates')} className="w-full sm:w-auto">
                            <ArrowLeft className="h-4 w-4 mr-2" />
                            View All Candidates
                        </Button>
                    </div>
                )}

                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                    <div className="bg-white rounded-xl shadow-md-lg p-4 border border-[#d2d6da]">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs font-semibold text-[#7b809a] uppercase mb-1">Total Candidates</p>
                                <h3 className="text-2xl font-bold text-[#344767]">{totalCandidates}</h3>
                            </div>
                            <div className="w-12 h-12 bg-gradient-to-br from-[#EC407A] to-[#D81B60] rounded-xl flex items-center justify-center shadow-lg">
                                <Users className="h-6 w-6 text-white" />
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-xl shadow-md-lg p-4 border border-[#d2d6da]">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs font-semibold text-[#7b809a] uppercase mb-1">Scheduled</p>
                                <h3 className="text-2xl font-bold text-[#344767]">{scheduledCount}</h3>
                            </div>
                            <div className="w-12 h-12 bg-gradient-to-br from-[#1A73E8] to-[#49a3f1] rounded-xl flex items-center justify-center shadow-lg">
                                <Calendar className="h-6 w-6 text-white" />
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-xl shadow-md-lg p-4 border border-[#d2d6da]">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs font-semibold text-[#7b809a] uppercase mb-1">Completed</p>
                                <h3 className="text-2xl font-bold text-[#344767]">{completedCount}</h3>
                            </div>
                            <div className="w-12 h-12 bg-gradient-to-br from-[#4CAF50] to-[#66BB6A] rounded-xl flex items-center justify-center shadow-lg">
                                <CheckCircle2 className="h-6 w-6 text-white" />
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-xl shadow-md-lg p-4 border border-[#d2d6da]">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs font-semibold text-[#7b809a] uppercase mb-1">Avg Score</p>
                                <h3 className="text-2xl font-bold text-[#344767]">{avgScore}%</h3>
                            </div>
                            <div className="w-12 h-12 bg-gradient-to-br from-[#fb8c00] to-[#ffa726] rounded-xl flex items-center justify-center shadow-lg">
                                <Star className="h-6 w-6 text-white" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Filters */}
                <div className="bg-white rounded-xl shadow-md-lg p-4 mb-6 border border-[#d2d6da]">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#7b809a]" />
                            <MDInput
                                placeholder="Search by name, email, or job title..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-10"
                            />
                        </div>

                        <Select value={statusFilter} onValueChange={setStatusFilter}>
                            <SelectTrigger className="border-[#d2d6da] focus:border-[#e91e63] focus:ring-[#e91e63]">
                                <SelectValue placeholder="Filter by Status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Statuses</SelectItem>
                                <SelectItem value="pending">Pending</SelectItem>
                                <SelectItem value="scheduled">Scheduled</SelectItem>
                                <SelectItem value="completed">Completed</SelectItem>
                                <SelectItem value="passed">Passed</SelectItem>
                                <SelectItem value="rejected">Rejected</SelectItem>
                            </SelectContent>
                        </Select>

                        <Select value={scoreFilter} onValueChange={setScoreFilter}>
                            <SelectTrigger className="border-[#d2d6da] focus:border-[#e91e63] focus:ring-[#e91e63]">
                                <SelectValue placeholder="Filter by Score" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Scores</SelectItem>
                                <SelectItem value="80">80% and above</SelectItem>
                                <SelectItem value="60">60% and above</SelectItem>
                                <SelectItem value="40">40% and above</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                {/* Candidates Table */}
                {loading ? (
                    <div className="bg-white rounded-xl shadow-md-lg p-12 text-center border border-[#d2d6da]">
                        <Loader2 className="h-8 w-8 animate-spin text-[#e91e63] mx-auto mb-4" />
                        <p className="text-[#7b809a]">Loading candidates...</p>
                    </div>
                ) : filteredCandidates.length === 0 ? (
                    <div className="bg-white rounded-xl shadow-md-lg p-12 text-center border border-[#d2d6da]">
                        <Users className="h-12 w-12 text-[#7b809a] mx-auto mb-4 opacity-50" />
                        <p className="text-[#7b809a]">No candidates found</p>
                    </div>
                ) : (
                    <MDTable
                        title="Candidates List"
                        headerActions={
                            <Badge className="bg-gradient-to-br from-[#EC407A] to-[#D81B60] text-white border-0 shadow-pink">
                                {filteredCandidates.length} Total
                            </Badge>
                        }
                    >
                        <TableHeader>
                            <TableRow className="bg-gradient-to-r from-[#EC407A] to-[#D81B60] hover:from-[#EC407A] hover:to-[#D81B60]">
                                <TableHead className="text-white font-bold text-xs uppercase">Candidate</TableHead>
                                <TableHead className="text-white font-bold text-xs uppercase">Contact</TableHead>
                                <TableHead className="text-white font-bold text-xs uppercase">Job</TableHead>
                                <TableHead className="text-white font-bold text-xs uppercase">Score</TableHead>
                                <TableHead className="text-white font-bold text-xs uppercase">Status</TableHead>
                                <TableHead className="text-white font-bold text-xs uppercase">Date</TableHead>
                                <TableHead className="text-white font-bold text-xs uppercase">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredCandidates.map((candidate) => (
                                <TableRow key={candidate.id} className="border-b border-[#d2d6da] hover:bg-[#f0f2f5]">
                                    <TableCell>
                                        <div className="flex items-center gap-3">
                                            <Avatar className="h-10 w-10 flex-shrink-0 border-2 border-[#e91e63]">
                                                <AvatarFallback className="bg-gradient-to-br from-[#EC407A] to-[#D81B60] text-white font-semibold">
                                                    {getInitials(candidate.name || candidate.full_name || candidate.email || '')}
                                                </AvatarFallback>
                                            </Avatar>
                                            <div className="min-w-0">
                                                <p className="font-semibold text-[#344767] truncate">{candidate.name || candidate.full_name || candidate.email}</p>
                                            </div>
                                        </div>
                                    </TableCell>

                                    <TableCell>
                                        <div className="space-y-1">
                                            <div className="flex items-center gap-2 text-sm">
                                                <Mail className="h-3.5 w-3.5 text-[#7b809a] flex-shrink-0" />
                                                <a href={`mailto:${candidate.email}`} className="hover:text-[#e91e63] truncate text-[#344767]">
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
                                    </TableCell>

                                    <TableCell>
                                        {candidate.jobs?.title ? (
                                            <div className="flex items-center gap-2 text-sm">
                                                <Briefcase className="h-3.5 w-3.5 text-[#7b809a] flex-shrink-0" />
                                                <span className="truncate text-[#344767]">{candidate.jobs.title}</span>
                                            </div>
                                        ) : (
                                            <span className="text-xs text-[#7b809a]">-</span>
                                        )}
                                    </TableCell>

                                    <TableCell>
                                        {getScore(candidate) !== null ? (
                                            <div className="flex items-center gap-2">
                                                <Star className="h-4 w-4 fill-[#fb8c00] text-[#fb8c00]" />
                                                <span className={`font-bold text-lg ${getScoreColor(getScore(candidate))}`}>
                                                    {getScore(candidate)}%
                                                </span>
                                            </div>
                                        ) : (
                                            <span className="text-xs text-[#7b809a]">-</span>
                                        )}
                                    </TableCell>

                                    <TableCell>
                                        {getInterviewStatusBadge(candidate.interview_status || candidate.status)}
                                    </TableCell>

                                    <TableCell>
                                        {candidate.created_at ? (
                                            <div className="flex items-center gap-2 text-sm text-[#7b809a]">
                                                <Calendar className="h-3.5 w-3.5 flex-shrink-0" />
                                                <span>{new Date(candidate.created_at).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })}</span>
                                            </div>
                                        ) : (
                                            <span className="text-xs text-[#7b809a]">-</span>
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
                                                className="gap-2 border-[#d2d6da] hover:bg-[#e91e63] hover:text-white hover:border-[#e91e63]"
                                            >
                                                <Eye className="h-4 w-4" />
                                                View
                                            </Button>
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="icon" className="hover:bg-[#f0f2f5]">
                                                        <MoreVertical className="h-4 w-4 text-[#7b809a]" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end" className="w-48">
                                                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                                    {candidate.cv_file_url && (
                                                        <DropdownMenuItem onClick={() => setCvViewerCandidate(candidate)}>
                                                            <FileText className="mr-2 h-4 w-4" />
                                                            View CV
                                                        </DropdownMenuItem>
                                                    )}
                                                    <DropdownMenuItem onClick={() => setEditCandidate(candidate)}>
                                                        <PenSquare className="mr-2 h-4 w-4" />
                                                        Edit
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem
                                                        className="text-destructive focus:text-destructive"
                                                        onClick={() => setDeleteCandidate(candidate)}
                                                    >
                                                        <Trash2 className="mr-2 h-4 w-4" />
                                                        Delete
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </MDTable>
                )}
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
