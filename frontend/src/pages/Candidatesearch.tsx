import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sparkles,
  ArrowLeft,
  Search as SearchIcon,
  Loader2,
  Download,
  Mail,
  Phone,
  Briefcase,
  Calendar,
  TrendingUp,
  Filter,
  X,
  SlidersHorizontal,
  Users,
  FileText,
} from "lucide-react";
import { searchCandidatesByRole, SearchResult } from "@/lib/Searchapi";
import { jobsApi, candidatesApi } from "@/services/api";
import { useToast } from "@/hooks/use-toast";
import DashboardLayout from "@/components/DashboardLayout";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Alert, AlertDescription } from "@/components/ui/alert";

type SearchType = "candidates" | "jobs" | "both";
type JobStatus = "all" | "active" | "closed" | "archived" | "paused";
type CandidateSource = "all" | "candidates" | "Shortlisted" | "Final Interview";

interface JobResult {
  id: string;
  title: string;
  description?: string;
  status: string;
  required_skills?: string[];
  preferred_skills?: string[];
  applicationCount?: number;
  created_at: string;
}

const CandidateSearch = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [searchType, setSearchType] = useState<SearchType>("both");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [jobResults, setJobResults] = useState<JobResult[]>([]);
  const [allJobs, setAllJobs] = useState<JobResult[]>([]);
  const [allCandidates, setAllCandidates] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const [searched, setSearched] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  
  // Filters
  const [jobStatusFilter, setJobStatusFilter] = useState<JobStatus>("all");
  const [candidateSourceFilter, setCandidateSourceFilter] = useState<CandidateSource>("all");
  const [minScoreFilter, setMinScoreFilter] = useState<string>("");
  const [selectedJobFilter, setSelectedJobFilter] = useState<string>("all");

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      // Load all jobs for filtering
      const { jobs } = await jobsApi.getAll();
      setAllJobs(jobs || []);
      
      // Load all candidates for filtering
      const { candidates } = await candidatesApi.getAll();
      setAllCandidates(candidates || []);
    } catch (error) {
      console.error("Error loading initial data:", error);
    }
  };

  const handleSearch = async (e?: React.FormEvent) => {
    e?.preventDefault();

    if (!searchQuery.trim()) {
      toast({
        title: "Enter Search Term",
        description: "Please enter a role or keyword to search",
        variant: "destructive",
      });
      return;
    }

    setSearching(true);
    setSearched(true);

    try {
      const query = searchQuery.toLowerCase().trim();
      
      // Search candidates
      if (searchType === "candidates" || searchType === "both") {
        const searchResults = await searchCandidatesByRole(searchQuery);
        setResults(searchResults);
      } else {
        setResults([]);
      }

      // Search jobs
      if (searchType === "jobs" || searchType === "both") {
        // Load jobs if not already loaded
        if (allJobs.length === 0) {
          const { jobs } = await jobsApi.getAll();
          setAllJobs(jobs || []);
        }
        
        const filteredJobs = (allJobs.length > 0 ? allJobs : await jobsApi.getAll().then(r => r.jobs || [])).filter((job: any) => {
          const titleMatch = job.title?.toLowerCase().includes(query);
          const descMatch = job.description?.toLowerCase().includes(query);
          const skillsMatch = [
            ...(job.required_skills || []),
            ...(job.preferred_skills || [])
          ].some((skill: string) => skill.toLowerCase().includes(query));
          
          return titleMatch || descMatch || skillsMatch;
        });
        setJobResults(filteredJobs);
      } else {
        setJobResults([]);
      }
    } catch (error: any) {
      toast({
        title: "Search Failed",
        description: error.message || "Failed to search",
        variant: "destructive",
      });
    } finally {
      setSearching(false);
    }
  };

  // Apply filters to results
  const filteredCandidates = (() => {
    let filtered = [...results];

    // Filter candidates by source
    if (candidateSourceFilter !== "all") {
      filtered = filtered.filter(
        r => r.candidate.source === candidateSourceFilter
      );
    }

    // Filter candidates by minimum score
    if (minScoreFilter) {
      const minScore = parseFloat(minScoreFilter);
      filtered = filtered.filter(
        r => r.matchScore >= minScore
      );
    }

    // Filter candidates by job
    if (selectedJobFilter !== "all") {
      filtered = filtered.filter(
        r => r.job.id === selectedJobFilter
      );
    }

    return filtered;
  })();

  const filteredJobs = (() => {
    let filtered = [...jobResults];

    // Filter jobs by status
    if (jobStatusFilter !== "all") {
      filtered = filtered.filter(
        job => job.status === jobStatusFilter
      );
    }

    return filtered;
  })();

  const clearFilters = () => {
    setJobStatusFilter("all");
    setCandidateSourceFilter("all");
    setMinScoreFilter("");
    setSelectedJobFilter("all");
  };

  const activeFiltersCount = [
    jobStatusFilter !== "all",
    candidateSourceFilter !== "all",
    minScoreFilter !== "",
    selectedJobFilter !== "all",
  ].filter(Boolean).length;


  const getScoreBadgeColor = (score: number) => {
    if (score >= 80) return "bg-green-100 text-green-800";
    if (score >= 60) return "bg-yellow-100 text-yellow-800";
    return "bg-muted text-muted-foreground";
  };

  const getSourceBadge = (source: string) => {
    const colors: Record<string, string> = {
      candidates: "bg-blue-100 text-blue-800",
      Shortlisted: "bg-primary/10 text-primary dark:bg-primary/20 dark:text-primary",
      "Final Interview": "bg-green-100 text-green-800",
    };
    return colors[source] || "bg-gray-100 text-gray-800";
  };

  // Sample search suggestions
  const searchSuggestions = [
    "AI Specialist",
    "Frontend Developer",
    "Data Scientist",
    "Product Manager",
    "UI/UX Designer",
    "DevOps Engineer",
  ];

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-[var(--gradient-subtle)]">
        {/* Main Content */}
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="max-w-6xl mx-auto space-y-8">
          {/* Page Header */}
          <div className="text-center space-y-4 animate-fade-in">
            <h1 className="text-4xl font-bold">
              <SearchIcon className="inline h-10 w-10 mr-3 text-primary" />
              Search Jobs & Candidates
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Find jobs and candidates by role, skills, or keywords. Search across all positions and applications.
            </p>
          </div>

          {/* Search Box */}
          <Card className="hover-glow">
            <CardContent className="pt-6">
              <form onSubmit={handleSearch} className="space-y-4">
                {/* Search Type Selector */}
                <div className="flex items-center gap-4">
                  <Label className="text-sm font-medium">Search Type:</Label>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant={searchType === "both" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setSearchType("both")}
                    >
                      Both
                    </Button>
                    <Button
                      type="button"
                      variant={searchType === "jobs" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setSearchType("jobs")}
                    >
                      <Briefcase className="h-4 w-4 mr-2" />
                      Jobs
                    </Button>
                    <Button
                      type="button"
                      variant={searchType === "candidates" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setSearchType("candidates")}
                    >
                      <Users className="h-4 w-4 mr-2" />
                      Candidates
                    </Button>
                  </div>
                  <div className="ml-auto">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setShowFilters(!showFilters)}
                      className="gap-2"
                    >
                      <SlidersHorizontal className="h-4 w-4" />
                      Filters
                      {activeFiltersCount > 0 && (
                        <Badge variant="secondary" className="ml-1">
                          {activeFiltersCount}
                        </Badge>
                      )}
                    </Button>
                  </div>
                </div>

                <div className="flex gap-3">
                  <div className="relative flex-1">
                    <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Input
                      placeholder='Try "AI Specialist", "Frontend Developer", or any skill...'
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-11 h-12 text-lg"
                      disabled={searching}
                    />
                  </div>
                  <Button
                    type="submit"
                    size="lg"
                    variant="hero"
                    disabled={searching || !searchQuery.trim()}
                    className="px-8"
                  >
                    {searching ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Searching...
                      </>
                    ) : (
                      <>
                        <SearchIcon className="mr-2 h-4 w-4" />
                        Search
                      </>
                    )}
                  </Button>
                </div>

                {/* Search Suggestions */}
                {!searched && (
                  <div className="flex flex-wrap gap-2 pt-2">
                    <span className="text-sm text-muted-foreground">Try:</span>
                    {searchSuggestions.map((suggestion) => (
                      <Badge
                        key={suggestion}
                        variant="outline"
                        className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors"
                        onClick={() => {
                          setSearchQuery(suggestion);
                          handleSearch();
                        }}
                      >
                        {suggestion}
                      </Badge>
                    ))}
                  </div>
                )}
              </form>
            </CardContent>
          </Card>

          {/* Filters Panel */}
          {showFilters && (
            <Card className="shadow-elegant animate-fade-in">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Filter className="h-5 w-5" />
                    Filters
                  </CardTitle>
                  {activeFiltersCount > 0 && (
                    <Button variant="ghost" size="sm" onClick={clearFilters}>
                      <X className="h-4 w-4 mr-2" />
                      Clear All
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {/* Job Status Filter */}
                  {(searchType === "jobs" || searchType === "both") && (
                    <div className="space-y-2">
                      <Label>Job Status</Label>
                      <Select value={jobStatusFilter} onValueChange={(v) => setJobStatusFilter(v as JobStatus)}>
                        <SelectTrigger>
                          <SelectValue placeholder="All Statuses" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Statuses</SelectItem>
                          <SelectItem value="active">Active</SelectItem>
                          <SelectItem value="closed">Closed</SelectItem>
                          <SelectItem value="archived">Archived</SelectItem>
                          <SelectItem value="paused">Paused</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  {/* Candidate Source Filter */}
                  {(searchType === "candidates" || searchType === "both") && (
                    <>
                      <div className="space-y-2">
                        <Label>Candidate Source</Label>
                        <Select value={candidateSourceFilter} onValueChange={(v) => setCandidateSourceFilter(v as CandidateSource)}>
                          <SelectTrigger>
                            <SelectValue placeholder="All Sources" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All Sources</SelectItem>
                            <SelectItem value="candidates">Candidates</SelectItem>
                            <SelectItem value="Shortlisted">Shortlisted</SelectItem>
                            <SelectItem value="Final Interview">Final Interview</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label>Minimum Match Score</Label>
                        <Input
                          type="number"
                          placeholder="e.g., 70"
                          value={minScoreFilter}
                          onChange={(e) => setMinScoreFilter(e.target.value)}
                          min="0"
                          max="100"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Job Position</Label>
                        <Select value={selectedJobFilter} onValueChange={setSelectedJobFilter}>
                          <SelectTrigger>
                            <SelectValue placeholder="All Jobs" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All Jobs</SelectItem>
                            {allJobs.map((job) => (
                              <SelectItem key={job.id} value={job.id}>
                                {job.title}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Results */}
          {searched && (
            <>
              {/* Jobs Results */}
              {(searchType === "jobs" || searchType === "both") && filteredJobs.length > 0 && (
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-2">
                        <Briefcase className="h-5 w-5 text-primary" />
                        Job Results
                        <Badge variant="secondary" className="ml-2">
                          {filteredJobs.length} {filteredJobs.length === 1 ? "job" : "jobs"}
                        </Badge>
                      </CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {filteredJobs.map((job) => (
                        <Card key={job.id} className="hover-glow cursor-pointer" onClick={() => navigate(`/jobs/${job.id}`)}>
                          <CardContent className="pt-6">
                            <div className="space-y-3">
                              <div className="flex items-start justify-between">
                                <h3 className="font-semibold text-lg">{job.title}</h3>
                                <Badge variant={job.status === "active" ? "default" : "secondary"}>
                                  {job.status}
                                </Badge>
                              </div>
                              {job.description && (
                                <p className="text-sm text-muted-foreground line-clamp-2">
                                  {job.description}
                                </p>
                              )}
                              <div className="flex flex-wrap gap-1">
                                {[...(job.required_skills || []), ...(job.preferred_skills || [])]
                                  .slice(0, 3)
                                  .map((skill, i) => (
                                    <Badge key={i} variant="outline" className="text-xs">
                                      {skill}
                                    </Badge>
                                  ))}
                                {[...(job.required_skills || []), ...(job.preferred_skills || [])].length > 3 && (
                                  <Badge variant="secondary" className="text-xs">
                                    +{[...(job.required_skills || []), ...(job.preferred_skills || [])].length - 3}
                                  </Badge>
                                )}
                              </div>
                              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <Users className="h-4 w-4" />
                                {job.applicationCount || 0} applications
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Candidates Results */}
              {(searchType === "candidates" || searchType === "both") && (
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-2">
                        <TrendingUp className="h-5 w-5 text-primary" />
                        Candidate Results
                        {filteredCandidates.length > 0 && (
                          <Badge variant="secondary" className="ml-2">
                            {filteredCandidates.length} {filteredCandidates.length === 1 ? "match" : "matches"}
                          </Badge>
                        )}
                      </CardTitle>
                      {(filteredCandidates.length > 0 || filteredJobs.length > 0) && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSearched(false);
                            setResults([]);
                            setJobResults([]);
                            setSearchQuery("");
                            clearFilters();
                          }}
                        >
                          Clear Results
                        </Button>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    {filteredCandidates.length === 0 ? (
                      <Alert>
                        <SearchIcon className="h-4 w-4" />
                        <AlertDescription>
                          No candidates found for "{searchQuery}". Try different keywords or
                          check if candidates have applied to related job positions.
                        </AlertDescription>
                      </Alert>
                    ) : (
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Candidate</TableHead>
                              <TableHead>Contact</TableHead>
                              <TableHead>Skills</TableHead>
                              <TableHead>Applied For</TableHead>
                              <TableHead>Stage</TableHead>
                              <TableHead>Match Score</TableHead>
                              <TableHead>Date</TableHead>
                              <TableHead>Actions</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {filteredCandidates.map((result, index) => (
                          <TableRow key={`${result.candidate.id}-${index}`}>
                            <TableCell className="font-medium">
                              <div className="flex flex-col">
                                <span>{result.candidate.name}</span>
                                {result.candidate.experience_years && (
                                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                                    <Briefcase className="h-3 w-3" />
                                    {result.candidate.experience_years} years exp
                                  </span>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex flex-col gap-1 text-sm">
                                <a
                                  href={`mailto:${result.candidate.email}`}
                                  className="flex items-center gap-1 hover:text-primary"
                                >
                                  <Mail className="h-3 w-3" />
                                  {result.candidate.email}
                                </a>
                                {result.candidate.phone && (
                                  <a
                                    href={`tel:${result.candidate.phone}`}
                                    className="flex items-center gap-1 hover:text-primary"
                                  >
                                    <Phone className="h-3 w-3" />
                                    {result.candidate.phone}
                                  </a>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex flex-wrap gap-1 max-w-xs">
                                {result.candidate.skills.slice(0, 3).map((skill, i) => (
                                  <Badge key={i} variant="outline" className="text-xs">
                                    {skill}
                                  </Badge>
                                ))}
                                {result.candidate.skills.length > 3 && (
                                  <Badge variant="secondary" className="text-xs">
                                    +{result.candidate.skills.length - 3} more
                                  </Badge>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex flex-col">
                                <span className="font-medium text-sm">
                                  {result.job.title}
                                </span>
                                <Badge
                                  variant={
                                    result.job.status === "active"
                                      ? "default"
                                      : "secondary"
                                  }
                                  className="text-xs w-fit mt-1"
                                >
                                  {result.job.status}
                                </Badge>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant="outline"
                                className={getSourceBadge(result.candidate.source)}
                              >
                                {result.candidate.source}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant="secondary"
                                className={getScoreBadgeColor(result.matchScore)}
                              >
                                {result.matchScore}%
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                <Calendar className="h-3 w-3" />
                                {new Date(result.candidate.created_at).toLocaleDateString()}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex gap-2">
                                {result.candidate.cv_file_url && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() =>
                                      window.open(result.candidate.cv_file_url, "_blank")
                                    }
                                    title="Download CV"
                                  >
                                    <Download className="h-4 w-4" />
                                  </Button>
                                )}
                                {result.candidate.linkedin_profile_url && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() =>
                                      window.open(
                                        result.candidate.linkedin_profile_url,
                                        "_blank"
                                      )
                                    }
                                    title="View LinkedIn"
                                  >
                                    <svg
                                      className="h-4 w-4"
                                      fill="currentColor"
                                      viewBox="0 0 24 24"
                                    >
                                      <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
                                    </svg>
                                  </Button>
                                )}
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
              )}

              {/* No Results Message */}
              {searched && 
               ((searchType === "jobs" || searchType === "both") && filteredJobs.length === 0) &&
               ((searchType === "candidates" || searchType === "both") && filteredCandidates.length === 0) && (
                <Card>
                  <CardContent className="py-12 text-center">
                    <SearchIcon className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-xl font-semibold mb-2">No results found</h3>
                    <p className="text-muted-foreground mb-4">
                      No {searchType === "both" ? "jobs or candidates" : searchType} found for "{searchQuery}".
                    </p>
                    {activeFiltersCount > 0 && (
                      <Button onClick={clearFilters} variant="outline">
                        Clear Filters
                      </Button>
                    )}
                  </CardContent>
                </Card>
              )}
            </>
          )}

          {/* Info Card */}
          {!searched && (
            <Card className="bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800">
              <CardContent className="pt-6">
                <div className="space-y-3">
                  <h3 className="font-semibold text-blue-900 dark:text-blue-300">
                    How LinkedIn-Style Search Works:
                  </h3>
                  <ul className="list-disc list-inside space-y-2 text-sm text-blue-800 dark:text-blue-300">
                    <li>
                      Search by job role (e.g., "AI Specialist", "Frontend Developer")
                    </li>
                    <li>
                      System matches keywords to job titles and required skills
                    </li>
                    <li>Returns ALL candidates who applied to matching jobs</li>
                    <li>
                      Includes candidates from all stages (Candidates, Shortlisted, Final
                      Interview)
                    </li>
                    <li>Shows match score based on skill overlap</li>
                    <li>Searches ALL jobs (active, closed, archived) - nothing deleted!</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
    </DashboardLayout>
  );
};

export default CandidateSearch;