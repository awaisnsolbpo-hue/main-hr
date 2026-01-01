import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MDInput } from "@/components/ui/MDInput";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Code2,
  Search,
  CheckCircle,
  Clock,
  Eye,
  Loader2,
  Mail,
  Briefcase,
  Star,
  Calendar,
  MoreVertical,
  PenSquare,
  Trash2,
} from "lucide-react";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import DashboardLayout from "@/components/DashboardLayout";
import { formatDistanceToNow } from "date-fns";
import { TechnicalDetailModal } from "@/components/assessments/TechnicalDetailModal";

interface TechnicalTest {
  id: string;
  candidate_id: string;
  candidate_name: string;
  candidate_email: string;
  job_id: string;
  job_title: string | null;
  task_title: string;
  task_description: string;
  status: string;
  overall_score: number | null;
  approach_score: number | null;
  code_quality_score: number | null;
  correctness_score: number | null;
  communication_score: number | null;
  recommendation: string | null;
  feedback?: string | null;
  code_solution?: string | null;
  code_url?: string | null;
  recording_url?: string | null;
  submission_url?: string | null; // Practical test video submission URL
  completed_at: string | null;
  started_at: string | null;
  created_at: string;
  time_taken?: number | null;
}

const TechnicalTests = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [tests, setTests] = useState<TechnicalTest[]>([]);
  const [filteredTests, setFilteredTests] = useState<TechnicalTest[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedTest, setSelectedTest] = useState<TechnicalTest | null>(null);

  useEffect(() => {
    loadTechnicalTests();
  }, []);

  // Real-time subscription for status updates
  useEffect(() => {
    const channel = supabase
      .channel('technical-practicals-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'technical_practicals'
        },
        (payload) => {
          console.log('📊 Real-time update detected for technical tests:', payload);
          // Reload tests to get latest status from Supabase
          loadTechnicalTests();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  useEffect(() => {
    let filtered = tests;

    if (statusFilter !== "all") {
      filtered = filtered.filter((t) => {
        const normalizedStatus = t.status?.toLowerCase() || '';
        const normalizedFilter = statusFilter.toLowerCase();
        // Handle both 'completed' and 'evaluated' as same, and 'scheduled' and 'pending' as similar
        if (normalizedFilter === "completed" || normalizedFilter === "evaluated") {
          return normalizedStatus === "completed" || normalizedStatus === "evaluated";
        }
        if (normalizedFilter === "scheduled" || normalizedFilter === "pending") {
          return normalizedStatus === "scheduled" || normalizedStatus === "pending";
        }
        return normalizedStatus === normalizedFilter;
      });
    }

    if (searchQuery) {
      filtered = filtered.filter(
        (t) =>
          t.candidate_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          t.candidate_email.toLowerCase().includes(searchQuery.toLowerCase()) ||
          t.job_title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          t.task_title.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    setFilteredTests(filtered);
  }, [tests, statusFilter, searchQuery]);

  const loadTechnicalTests = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/login");
        return;
      }

      // Get user's job IDs first
      const { data: userJobs } = await supabase
        .from("jobs")
        .select("id")
        .eq("user_id", user.id);

      const userJobIds = (userJobs || []).map((j) => j.id);

      if (userJobIds.length === 0) {
        setTests([]);
        return;
      }

      const { data, error } = await supabase
        .from("technical_practicals")
        .select("*")
        .in("job_id", userJobIds)
        .order("created_at", { ascending: false });

      if (error) throw error;

      setTests(data || []);
    } catch (error: any) {
      console.error("Error loading technical tests:", error);
      toast({
        title: "Error",
        description: "Failed to load technical tests",
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

  const getStatusBadge = (status: string, recommendation: string | null) => {
    // Normalize status to lowercase for comparison
    const normalizedStatus = status?.toLowerCase() || '';

    if (normalizedStatus === "completed" || normalizedStatus === "evaluated") {
      if (recommendation?.toLowerCase().includes("hire") || recommendation?.toLowerCase().includes("strong")) {
        return (
          <Badge className="bg-[#4CAF50] text-white border-0 hover:bg-[#43A047]">
            <CheckCircle className="h-3 w-3 mr-1" />
            Recommended
          </Badge>
        );
      }
      return (
        <Badge className="bg-[#4CAF50]/10 text-[#4CAF50] border border-[#4CAF50]/20 hover:bg-[#4CAF50]/20">
          <CheckCircle className="h-3 w-3 mr-1" />
          {normalizedStatus === "evaluated" ? "Evaluated" : "Completed"}
        </Badge>
      );
    }
    if (normalizedStatus === "in_progress") {
      return (
        <Badge className="bg-[#fb8c00] text-white border-0 hover:bg-[#f57c00]">
          <Clock className="h-3 w-3 mr-1" />
          In Progress
        </Badge>
      );
    }
    if (normalizedStatus === "submitted") {
      return (
        <Badge className="bg-[#1A73E8]/10 text-[#1A73E8] border border-[#1A73E8]/20 hover:bg-[#1A73E8]/20">
          Submitted
        </Badge>
      );
    }
    if (normalizedStatus === "pending" || normalizedStatus === "scheduled") {
      return (
        <Badge className="bg-[#7b809a]/10 text-[#7b809a] border border-[#7b809a]/20 hover:bg-[#7b809a]/20">
          {normalizedStatus === "pending" ? "Pending" : "Scheduled"}
        </Badge>
      );
    }
    // Default fallback
    return <Badge className="bg-[#7b809a]/10 text-[#7b809a] border border-[#7b809a]/20">{status || "Unknown"}</Badge>;
  };

  const getScoreColor = (score: number | null) => {
    if (!score) return "text-[#7b809a]";
    if (score >= 80) return "text-[#4CAF50]";
    if (score >= 60) return "text-[#fb8c00]";
    return "text-[#F44335]";
  };

  const totalTests = tests.length;
  const completedTests = tests.filter((t) => t.status === "completed").length;
  const passedTests = tests.filter(
    (t) => t.status === "completed" && t.overall_score && t.overall_score >= 60
  ).length;
  const passRate = completedTests > 0 ? Math.round((passedTests / completedTests) * 100) : 0;

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
          <h1 className="text-2xl font-bold text-[#344767] mb-2">Technical Assessments</h1>
          <p className="text-sm font-light text-[#7b809a]">
            Track and manage technical coding assessments
          </p>
        </div>

        {/* Summary Cards - Material Dashboard Style */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card className="relative bg-white border-0 shadow-md-lg overflow-hidden">
            <CardContent className="p-4 pt-6">
              <div className="text-2xl font-bold text-[#344767]">{totalTests}</div>
              <p className="text-sm font-light text-[#7b809a]">Total Tests</p>
            </CardContent>
          </Card>
          <Card className="relative bg-white border-0 shadow-md-lg overflow-hidden">
            <CardContent className="p-4 pt-6">
              <div className="text-2xl font-bold text-[#344767]">{completedTests}</div>
              <p className="text-sm font-light text-[#7b809a]">Completed</p>
            </CardContent>
          </Card>
          <Card className="relative bg-white border-0 shadow-md-lg overflow-hidden">
            <CardContent className="p-4 pt-6">
              <div className="text-2xl font-bold text-[#344767]">{tests.filter((t) => t.status === "scheduled" || t.status === "in_progress").length}</div>
              <p className="text-sm font-light text-[#7b809a]">Pending</p>
            </CardContent>
          </Card>
          <Card className="relative bg-white border-0 shadow-md-lg overflow-hidden">
            <CardContent className="p-4 pt-6">
              <div className="text-2xl font-bold text-[#344767]">{passRate}%</div>
              <p className="text-sm font-light text-[#7b809a]">Pass Rate</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters - Material Dashboard Style */}
        <Card className="mb-6 bg-white border-0 shadow-md-lg">
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#7b809a]" />
                <MDInput
                  placeholder="Search by candidate, job, or task..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-[200px] h-12 rounded-xl border-[#d2d6da] focus:border-[#e91e63] focus:ring-2 focus:ring-[#e91e63]/20">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent className="rounded-xl border-[#d2d6da]">
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="scheduled">Scheduled</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="submitted">Submitted</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="evaluated">Evaluated</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Material Dashboard Table */}
        <MDTable
          title="Technical Assessment Results"
          headerActions={
            <Badge className="bg-gradient-to-br from-[#1A73E8] to-[#49a3f1] text-white border-0 shadow-blue">
              {filteredTests.length} Tests
            </Badge>
          }
        >
          {filteredTests.length === 0 ? (
            <tbody>
              <tr>
                <td colSpan={8}>
                  <div className="text-center py-12">
                    <Code2 className="h-16 w-16 text-[#7b809a] mx-auto mb-4 opacity-50" />
                    <h3 className="text-lg font-semibold text-[#344767] mb-2">No Technical Tests Found</h3>
                    <p className="text-sm font-light text-[#7b809a]">
                      No tests match your current filters
                    </p>
                  </div>
                </td>
              </tr>
            </tbody>
          ) : (
            <>
              <MDTableHeader>
                <MDTableHeaderCell>Candidate</MDTableHeaderCell>
                <MDTableHeaderCell>Email</MDTableHeaderCell>
                <MDTableHeaderCell>Job</MDTableHeaderCell>
                <MDTableHeaderCell>Task</MDTableHeaderCell>
                <MDTableHeaderCell>Score</MDTableHeaderCell>
                <MDTableHeaderCell>Status</MDTableHeaderCell>
                <MDTableHeaderCell>Completed</MDTableHeaderCell>
                <MDTableHeaderCell>Actions</MDTableHeaderCell>
              </MDTableHeader>
              <MDTableBody>
                {filteredTests.map((test) => (
                  <MDTableRow key={test.id}>
                    <MDTableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10 border-2 border-[#e91e63]/20">
                          <AvatarFallback className="bg-gradient-to-br from-[#EC407A] to-[#D81B60] text-white text-xs font-bold">
                            {getInitials(test.candidate_name)}
                          </AvatarFallback>
                        </Avatar>
                        <p className="text-sm font-semibold text-[#344767]">{test.candidate_name}</p>
                      </div>
                    </MDTableCell>
                    <MDTableCell>
                      <div className="flex items-center gap-2 text-sm text-[#7b809a]">
                        <Mail className="h-3.5 w-3.5 flex-shrink-0" />
                        <a href={`mailto:${test.candidate_email}`} className="hover:text-[#e91e63] truncate">
                          {test.candidate_email}
                        </a>
                      </div>
                    </MDTableCell>
                    <MDTableCell>
                      {test.job_title ? (
                        <div className="flex items-center gap-2 text-sm text-[#7b809a]">
                          <Briefcase className="h-3.5 w-3.5 flex-shrink-0" />
                          <span className="truncate">{test.job_title}</span>
                        </div>
                      ) : (
                        <span className="text-xs text-[#7b809a]">-</span>
                      )}
                    </MDTableCell>
                    <MDTableCell>
                      <div className="flex items-center gap-2 text-sm text-[#7b809a]">
                        <Code2 className="h-3.5 w-3.5 flex-shrink-0" />
                        <span className="truncate max-w-[150px]" title={test.task_title}>{test.task_title}</span>
                      </div>
                    </MDTableCell>
                    <MDTableCell>
                      {test.overall_score !== null ? (
                        <div className="flex items-center gap-2">
                          <Star className="h-4 w-4 fill-[#fb8c00] text-[#fb8c00]" />
                          <span className={`font-bold text-lg ${getScoreColor(test.overall_score)}`}>
                            {test.overall_score}%
                          </span>
                        </div>
                      ) : (
                        <span className="text-xs text-[#7b809a]">-</span>
                      )}
                    </MDTableCell>
                    <MDTableCell>
                      {getStatusBadge(test.status, test.recommendation)}
                    </MDTableCell>
                    <MDTableCell>
                      {test.completed_at ? (
                        <div className="flex items-center gap-2 text-sm font-light text-[#7b809a]">
                          <Calendar className="h-3.5 w-3.5 flex-shrink-0" />
                          <span>{formatDistanceToNow(new Date(test.completed_at), { addSuffix: true })}</span>
                        </div>
                      ) : test.started_at ? (
                        <Badge className="bg-[#fb8c00] text-white border-0">
                          <Clock className="h-3 w-3 mr-1" />
                          In Progress
                        </Badge>
                      ) : (
                        <span className="text-xs font-light text-[#7b809a]">Scheduled</span>
                      )}
                    </MDTableCell>
                    <MDTableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedTest(test);
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
                            {test.recording_url && (
                              <DropdownMenuItem onClick={() => window.open(test.recording_url!, '_blank')} className="text-[#7b809a] focus:text-[#344767]">
                                <Eye className="mr-2 h-4 w-4" />
                                View Recording
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem className="text-[#7b809a] focus:text-[#344767]">
                              <PenSquare className="mr-2 h-4 w-4" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-[#F44335] focus:text-[#F44335]">
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

      <TechnicalDetailModal
        test={selectedTest}
        open={detailModalOpen}
        onOpenChange={setDetailModalOpen}
      />
    </DashboardLayout>
  );
};

export default TechnicalTests;

