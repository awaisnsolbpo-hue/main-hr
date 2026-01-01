import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ClipboardList,
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
import { MCQDetailModal } from "@/components/assessments/MCQDetailModal";
import {
  MDTable,
  MDTableHeader,
  MDTableHeaderCell,
  MDTableBody,
  MDTableRow,
  MDTableCell
} from "@/components/ui/MDTable";
import { MDInput } from "@/components/ui/MDInput";

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
  passed: boolean | null;
  completed_at: string | null;
  started_at: string | null;
  created_at: string;
  screen_recording_url?: string | null;
  time_taken?: number | null;
  questions?: any[];
  answers?: any;
}

const MCQTests = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [tests, setTests] = useState<MCQTest[]>([]);
  const [filteredTests, setFilteredTests] = useState<MCQTest[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [scoreFilter, setScoreFilter] = useState<string>("all");
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedTest, setSelectedTest] = useState<MCQTest | null>(null);

  useEffect(() => {
    loadMCQTests();
  }, []);

  useEffect(() => {
    let filtered = tests;

    if (statusFilter !== "all") {
      filtered = filtered.filter((t) => t.status === statusFilter);
    }

    if (scoreFilter !== "all") {
      const minScore = parseInt(scoreFilter);
      filtered = filtered.filter((t) => t.percentage && t.percentage >= minScore);
    }

    if (searchQuery) {
      filtered = filtered.filter(
        (t) =>
          t.candidate_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          t.candidate_email.toLowerCase().includes(searchQuery.toLowerCase()) ||
          t.job_title?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    setFilteredTests(filtered);
  }, [tests, statusFilter, scoreFilter, searchQuery]);

  const loadMCQTests = async () => {
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

      const jobIds = (userJobs || []).map((j) => j.id);

      if (jobIds.length === 0) {
        setTests([]);
        return;
      }

      const { data, error } = await supabase
        .from("mcqs_test")
        .select("*")
        .in("job_id", jobIds)
        .order("created_at", { ascending: false });

      if (error) throw error;

      setTests(data || []);
    } catch (error: any) {
      console.error("Error loading MCQ tests:", error);
      toast({
        title: "Error",
        description: "Failed to load MCQ tests",
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

  const getStatusBadge = (status: string, passed: boolean | null) => {
    if (status === "completed") {
      return passed ? (
        <Badge className="bg-[#4CAF50] text-white border-0 hover:bg-[#43A047]">
          <CheckCircle className="h-3 w-3 mr-1" />
          Passed
        </Badge>
      ) : (
        <Badge className="bg-[#F44335] text-white border-0 hover:bg-[#E53935]">Failed</Badge>
      );
    }
    if (status === "in_progress") {
      return (
        <Badge className="bg-[#fb8c00] text-white border-0 hover:bg-[#f57c00]">
          <Clock className="h-3 w-3 mr-1" />
          In Progress
        </Badge>
      );
    }
    return <Badge className="bg-[#7b809a]/10 text-[#7b809a] border border-[#7b809a]/20">Scheduled</Badge>;
  };

  const getScoreColor = (score: number | null) => {
    if (!score) return "text-[#7b809a]";
    if (score >= 80) return "text-[#4CAF50]";
    if (score >= 60) return "text-[#fb8c00]";
    return "text-[#F44335]";
  };

  const totalTests = tests.length;
  const completedTests = tests.filter((t) => t.status === "completed").length;
  const passedTests = tests.filter((t) => t.status === "completed" && t.passed === true).length;
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
          <h1 className="text-2xl font-bold text-[#344767] mb-2">MCQ Tests</h1>
          <p className="text-sm font-light text-[#7b809a]">
            Track and manage multiple choice question assessments
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
        <Card className="relative bg-white border-0 shadow-md-lg overflow-hidden mb-6">
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#7b809a]" />
                <MDInput
                  placeholder="Search by candidate name, email, or job title..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-[180px] h-12 rounded-xl border-[#d2d6da] focus:border-[#e91e63] focus:ring-2 focus:ring-[#e91e63]/20">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent className="rounded-xl shadow-md-lg">
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="scheduled">Scheduled</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>
              <Select value={scoreFilter} onValueChange={setScoreFilter}>
                <SelectTrigger className="w-full sm:w-[180px] h-12 rounded-xl border-[#d2d6da] focus:border-[#e91e63] focus:ring-2 focus:ring-[#e91e63]/20">
                  <SelectValue placeholder="Score" />
                </SelectTrigger>
                <SelectContent className="rounded-xl shadow-md-lg">
                  <SelectItem value="all">All Scores</SelectItem>
                  <SelectItem value="80">80%+</SelectItem>
                  <SelectItem value="60">60%+</SelectItem>
                  <SelectItem value="40">40%+</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Material Dashboard Table */}
        <MDTable
          title="MCQ Test Results"
          headerActions={
            <Badge className="bg-gradient-to-br from-[#1A73E8] to-[#49a3f1] text-white border-0 shadow-blue">
              {filteredTests.length} Tests
            </Badge>
          }
        >
          {filteredTests.length === 0 ? (
            <tbody>
              <tr>
                <td colSpan={7}>
                  <div className="text-center py-12">
                    <ClipboardList className="h-16 w-16 text-[#7b809a] mx-auto mb-4 opacity-50" />
                    <h3 className="text-lg font-semibold text-[#344767] mb-2">No MCQ Tests Found</h3>
                    <p className="text-sm font-light text-[#7b809a]">No tests match your current filters.</p>
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
                <MDTableHeaderCell>Score</MDTableHeaderCell>
                <MDTableHeaderCell>Questions</MDTableHeaderCell>
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
                        <Mail className="h-3.5 w-3.5" />
                        <a href={`mailto:${test.candidate_email}`} className="hover:text-[#e91e63] transition-colors">
                          {test.candidate_email}
                        </a>
                      </div>
                    </MDTableCell>
                    <MDTableCell>
                      {test.job_title ? (
                        <div className="flex items-center gap-2 text-sm text-[#7b809a]">
                          <Briefcase className="h-3.5 w-3.5" />
                          <span>{test.job_title}</span>
                        </div>
                      ) : (
                        <span className="text-xs text-[#7b809a]">-</span>
                      )}
                    </MDTableCell>
                    <MDTableCell>
                      {test.percentage !== null ? (
                        <div className="flex items-center gap-2">
                          <Star className="h-4 w-4 fill-[#fb8c00] text-[#fb8c00]" />
                          <span className={`font-bold text-lg ${getScoreColor(test.percentage)}`}>
                            {Number(test.percentage).toFixed(1)}%
                          </span>
                        </div>
                      ) : (
                        <span className="text-xs text-[#7b809a]">-</span>
                      )}
                    </MDTableCell>
                    <MDTableCell>
                      <div className="text-sm">
                        <span className="font-semibold text-[#344767]">{test.correct_answers}</span>
                        <span className="text-[#7b809a]">/{test.total_questions}</span>
                      </div>
                    </MDTableCell>
                    <MDTableCell>
                      {getStatusBadge(test.status, test.passed)}
                    </MDTableCell>
                    <MDTableCell>
                      {test.completed_at ? (
                        <div className="flex items-center gap-2 text-sm text-[#7b809a]">
                          <Calendar className="h-3.5 w-3.5" />
                          <span>{formatDistanceToNow(new Date(test.completed_at), { addSuffix: true })}</span>
                        </div>
                      ) : test.started_at ? (
                        <Badge className="bg-[#fb8c00] text-white border-0">
                          <Clock className="h-3 w-3 mr-1" />
                          In Progress
                        </Badge>
                      ) : (
                        <span className="text-xs text-[#7b809a]">Not started</span>
                      )}
                    </MDTableCell>
                    <MDTableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedTest(test);
                            setDetailModalOpen(true);
                          }}
                          className="gap-2 border-[#dee2e6] text-[#7b809a] hover:bg-[#f0f2f5] hover:text-[#344767]"
                        >
                          <Eye className="h-4 w-4" />
                          View
                        </Button>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="hover:bg-[#e91e63]/10 hover:text-[#e91e63]">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-48 rounded-xl shadow-md-lg">
                            <DropdownMenuLabel className="text-[#344767] font-bold">Actions</DropdownMenuLabel>
                            {test.screen_recording_url && (
                              <DropdownMenuItem onClick={() => window.open(test.screen_recording_url!, '_blank')} className="text-[#7b809a] hover:text-[#344767] hover:bg-[#f0f2f5]">
                                <Eye className="mr-2 h-4 w-4" />
                                View Recording
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem className="text-[#F44335] focus:text-[#F44335] hover:bg-[#F44335]/10">
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

      <MCQDetailModal
        test={selectedTest}
        open={detailModalOpen}
        onOpenChange={setDetailModalOpen}
      />
    </DashboardLayout>
  );
};

export default MCQTests;

