import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
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
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import DashboardLayout from "@/components/DashboardLayout";
import DashboardHeader from "@/components/DashboardHeader";
import PageBackground from "@/components/PageBackground";
import { formatDistanceToNow } from "date-fns";
import { MCQDetailModal } from "@/components/assessments/MCQDetailModal";

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
        <Badge className="bg-green-100 text-green-800 border-green-200">
          <CheckCircle className="h-3 w-3 mr-1" />
          Passed
        </Badge>
      ) : (
        <Badge variant="destructive">Failed</Badge>
      );
    }
    if (status === "in_progress") {
      return (
        <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">
          <Clock className="h-3 w-3 mr-1" />
          In Progress
        </Badge>
      );
    }
    return <Badge variant="outline">Scheduled</Badge>;
  };

  const getScoreColor = (score: number | null) => {
    if (!score) return "text-muted-foreground";
    if (score >= 80) return "text-green-600";
    if (score >= 60) return "text-yellow-600";
    return "text-red-600";
  };

  const totalTests = tests.length;
  const completedTests = tests.filter((t) => t.status === "completed").length;
  const passedTests = tests.filter((t) => t.status === "completed" && t.passed === true).length;
  const passRate = completedTests > 0 ? Math.round((passedTests / completedTests) * 100) : 0;

  return (
    <DashboardLayout>
      <DashboardHeader title="MCQ Tests" />
      <main className="flex-1 overflow-y-auto overflow-x-hidden bg-background relative min-h-0">
        <PageBackground imagePath="/assets/images/Whisk_2e19da7f277a295a3bf49685dc19f9fedr.jpeg" />
        <div className="page-container relative z-10 min-h-full">
          <div className="page-content">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <Card>
                <CardContent className="pt-6">
                  <div className="text-2xl font-bold">{totalTests}</div>
                  <p className="text-sm text-muted-foreground">Total Tests</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-2xl font-bold">{completedTests}</div>
                  <p className="text-sm text-muted-foreground">Completed</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-2xl font-bold">{tests.filter((t) => t.status === "scheduled" || t.status === "in_progress").length}</div>
                  <p className="text-sm text-muted-foreground">Pending</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-2xl font-bold">{passRate}%</div>
                  <p className="text-sm text-muted-foreground">Pass Rate</p>
                </CardContent>
              </Card>
            </div>

            {/* Filters */}
            <Card className="mb-6">
              <CardContent className="pt-6">
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search by candidate name, email, or job title..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-full sm:w-[180px]">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="scheduled">Scheduled</SelectItem>
                      <SelectItem value="in_progress">In Progress</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={scoreFilter} onValueChange={setScoreFilter}>
                    <SelectTrigger className="w-full sm:w-[180px]">
                      <SelectValue placeholder="Score" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Scores</SelectItem>
                      <SelectItem value="80">80%+</SelectItem>
                      <SelectItem value="60">60%+</SelectItem>
                      <SelectItem value="40">40%+</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Tests List */}
            <div className="space-y-4">
              {loading ? (
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center py-8">
                      <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
                      <p className="text-muted-foreground">Loading MCQ tests...</p>
                    </div>
                  </CardContent>
                </Card>
              ) : filteredTests.length === 0 ? (
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center py-12">
                      <ClipboardList className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-semibold mb-2">No MCQ Tests Found</h3>
                      <p className="text-muted-foreground">No tests match your current filters.</p>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                filteredTests.map((test) => (
                  <Card key={test.id} className="hover:shadow-md transition-all">
                    <CardContent className="pt-6">
                      <div className="flex items-start gap-4">
                        <Avatar className="h-12 w-12">
                          <AvatarFallback className="bg-gradient-to-br from-primary to-accent text-primary-foreground">
                            {getInitials(test.candidate_name)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-4 mb-2">
                            <div>
                              <h3 className="font-semibold text-lg">{test.candidate_name}</h3>
                              <p className="text-sm text-muted-foreground">{test.candidate_email}</p>
                              {test.job_title && (
                                <p className="text-sm text-muted-foreground mt-1">{test.job_title}</p>
                              )}
                            </div>
                            {getStatusBadge(test.status, test.passed)}
                          </div>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                            <div>
                              <p className="text-xs text-muted-foreground">Score</p>
                              <p className={`text-lg font-bold ${getScoreColor(test.percentage)}`}>
                                {test.percentage !== null ? `${Number(test.percentage).toFixed(2)}%` : "--"}
                              </p>
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground">Questions</p>
                              <p className="text-lg font-semibold">
                                {test.attempted_questions}/{test.total_questions}
                              </p>
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground">Correct</p>
                              <p className="text-lg font-semibold">{test.correct_answers}</p>
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground">Completed</p>
                              <p className="text-sm">
                                {test.completed_at
                                  ? formatDistanceToNow(new Date(test.completed_at), { addSuffix: true })
                                  : test.started_at
                                  ? "In progress..."
                                  : "Not started"}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 mt-4">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setSelectedTest(test);
                                setDetailModalOpen(true);
                              }}
                            >
                              <Eye className="h-4 w-4 mr-2" />
                              View Details
                            </Button>
                            {test.status === "in_progress" && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => navigate(`/mcq-tests/${test.id}/monitor`)}
                              >
                                <Clock className="h-4 w-4 mr-2" />
                                Monitor
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </div>
        </div>
      </main>

      <MCQDetailModal
        test={selectedTest}
        open={detailModalOpen}
        onOpenChange={setDetailModalOpen}
      />
    </DashboardLayout>
  );
};

export default MCQTests;

