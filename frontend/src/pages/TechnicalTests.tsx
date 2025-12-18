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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const getStatusBadge = (status: string, recommendation: string | null) => {
    if (status === "completed") {
      if (recommendation?.toLowerCase().includes("hire") || recommendation?.toLowerCase().includes("strong")) {
        return (
          <Badge variant="outline" className="bg-green-500 text-white border-green-600">
            <CheckCircle className="h-3 w-3 mr-1" />
            Recommended
          </Badge>
        );
      }
      return <Badge variant="outline">Completed</Badge>;
    }
    if (status === "in_progress") {
      return (
        <Badge variant="outline" className="bg-yellow-500 text-white border-yellow-600">
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
            <Card>
              <CardHeader>
                <CardTitle>Technical Assessment Results</CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="text-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
                    <p className="text-muted-foreground">Loading technical tests...</p>
                  </div>
                ) : filteredTests.length === 0 ? (
                  <div className="text-center py-12">
                    <Code2 className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No Technical Tests Found</h3>
                    <p className="text-muted-foreground">No tests match your current filters.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="min-w-[200px]">Candidate</TableHead>
                          <TableHead className="min-w-[200px]">Email</TableHead>
                          <TableHead className="min-w-[150px]">Job</TableHead>
                          <TableHead className="min-w-[150px]">Task</TableHead>
                          <TableHead className="min-w-[100px]">Score</TableHead>
                          <TableHead className="min-w-[100px]">Status</TableHead>
                          <TableHead className="min-w-[120px]">Completed</TableHead>
                          <TableHead className="min-w-[180px]">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredTests.map((test) => (
                          <TableRow key={test.id}>
                            <TableCell>
                              <div className="flex items-center gap-3">
                                <Avatar className="h-10 w-10 flex-shrink-0">
                                  <AvatarFallback className="bg-gradient-to-br from-primary to-primary/80 text-primary-foreground font-semibold">
                                    {getInitials(test.candidate_name)}
                                  </AvatarFallback>
                                </Avatar>
                                <div className="min-w-0">
                                  <p className="font-semibold truncate">{test.candidate_name}</p>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2 text-sm">
                                <Mail className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                                <a href={`mailto:${test.candidate_email}`} className="hover:text-primary truncate">
                                  {test.candidate_email}
                                </a>
                              </div>
                            </TableCell>
                            <TableCell>
                              {test.job_title ? (
                                <div className="flex items-center gap-2 text-sm">
                                  <Briefcase className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                                  <span className="truncate">{test.job_title}</span>
                                </div>
                              ) : (
                                <span className="text-xs text-muted-foreground">-</span>
                              )}
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2 text-sm">
                                <Code2 className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                                <span className="truncate max-w-[150px]" title={test.task_title}>{test.task_title}</span>
                              </div>
                            </TableCell>
                            <TableCell>
                              {test.overall_score !== null ? (
                                <div className="flex items-center gap-2">
                                  <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                                  <span className={`font-bold text-lg ${getScoreColor(test.overall_score)}`}>
                                    {test.overall_score}%
                                  </span>
                                </div>
                              ) : (
                                <span className="text-xs text-muted-foreground">-</span>
                              )}
                            </TableCell>
                            <TableCell>
                              {getStatusBadge(test.status, test.recommendation)}
                            </TableCell>
                            <TableCell>
                              {test.completed_at ? (
                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                  <Calendar className="h-3.5 w-3.5 flex-shrink-0" />
                                  <span>{formatDistanceToNow(new Date(test.completed_at), { addSuffix: true })}</span>
                                </div>
                              ) : test.started_at ? (
                                <Badge variant="outline" className="bg-yellow-500 text-white border-yellow-600">
                                  <Clock className="h-3 w-3 mr-1" />
                                  In Progress
                                </Badge>
                              ) : (
                                <span className="text-xs text-muted-foreground">Scheduled</span>
                              )}
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    setSelectedTest(test);
                                    setDetailModalOpen(true);
                                  }}
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
                                  <DropdownMenuContent align="end" className="w-48">
                                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                    {test.recording_url && (
                                      <DropdownMenuItem onClick={() => window.open(test.recording_url!, '_blank')}>
                                        <Eye className="mr-2 h-4 w-4" />
                                        View Recording
                                      </DropdownMenuItem>
                                    )}
                                    <DropdownMenuItem>
                                      <PenSquare className="mr-2 h-4 w-4" />
                                      Edit
                                    </DropdownMenuItem>
                                    <DropdownMenuItem className="text-destructive focus:text-destructive">
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
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
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

