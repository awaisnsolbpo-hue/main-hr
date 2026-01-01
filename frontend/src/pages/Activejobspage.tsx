import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Briefcase, ArrowLeft, Calendar, MapPin, DollarSign, Loader2, ExternalLink } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import DashboardLayout from "@/components/DashboardLayout";
import {
  MDTable,
  MDTableHeader,
  MDTableHeaderCell,
  MDTableBody,
  MDTableRow,
  MDTableCell
} from "@/components/ui/MDTable";

interface Job {
  id: string;
  title: string;
  description?: string;
  location?: string;
  city?: string;
  country?: string;
  salary_range?: string;
  job_type?: string;
  job_level?: string;
  status: string;
  created_at: string;
  close_date?: string;
}

const ActiveJobsPage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadActiveJobs();
  }, []);

  const loadActiveJobs = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/login");
        return;
      }

      const { data, error } = await supabase
        .from("jobs")
        .select("*")
        .eq("user_id", user.id)
        .eq("status", "active")
        .order("created_at", { ascending: false });

      if (error) throw error;

      setJobs(data || []);
      console.log('📊 Active Jobs Loaded:', data?.length || 0);
    } catch (error: any) {
      console.error("Error loading active jobs:", error);
      toast({
        title: "Error",
        description: "Failed to load active jobs",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
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
          <h1 className="text-2xl font-bold text-[#344767] mb-2">Active Jobs</h1>
          <p className="text-sm font-light text-[#7b809a]">
            Manage your active job postings
          </p>
        </div>

        {/* Material Dashboard Table */}
        <MDTable
          title="All Active Jobs"
          headerActions={
            <Badge className="bg-gradient-to-br from-[#1A73E8] to-[#49a3f1] text-white border-0 shadow-blue">
              {jobs.length} Total
            </Badge>
          }
        >
          {jobs.length === 0 ? (
            <tbody>
              <tr>
                <td colSpan={9}>
                  <div className="text-center py-12">
                    <Briefcase className="h-16 w-16 text-[#7b809a] mx-auto mb-4 opacity-50" />
                    <h3 className="text-lg font-semibold text-[#344767] mb-2">No Active Jobs</h3>
                    <p className="text-sm font-light text-[#7b809a] mb-4">
                      Create your first job posting to start hiring
                    </p>
                    <Button
                      onClick={() => navigate("/recruiter/create-job")}
                      className="bg-gradient-to-r from-[#EC407A] to-[#D81B60] text-white border-0 shadow-pink hover:shadow-md transition-all duration-200"
                    >
                      Create Job
                    </Button>
                  </div>
                </td>
              </tr>
            </tbody>
          ) : (
            <>
              <MDTableHeader>
                <MDTableHeaderCell>Job Title</MDTableHeaderCell>
                <MDTableHeaderCell>Location</MDTableHeaderCell>
                <MDTableHeaderCell>Salary</MDTableHeaderCell>
                <MDTableHeaderCell>Type</MDTableHeaderCell>
                <MDTableHeaderCell>Level</MDTableHeaderCell>
                <MDTableHeaderCell>Posted</MDTableHeaderCell>
                <MDTableHeaderCell>Closes</MDTableHeaderCell>
                <MDTableHeaderCell>Status</MDTableHeaderCell>
                <MDTableHeaderCell>Actions</MDTableHeaderCell>
              </MDTableHeader>
              <MDTableBody>
                {jobs.map((job) => (
                  <MDTableRow key={job.id} onClick={() => navigate(`/job/${job.id}`)}>
                    <MDTableCell>
                      <div>
                        <p className="text-sm font-semibold text-[#344767]">{job.title}</p>
                        {job.description && (
                          <p className="text-xs font-light text-[#7b809a] line-clamp-1 mt-1">
                            {job.description.substring(0, 60)}...
                          </p>
                        )}
                      </div>
                    </MDTableCell>
                    <MDTableCell>
                      <div className="flex items-center gap-1 text-sm text-[#7b809a]">
                        <MapPin className="h-3 w-3" />
                        {job.city && job.country
                          ? `${job.city}, ${job.country}`
                          : job.location || "Not specified"}
                      </div>
                    </MDTableCell>
                    <MDTableCell>
                      <div className="flex items-center gap-1 text-sm text-[#7b809a]">
                        <DollarSign className="h-3 w-3" />
                        {job.salary_range || "Not specified"}
                      </div>
                    </MDTableCell>
                    <MDTableCell>
                      {job.job_type ? (
                        <Badge className="bg-[#1A73E8]/10 text-[#1A73E8] border border-[#1A73E8]/20 hover:bg-[#1A73E8]/20">
                          {job.job_type}
                        </Badge>
                      ) : (
                        <span className="text-xs text-[#7b809a]">-</span>
                      )}
                    </MDTableCell>
                    <MDTableCell>
                      {job.job_level ? (
                        <Badge className="bg-[#fb8c00]/10 text-[#fb8c00] border border-[#fb8c00]/20 hover:bg-[#fb8c00]/20">
                          {job.job_level}
                        </Badge>
                      ) : (
                        <span className="text-xs text-[#7b809a]">-</span>
                      )}
                    </MDTableCell>
                    <MDTableCell>
                      <div className="flex items-center gap-1 text-sm text-[#7b809a]">
                        <Calendar className="h-3 w-3" />
                        {formatDate(job.created_at)}
                      </div>
                    </MDTableCell>
                    <MDTableCell>
                      {job.close_date ? (
                        <div className="text-sm font-light text-[#7b809a]">{formatDate(job.close_date)}</div>
                      ) : (
                        <span className="text-xs text-[#7b809a]">No deadline</span>
                      )}
                    </MDTableCell>
                    <MDTableCell>
                      <Badge className="bg-[#4CAF50] text-white border-0 hover:bg-[#43A047]">
                        Active
                      </Badge>
                    </MDTableCell>
                    <MDTableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/job/${job.id}`);
                        }}
                        className="hover:bg-[#e91e63]/10 hover:text-[#e91e63]"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    </MDTableCell>
                  </MDTableRow>
                ))}
              </MDTableBody>
            </>
          )}
        </MDTable>
      </div>
    </DashboardLayout>
  );
};

export default ActiveJobsPage;