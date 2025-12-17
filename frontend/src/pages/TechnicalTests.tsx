import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
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
  Play,
  FileCode,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import DashboardLayout from "@/components/DashboardLayout";
import DashboardHeader from "@/components/DashboardHeader";
import PageBackground from "@/components/PageBackground";
import { ScoreDisplay } from "@/components/assessments/ScoreDisplay";
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

  useEffect(() => {
    let filtered = tests;

    if (statusFilter !== "all") {
      filtered = filtered.filter((t) => t.status === statusFilter);
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

      const jobIds = (userJobs || []).map((j) => j.id);

      if (jobIds.length === 0) {
        setTests([]);
        return;
      }

      const { data, error } = await supabase
        .from("technical_practicals")
        .select("*")
        .in("job_id", jobIds)
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

  const getStatusBadge = (status: string, recommendation: string | null) => {
    if (status === "completed") {
      if (recommendation?.toLowerCase().includes("hire") || recommendation?.toLowerCase().includes("strong")) {
        return (
          <Badge className="bg-green-100 text-green-800 border-green-200">
            <CheckCircle className="h-3 w-3 mr-1" />
            Recommended
          </Badge>
        );
      }
      return <Badge variant="outline">Completed</Badge>;
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

  const totalTests = tests.length;
  const completedTests = tests.filter((t) => t.status === "completed").length;
  const passedTests = tests.filter(
    (t) => t.status === "completed" && t.overall_score && t.overall_score >= 60
  ).length;
  const passRate = completedTests > 0 ? Math.round((passedTests / completedTests) * 100) : 0;

  return (
    <DashboardLayout>
      <DashboardHeader title="Technical Assessments" />
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
                      placeholder="Search by candidate, job, or task..."
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
                      <p className="text-muted-foreground">Loading technical tests...</p>
                    </div>
                  </CardContent>
                </Card>
              ) : filteredTests.length === 0 ? (
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center py-12">
                      <Code2 className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-semibold mb-2">No Technical Tests Found</h3>
                      <p className="text-muted-foreground">No tests match your current filters.</p>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                filteredTests.map((test) => (
                  <Card key={test.id} className="hover:shadow-md transition-all">
                    <CardContent className="pt-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className="p-3 rounded-lg bg-gradient-to-br from-primary to-primary/80">
                            <Code2 className="h-6 w-6 text-white" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-lg">{test.task_title}</h3>
                            <p className="text-sm text-muted-foreground">
                              {test.candidate_name} • {test.job_title || "No job"}
                            </p>
                          </div>
                        </div>
                        {getStatusBadge(test.status, test.recommendation)}
                      </div>

                      <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                        {test.task_description}
                      </p>

                      {test.status === "completed" && test.overall_score !== null && (
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                          <div>
                            <ScoreDisplay
                              label="Overall"
                              score={test.overall_score}
                              size="sm"
                              showBar={true}
                            />
                          </div>
                          {test.code_quality_score !== null && (
                            <div>
                              <ScoreDisplay
                                label="Code Quality"
                                score={test.code_quality_score}
                                size="sm"
                                showBar={true}
                              />
                            </div>
                          )}
                          {test.correctness_score !== null && (
                            <div>
                              <ScoreDisplay
                                label="Correctness"
                                score={test.correctness_score}
                                size="sm"
                                showBar={true}
                              />
                            </div>
                          )}
                          {test.approach_score !== null && (
                            <div>
                              <ScoreDisplay
                                label="Approach"
                                score={test.approach_score}
                                size="sm"
                                showBar={true}
                              />
                            </div>
                          )}
                        </div>
                      )}

                      <div className="flex items-center justify-between pt-4 border-t">
                        <div className="text-sm text-muted-foreground">
                          {test.completed_at
                            ? `Completed ${formatDistanceToNow(new Date(test.completed_at), { addSuffix: true })}`
                            : test.started_at
                            ? "In progress..."
                            : "Scheduled"}
                        </div>
                        <div className="flex items-center gap-2">
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

      <TechnicalDetailModal
        test={selectedTest}
        open={detailModalOpen}
        onOpenChange={setDetailModalOpen}
      />
    </DashboardLayout>
  );
};

export default TechnicalTests;

