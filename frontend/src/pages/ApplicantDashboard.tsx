import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { applicantsApi, communityApi, publicApi } from "@/services/api";
import { useQuery } from "@tanstack/react-query";
import {
  Briefcase,
  FileText,
  User,
  MapPin,
  Calendar,
  CheckCircle,
  Clock,
  XCircle,
  Search,
  ArrowRight,
  Edit,
  Upload,
  Mail,
  Phone,
  Award,
  TrendingUp,
  Eye,
  Building,
  GraduationCap,
  ExternalLink,
  Video,
  Code2,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { format } from "date-fns";
import { useUserRoleAndProfile } from "@/hooks/useUserRoleAndProfile";
import { formatPercentage } from "@/lib/numberFormat";

const ApplicantDashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, role, applicantProfile, loading } = useUserRoleAndProfile(true);
  const [selectedApplication, setSelectedApplication] = useState<any>(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);

  // Use profile from hook instead of fetching again (performance optimization)
  const applicant = applicantProfile;
  const applicantId = applicantProfile?.id || applicantProfile?.user_id;
  const applicantEmail = applicant?.email || user?.email;

  // Fetch applications by email (includes all test scores and interview stages)
  const { data: applicationsData, isLoading: applicationsLoading } = useQuery({
    queryKey: ['applicant-applications-by-email', applicantEmail],
    queryFn: async () => {
      if (!applicantEmail) return [];
      try {
        return await publicApi.getCandidateApplications(applicantEmail);
      } catch (error) {
        console.error('Error fetching applications:', error);
        return [];
      }
    },
    enabled: !!applicantEmail,
    staleTime: 30000, // Cache for 30 seconds
    refetchOnWindowFocus: false, // Don't refetch on window focus
  });

  const applications = Array.isArray(applicationsData) ? applicationsData : [];

  // Fetch only 6 community jobs initially (faster load)
  const { data: communityJobsData, isLoading: communityJobsLoading } = useQuery({
    queryKey: ['community-jobs-dashboard'],
    queryFn: () => communityApi.getJobs({ page: 1, limit: 6 }),
    enabled: !!user,
    staleTime: 60000, // Cache for 1 minute (jobs don't change often)
    refetchOnWindowFocus: false,
  });

  const communityJobs = communityJobsData?.jobs || [];

  // Calculate stats
  const totalApplications = applications.length;
  const activeApplications = applications.filter((a: any) => 
    ['applied', 'viewed', 'shortlisted', 'interview'].includes(a.status?.toLowerCase())
  ).length;
  const hiredCount = applications.filter((a: any) => 
    a.status?.toLowerCase() === 'hired'
  ).length;
  const rejectedCount = applications.filter((a: any) => 
    a.status?.toLowerCase() === 'rejected'
  ).length;

  const getInitials = (firstName?: string, lastName?: string) => {
    const first = firstName?.charAt(0) || '';
    const last = lastName?.charAt(0) || '';
    return `${first}${last}`.toUpperCase() || 'A';
  };

  const getStatusBadge = (status: string, stage?: string) => {
    const statusLower = status?.toLowerCase() || '';
    const stageLower = stage?.toLowerCase() || '';
    
    if (statusLower === 'hired') {
      return (
        <Badge variant="outline" className="bg-green-500 text-white border-green-600">
          <CheckCircle className="h-3 w-3 mr-1" />
          Hired
        </Badge>
      );
    }
    if (statusLower === 'rejected') {
      return (
        <Badge variant="destructive">
          <XCircle className="h-3 w-3 mr-1" />
          Rejected
        </Badge>
      );
    }
    // Show stage if available, otherwise show status
    const displayText = stage || status || 'Applied';
    if (['shortlisted', 'interview', 'qualified for final interview', 'final interview'].includes(stageLower) || 
        ['shortlisted', 'interview'].includes(statusLower)) {
      return (
        <Badge variant="outline" className="bg-blue-500 text-white border-blue-600">
          <Award className="h-3 w-3 mr-1" />
          {displayText}
        </Badge>
      );
    }
    if (stageLower.includes('mcq') || stageLower.includes('test')) {
      return (
        <Badge variant="outline" className="bg-blue-500 text-white border-blue-600 dark:bg-blue-600 dark:text-white dark:border-blue-700">
          <FileText className="h-3 w-3 mr-1 text-white dark:text-white" />
          {displayText}
        </Badge>
      );
    }
    return (
      <Badge variant="secondary">
        <Clock className="h-3 w-3 mr-1" />
        {displayText}
      </Badge>
    );
  };

  const getScoreColor = (score: number | null) => {
    if (!score) return "text-foreground/70 font-semibold";
    if (score >= 80) return "text-green-600";
    if (score >= 60) return "text-yellow-600";
    return "text-red-600";
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-secondary/20">
        <Card className="max-w-md w-full shadow-xl border-2 border-border/60 bg-card/95 backdrop-blur-xl">
          <CardContent className="pt-6 text-center space-y-4">
            <p className="text-foreground/80 font-semibold">Please log in to view your dashboard</p>
            <Button onClick={() => navigate('/applicant/login')} className="bg-gradient-to-r from-primary to-accent hover:opacity-90">
              Log In
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/20">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
              <User className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">Applicant Dashboard</h1>
              <p className="text-xs text-foreground/80 font-medium">Manage your applications and profile</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button 
              onClick={() => navigate('/community')} 
              className="bg-blue-600 hover:bg-blue-700 text-white border-0 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              <Search className="mr-2 h-4 w-4 text-white" />
              Browse Jobs
            </Button>
            <Button 
              onClick={async () => {
                await supabase.auth.signOut();
                navigate('/applicant/login');
              }} 
              className="bg-blue-600 hover:bg-blue-700 text-white border-0 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              Logout
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="max-w-7xl mx-auto space-y-8">
          {/* Profile Section */}
          <Card className="shadow-xl border-2 border-border/60 bg-card/95 backdrop-blur-xl">
            <CardContent className="pt-6">
              {loading ? (
                <div className="flex items-center gap-6">
                  <Skeleton className="h-24 w-24 rounded-full" />
                  <div className="space-y-2 flex-1">
                    <Skeleton className="h-6 w-48" />
                    <Skeleton className="h-4 w-64" />
                  </div>
                </div>
              ) : applicant ? (
                <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
                  <Avatar className="h-24 w-24 border-4 border-blue-200 shadow-lg">
                    <AvatarImage src={applicant.profile_picture_url || undefined} />
                    <AvatarFallback className="bg-blue-600 text-white text-2xl font-bold">
                      {getInitials(applicant.first_name, applicant.last_name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center justify-between flex-wrap gap-4">
                      <div>
                        <h2 className="text-2xl font-bold text-foreground">
                          {applicant.first_name} {applicant.last_name}
                        </h2>
                        <div className="flex items-center gap-4 mt-2 text-sm text-foreground/80 font-medium">
                          {applicant.email && (
                            <div className="flex items-center gap-1">
                              <Mail className="h-4 w-4 text-blue-600" />
                              {applicant.email}
                            </div>
                          )}
                          {applicant.phone && (
                            <div className="flex items-center gap-1">
                              <Phone className="h-4 w-4 text-blue-600" />
                              {applicant.phone}
                            </div>
                          )}
                        </div>
                      </div>
                      <Button 
                        size="sm"
                        onClick={() => navigate("/applicant/profile/edit")}
                        className="bg-blue-600 hover:bg-blue-700 text-white border-0 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                      >
                        <Edit className="mr-2 h-4 w-4 text-white" />
                        Edit Profile
                      </Button>
                    </div>
                    <div className="flex flex-wrap items-center gap-4 pt-2">
                      {applicant.profession && (
                        <Badge variant="outline" className="text-sm bg-blue-500 border-blue-600 text-white dark:bg-blue-600 dark:border-blue-700 dark:text-white">
                          <Briefcase className="h-3 w-3 mr-1 text-white dark:text-white" />
                          {applicant.profession}
                        </Badge>
                      )}
                      {applicant.industry && (
                        <Badge variant="outline" className="text-sm bg-blue-500 border-blue-600 text-white dark:bg-blue-600 dark:border-blue-700 dark:text-white">
                          <Building className="h-3 w-3 mr-1 text-white dark:text-white" />
                          {applicant.industry}
                        </Badge>
                      )}
                      {applicant.experience_level && (
                        <Badge variant="outline" className="text-sm capitalize bg-blue-500 border-blue-600 text-white dark:bg-blue-600 dark:border-blue-700 dark:text-white">
                          <Award className="h-3 w-3 mr-1 text-white dark:text-white" />
                          {applicant.experience_level} Level
                        </Badge>
                      )}
                      {applicant.location && (
                        <Badge variant="outline" className="text-sm bg-blue-500 border-blue-600 text-white dark:bg-blue-600 dark:border-blue-700 dark:text-white">
                          <MapPin className="h-3 w-3 mr-1 text-white dark:text-white" />
                          {applicant.location}
                        </Badge>
                      )}
                    </div>
                    {applicant.skills && applicant.skills.length > 0 && (
                      <div className="flex flex-wrap gap-2 pt-2">
                        {applicant.skills.slice(0, 8).map((skill: string) => (
                          <Badge key={skill} variant="secondary" className="text-xs">
                            {skill}
                          </Badge>
                        ))}
                        {applicant.skills.length > 8 && (
                          <Badge variant="secondary" className="text-xs">
                            +{applicant.skills.length - 8} more
                          </Badge>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <p className="text-foreground/80 font-semibold">Profile not found</p>
              )}
            </CardContent>
          </Card>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="shadow-lg border-2 border-blue-600 bg-blue-500 dark:bg-blue-600 dark:border-blue-700 hover:shadow-xl transition-shadow">
              <CardHeader className="pb-3">
                <CardDescription className="flex items-center gap-2 text-white dark:text-white">
                  <Briefcase className="h-4 w-4 text-white dark:text-white" />
                  Total Applications
                </CardDescription>
                <CardTitle className="text-4xl font-bold text-white dark:text-white">{totalApplications}</CardTitle>
              </CardHeader>
            </Card>
            <Card className="shadow-lg border-2 border-blue-600 bg-blue-500 dark:bg-blue-600 dark:border-blue-700 hover:shadow-xl transition-shadow">
              <CardHeader className="pb-3">
                <CardDescription className="flex items-center gap-2 text-white dark:text-white">
                  <Clock className="h-4 w-4 text-white dark:text-white" />
                  Active Applications
                </CardDescription>
                <CardTitle className="text-4xl font-bold text-white dark:text-white">{activeApplications}</CardTitle>
              </CardHeader>
            </Card>
            <Card className="shadow-lg border-2 border-blue-600 bg-blue-500 dark:bg-blue-600 dark:border-blue-700 hover:shadow-xl transition-shadow">
              <CardHeader className="pb-3">
                <CardDescription className="flex items-center gap-2 text-white dark:text-white">
                  <CheckCircle className="h-4 w-4 text-white dark:text-white" />
                  Hired
                </CardDescription>
                <CardTitle className="text-4xl font-bold text-white dark:text-white">{hiredCount}</CardTitle>
              </CardHeader>
            </Card>
            <Card className="shadow-lg border-2 border-blue-600 bg-blue-500 dark:bg-blue-600 dark:border-blue-700 hover:shadow-xl transition-shadow">
              <CardHeader className="pb-3">
                <CardDescription className="flex items-center gap-2 text-white dark:text-white">
                  <TrendingUp className="h-4 w-4 text-white dark:text-white" />
                  Success Rate
                </CardDescription>
                <CardTitle className="text-4xl font-bold text-white dark:text-white">
                  {totalApplications > 0 
                    ? Number(formatPercentage((hiredCount / totalApplications) * 100).replace('%', '')) 
                    : 0}%
                </CardTitle>
              </CardHeader>
            </Card>
          </div>

          {/* Community Jobs Section */}
          <Card className="shadow-xl border-2 border-border/60 bg-card/95 backdrop-blur-xl">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-2xl font-bold flex items-center gap-2">
                    <Briefcase className="h-6 w-6 text-blue-600" />
                    Community Jobs
                  </CardTitle>
                  <CardDescription className="mt-1">
                    Discover job opportunities from the community
                  </CardDescription>
                </div>
                <Button 
                  onClick={() => navigate('/community')}
                  className="bg-blue-600 hover:bg-blue-700 text-white border-0 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                >
                  <ExternalLink className="mr-2 h-4 w-4 text-white" />
                  View All Jobs
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {communityJobsLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-48 w-full" />
                  ))}
                </div>
              ) : communityJobs.length === 0 ? (
                <div className="text-center py-12">
                  <Briefcase className="h-16 w-16 mx-auto mb-4 text-foreground/60" />
                  <h3 className="text-lg font-semibold text-foreground mb-2">No Community Jobs Available</h3>
                  <p className="text-foreground/80 font-semibold mb-6">Check back later for new job postings</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {communityJobs.map((job: any) => (
                    <Card 
                      key={job.id}
                      className="border-2 border-border/60 bg-card hover:shadow-lg transition-all duration-300 cursor-pointer hover:border-primary/50 group"
                      onClick={() => navigate(`/jobs/public/${job.id}`)}
                    >
                      <CardContent className="pt-6">
                        <div className="space-y-4">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1">
                              <h3 className="text-lg font-bold text-foreground mb-1 group-hover:text-blue-600 transition-colors line-clamp-2">
                                {job.title || 'Untitled Position'}
                              </h3>
                              {(job.user?.company_name || job.company_name) && (
                                <p className="text-sm text-foreground/80 font-medium flex items-center gap-1">
                                  <Building className="h-3 w-3" />
                                  {job.user?.company_name || job.company_name}
                                </p>
                              )}
                            </div>
                          </div>
                          
                          {job.description && (
                            <p className="text-sm text-foreground/80 font-medium line-clamp-3">
                              {job.description}
                            </p>
                          )}
                          
                          <div className="flex flex-wrap items-center gap-2 text-xs">
                            {job.location && (
                              <Badge variant="outline" className="text-xs">
                                <MapPin className="h-3 w-3 mr-1" />
                                {job.location}
                              </Badge>
                            )}
                            {(job.salary_min || job.salary_max) && (
                              <Badge variant="outline" className="text-xs">
                                <Award className="h-3 w-3 mr-1" />
                                ${job.salary_min?.toLocaleString() || 'N/A'} - ${job.salary_max?.toLocaleString() || 'N/A'}
                              </Badge>
                            )}
                            {job.job_type && (
                              <Badge variant="secondary" className="text-xs capitalize">
                                {job.job_type}
                              </Badge>
                            )}
                          </div>

                          {job.skills && job.skills.length > 0 && (
                            <div className="flex flex-wrap gap-1 pt-2 border-t border-border/60">
                              {job.skills.slice(0, 3).map((skill: string, idx: number) => (
                                <Badge key={idx} variant="secondary" className="text-xs">
                                  {skill}
                                </Badge>
                              ))}
                              {job.skills.length > 3 && (
                                <Badge variant="secondary" className="text-xs">
                                  +{job.skills.length - 3}
                                </Badge>
                              )}
                            </div>
                          )}

                          <div className="flex items-center justify-between pt-2 border-t border-border/60">
                            {job.created_at && (
                              <div className="flex items-center gap-1 text-xs text-foreground/80 font-medium">
                                <Calendar className="h-3 w-3" />
                                {format(new Date(job.created_at), 'MMM dd, yyyy')}
                              </div>
                            )}
                            <Button
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                navigate(`/jobs/public/${job.id}`);
                              }}
                              className="bg-blue-600 hover:bg-blue-700 text-white border-0"
                            >
                              View Details
                              <ArrowRight className="ml-1 h-3 w-3 text-white" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Applications Section */}
          <Card className="shadow-xl border-2 border-border/60 bg-card/95 backdrop-blur-xl">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-2xl font-bold">My Job Applications</CardTitle>
                  <CardDescription className="mt-1">
                    Track your applications, scores, and status
                  </CardDescription>
                </div>
                <Button 
                  onClick={() => navigate('/community')}
                  className="bg-blue-600 hover:bg-blue-700 text-white border-0 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                >
                  <Search className="mr-2 h-4 w-4 text-white" />
                  Find Jobs
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {applicationsLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-32 w-full" />
                  ))}
                </div>
              ) : applications.length === 0 ? (
                <div className="text-center py-12">
                  <Briefcase className="h-16 w-16 mx-auto mb-4 text-foreground/60" />
                  <h3 className="text-lg font-semibold text-foreground mb-2">No Applications Yet</h3>
                  <p className="text-foreground/80 font-semibold mb-6">Start applying to jobs to see them here</p>
                  <Button 
                    onClick={() => navigate('/community')}
                    className="bg-blue-600 hover:bg-blue-700 text-white border-0 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                  >
                    <Search className="mr-2 h-4 w-4 text-white" />
                    Browse Available Jobs
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {applications.map((application: any) => (
                    <Card 
                      key={application.id}
                      className="border-2 border-border/60 bg-card hover:shadow-lg transition-all duration-300 cursor-pointer hover:border-primary/50"
                      onClick={() => {
                        setSelectedApplication(application);
                        setDetailModalOpen(true);
                      }}
                    >
                      <CardContent className="pt-6">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                          <div className="flex-1 space-y-3">
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex-1">
                                <h3 className="text-xl font-bold text-foreground mb-1">
                                  {application.job_title || application.job?.title || 'Unknown Position'}
                                </h3>
                                {(application.job_description || application.job?.description) && (
                                  <p className="text-sm text-foreground/80 font-medium line-clamp-2 mb-3">
                                    {application.job_description || application.job?.description}
                                  </p>
                                )}
                              </div>
                              {getStatusBadge(application.status, application.stage)}
                            </div>
                            
                            <div className="flex flex-wrap items-center gap-4 text-sm">
                              <div className="flex items-center gap-1 text-foreground/80 font-medium">
                                <Calendar className="h-4 w-4" />
                                Applied {format(new Date(application.applied_at || application.created_at), 'MMM dd, yyyy')}
                              </div>
                              {application.job_location && (
                                <div className="flex items-center gap-1 text-foreground/80 font-medium">
                                  <MapPin className="h-4 w-4" />
                                  {application.job_location}
                                </div>
                              )}
                              {application.stage && (
                                <div className="flex items-center gap-1">
                                  <TrendingUp className="h-4 w-4 text-primary" />
                                  <span className="font-semibold text-foreground">
                                    Stage: {application.stage}
                                  </span>
                                </div>
                              )}
                            </div>
                            
                            {/* Test Scores Summary */}
                            {(application.ats_score > 0 || application.mcq_score > 0 || application.technical_score > 0 || application.interview_score > 0) && (
                              <div className="flex flex-wrap items-center gap-4 pt-2 border-t border-border/60">
                                {application.ats_score > 0 && (
                                  <div className="flex items-center gap-1">
                                    <Award className="h-4 w-4 text-blue-600" />
                                    <span className={`text-sm font-semibold ${getScoreColor(application.ats_score)}`}>
                                      ATS: {application.ats_score}%
                                    </span>
                                  </div>
                                )}
                                {application.mcq_score > 0 && (
                                  <div className="flex items-center gap-1">
                                    <FileText className="h-4 w-4 text-blue-600" />
                                    <span className={`text-sm font-semibold ${getScoreColor(application.mcq_score)}`}>
                                      MCQ: {application.mcq_score}%
                                    </span>
                                  </div>
                                )}
                                {application.technical_score > 0 && (
                                  <div className="flex items-center gap-1">
                                    <Code2 className="h-4 w-4 text-blue-600" />
                                    <span className={`text-sm font-semibold ${getScoreColor(application.technical_score)}`}>
                                      Technical: {application.technical_score}%
                                    </span>
                                  </div>
                                )}
                                {application.interview_score > 0 && (
                                  <div className="flex items-center gap-1">
                                    <Video className="h-4 w-4 text-green-600" />
                                    <span className={`text-sm font-semibold ${getScoreColor(application.interview_score)}`}>
                                      Interview: {application.interview_score}%
                                    </span>
                                  </div>
                                )}
                                {application.overall_score > 0 && (
                                  <div className="flex items-center gap-1 ml-auto">
                                    <TrendingUp className="h-4 w-4 text-blue-600" />
                                    <span className={`text-sm font-bold ${getScoreColor(application.overall_score)}`}>
                                      Overall: {application.overall_score}%
                                    </span>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedApplication(application);
                                setDetailModalOpen(true);
                              }}
                              className="bg-blue-600 hover:bg-blue-700 text-white border-0 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                            >
                              <Eye className="mr-2 h-4 w-4 text-white" />
                              View Details
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Application Detail Modal */}
      <Dialog open={detailModalOpen} onOpenChange={setDetailModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-card border-2 border-border/60 shadow-xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold">Application Details</DialogTitle>
            <DialogDescription>
              Complete information about your job application
            </DialogDescription>
          </DialogHeader>
          
          {selectedApplication && (
            <div className="space-y-6 mt-4">
              {/* Job Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-bold flex items-center gap-2">
                  <Briefcase className="h-5 w-5 text-blue-600" />
                  Job Position
                </h3>
                <Card className="border-2 border-border/60 bg-card/50">
                  <CardContent className="pt-6">
                    <h4 className="text-xl font-bold text-foreground mb-2">
                      {selectedApplication.job_title || selectedApplication.job?.title || 'Unknown Position'}
                    </h4>
                    {(selectedApplication.job_description || selectedApplication.job?.description) && (
                      <p className="text-sm text-foreground/80 font-medium whitespace-pre-wrap mb-4">
                        {selectedApplication.job_description || selectedApplication.job?.description}
                      </p>
                    )}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {selectedApplication.job_location && (
                        <div className="flex items-center gap-2 text-sm">
                          <MapPin className="h-4 w-4 text-blue-600" />
                          <span className="text-foreground">{selectedApplication.job_location}</span>
                        </div>
                      )}
                      {selectedApplication.job?.location && !selectedApplication.job_location && (
                        <div className="flex items-center gap-2 text-sm">
                          <MapPin className="h-4 w-4 text-blue-600" />
                          <span className="text-foreground">{selectedApplication.job.location}</span>
                        </div>
                      )}
                      {(selectedApplication.job?.salary_min || selectedApplication.job?.salary_max) && (
                        <div className="flex items-center gap-2 text-sm">
                          <Award className="h-4 w-4 text-blue-600" />
                          <span className="text-foreground">
                            ${selectedApplication.job.salary_min?.toLocaleString()} - ${selectedApplication.job.salary_max?.toLocaleString()}
                          </span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Separator />

              {/* Application Status & Stage */}
              <div className="space-y-4">
                <h3 className="text-lg font-bold flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-blue-600" />
                  Application Status & Stage
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card className="border-2 border-border/60 bg-card/50">
                    <CardContent className="pt-6">
                      <p className="text-sm text-foreground/80 font-semibold mb-2">Application Status</p>
                      <div className="flex items-center gap-2">
                        {getStatusBadge(selectedApplication.status, selectedApplication.stage)}
                      </div>
                      {selectedApplication.stage && (
                        <p className="text-xs text-foreground/80 font-medium mt-2">
                          Current Stage: {selectedApplication.stage}
                        </p>
                      )}
                    </CardContent>
                  </Card>
                  {selectedApplication.next_step && (
                    <Card className="border-2 border-border/60 bg-card/50">
                      <CardContent className="pt-6">
                        <p className="text-sm text-foreground/80 font-semibold mb-2">Next Step</p>
                        <p className="text-sm font-semibold text-foreground">
                          {selectedApplication.next_step}
                        </p>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </div>

              <Separator />

              {/* Test Scores */}
              {(selectedApplication.ats_score > 0 || selectedApplication.mcq_score > 0 || 
                selectedApplication.technical_score > 0 || selectedApplication.interview_score > 0) && (
                <div className="space-y-4">
                  <h3 className="text-lg font-bold flex items-center gap-2">
                    <Award className="h-5 w-5 text-blue-600" />
                    Assessment Scores
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {selectedApplication.ats_score > 0 && (
                      <Card className="border-2 border-border/60 bg-card/50">
                        <CardContent className="pt-6">
                          <p className="text-sm text-foreground/80 font-semibold mb-2 flex items-center gap-2">
                            <Award className="h-4 w-4" />
                            ATS Score
                          </p>
                          <p className={`text-3xl font-bold ${getScoreColor(selectedApplication.ats_score)}`}>
                            {selectedApplication.ats_score}%
                          </p>
                        </CardContent>
                      </Card>
                    )}
                    {selectedApplication.mcq_score > 0 && (
                      <Card className="border-2 border-border/60 bg-card/50">
                        <CardContent className="pt-6">
                          <p className="text-sm text-foreground/80 font-semibold mb-2 flex items-center gap-2">
                            <FileText className="h-4 w-4 text-blue-600" />
                            MCQ Test
                          </p>
                          <p className={`text-3xl font-bold ${getScoreColor(selectedApplication.mcq_score)}`}>
                            {selectedApplication.mcq_score}%
                          </p>
                        </CardContent>
                      </Card>
                    )}
                    {selectedApplication.technical_score > 0 && (
                      <Card className="border-2 border-border/60 bg-card/50">
                        <CardContent className="pt-6">
                          <p className="text-sm text-foreground/80 font-semibold mb-2 flex items-center gap-2">
                            <Code2 className="h-4 w-4 text-blue-600" />
                            Technical Test
                          </p>
                          <p className={`text-3xl font-bold ${getScoreColor(selectedApplication.technical_score)}`}>
                            {selectedApplication.technical_score}%
                          </p>
                        </CardContent>
                      </Card>
                    )}
                    {selectedApplication.interview_score > 0 && (
                      <Card className="border-2 border-border/60 bg-card/50">
                        <CardContent className="pt-6">
                          <p className="text-sm text-foreground/80 font-semibold mb-2 flex items-center gap-2">
                            <Video className="h-4 w-4 text-blue-600" />
                            Final Interview
                          </p>
                          <p className={`text-3xl font-bold ${getScoreColor(selectedApplication.interview_score)}`}>
                            {selectedApplication.interview_score}%
                          </p>
                        </CardContent>
                      </Card>
                    )}
                  </div>
                  {selectedApplication.overall_score > 0 && (
                    <Card className="border-2 border-blue-500 bg-blue-50 dark:bg-blue-950 dark:border-blue-700">
                      <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-semibold text-foreground flex items-center gap-2">
                            <TrendingUp className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                            Overall Score
                          </p>
                          <p className={`text-4xl font-bold ${getScoreColor(selectedApplication.overall_score)}`}>
                            {selectedApplication.overall_score}%
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>
              )}

              <Separator />

              {/* ATS Breakdown */}
              {selectedApplication.ats_breakdown && (
                <>
                  <div className="space-y-4">
                    <h3 className="text-lg font-bold flex items-center gap-2">
                      <TrendingUp className="h-5 w-5 text-blue-600" />
                      ATS Analysis Breakdown
                    </h3>
                    <Card className="border-2 border-border/60 bg-card/50">
                      <CardContent className="pt-6 space-y-4">
                        {selectedApplication.ats_strength && (
                          <div>
                            <p className="text-sm font-semibold text-green-600 mb-2">Strengths</p>
                            <p className="text-sm text-foreground whitespace-pre-wrap">
                              {selectedApplication.ats_strength}
                            </p>
                          </div>
                        )}
                        {selectedApplication.ats_weakness && (
                          <div>
                            <p className="text-sm font-semibold text-orange-600 mb-2">Areas for Improvement</p>
                            <p className="text-sm text-foreground whitespace-pre-wrap">
                              {selectedApplication.ats_weakness}
                            </p>
                          </div>
                        )}
                        {selectedApplication.ats_recommendation && (
                          <div>
                            <p className="text-sm font-semibold text-blue-600 mb-2">Recommendation</p>
                            <p className="text-sm text-foreground whitespace-pre-wrap">
                              {selectedApplication.ats_recommendation}
                            </p>
                          </div>
                        )}
                        {selectedApplication.ats_breakdown && typeof selectedApplication.ats_breakdown === 'object' && (
                          <div className="pt-4 border-t border-border/60">
                            <p className="text-sm font-semibold text-foreground mb-2">Detailed Breakdown</p>
                            <div className="text-xs text-foreground/80 font-medium space-y-1">
                              {Object.entries(selectedApplication.ats_breakdown).map(([key, value]: [string, any]) => (
                                <div key={key} className="flex justify-between">
                                  <span className="capitalize">{key.replace(/_/g, ' ')}:</span>
                                  <span>{typeof value === 'number' ? `${value}%` : String(value)}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </div>
                  <Separator />
                </>
              )}

              {/* MCQ Test Details */}
              {selectedApplication.mcq_details && (
                <>
                  <div className="space-y-4">
                    <h3 className="text-lg font-bold flex items-center gap-2">
                      <FileText className="h-5 w-5 text-blue-600" />
                      MCQ Test Details
                    </h3>
                    <Card className="border-2 border-border/60 bg-card/50">
                      <CardContent className="pt-6">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                          {selectedApplication.mcq_details.totalQuestions !== undefined && (
                            <div>
                              <p className="text-xs text-foreground/80 font-semibold mb-1">Total Questions</p>
                              <p className="text-lg font-bold text-foreground">{selectedApplication.mcq_details.totalQuestions}</p>
                            </div>
                          )}
                          {selectedApplication.mcq_details.correctAnswers !== undefined && (
                            <div>
                              <p className="text-xs text-foreground/80 font-semibold mb-1">Correct</p>
                              <p className="text-lg font-bold text-green-600">{selectedApplication.mcq_details.correctAnswers}</p>
                            </div>
                          )}
                          {selectedApplication.mcq_details.wrongAnswers !== undefined && (
                            <div>
                              <p className="text-xs text-foreground/80 font-semibold mb-1">Incorrect</p>
                              <p className="text-lg font-bold text-red-600">{selectedApplication.mcq_details.wrongAnswers}</p>
                            </div>
                          )}
                          {selectedApplication.mcq_details.duration !== undefined && (
                            <div>
                              <p className="text-xs text-foreground/80 font-semibold mb-1">Duration</p>
                              <p className="text-lg font-bold text-foreground">{selectedApplication.mcq_details.duration} min</p>
                            </div>
                          )}
                        </div>
                        {selectedApplication.mcq_details.takenAt && (
                          <div className="pt-4 border-t border-border/60">
                            <p className="text-xs text-foreground/80 font-semibold mb-1">Test Taken</p>
                            <p className="text-sm text-foreground">
                              {format(new Date(selectedApplication.mcq_details.takenAt), 'PPp')}
                            </p>
                          </div>
                        )}
                        {selectedApplication.mcq_details.recordingUrl && (
                          <div className="pt-4 border-t border-border/60">
                            <Button
                              size="sm"
                              onClick={() => window.open(selectedApplication.mcq_details.recordingUrl, '_blank')}
                              className="mt-2 bg-blue-600 hover:bg-blue-700 text-white border-0"
                            >
                              <Video className="mr-2 h-4 w-4 text-white" />
                              View Test Recording
                            </Button>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </div>
                  <Separator />
                </>
              )}

              {/* Technical Test Details */}
              {selectedApplication.technical_details && (
                <>
                  <div className="space-y-4">
                    <h3 className="text-lg font-bold flex items-center gap-2">
                      <Code2 className="h-5 w-5 text-blue-600" />
                      Technical Test Details
                    </h3>
                    <Card className="border-2 border-border/60 bg-card/50">
                      <CardContent className="pt-6">
                        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-4">
                          {selectedApplication.technical_details.codeQualityScore !== undefined && (
                            <div>
                              <p className="text-xs text-foreground/80 font-semibold mb-1">Code Quality</p>
                              <p className={`text-lg font-bold ${getScoreColor(selectedApplication.technical_details.codeQualityScore)}`}>
                                {selectedApplication.technical_details.codeQualityScore}%
                              </p>
                            </div>
                          )}
                          {selectedApplication.technical_details.correctnessScore !== undefined && (
                            <div>
                              <p className="text-xs text-foreground/80 font-semibold mb-1">Correctness</p>
                              <p className={`text-lg font-bold ${getScoreColor(selectedApplication.technical_details.correctnessScore)}`}>
                                {selectedApplication.technical_details.correctnessScore}%
                              </p>
                            </div>
                          )}
                          {selectedApplication.technical_details.approachScore !== undefined && (
                            <div>
                              <p className="text-xs text-foreground/80 font-semibold mb-1">Approach</p>
                              <p className={`text-lg font-bold ${getScoreColor(selectedApplication.technical_details.approachScore)}`}>
                                {selectedApplication.technical_details.approachScore}%
                              </p>
                            </div>
                          )}
                          {selectedApplication.technical_details.communicationScore !== undefined && (
                            <div>
                              <p className="text-xs text-foreground/80 font-semibold mb-1">Communication</p>
                              <p className={`text-lg font-bold ${getScoreColor(selectedApplication.technical_details.communicationScore)}`}>
                                {selectedApplication.technical_details.communicationScore}%
                              </p>
                            </div>
                          )}
                        </div>
                        {selectedApplication.technical_details.taskDescription && (
                          <div className="pt-4 border-t border-border/60 mb-4">
                            <p className="text-sm font-semibold text-foreground mb-2">Task Description</p>
                            <p className="text-sm text-foreground/80 whitespace-pre-wrap">
                              {selectedApplication.technical_details.taskDescription}
                            </p>
                          </div>
                        )}
                        {selectedApplication.technical_details.feedback && (
                          <div className="pt-4 border-t border-border/60 mb-4">
                            <p className="text-sm font-semibold text-foreground mb-2">Feedback</p>
                            <p className="text-sm text-foreground/80 whitespace-pre-wrap">
                              {selectedApplication.technical_details.feedback}
                            </p>
                          </div>
                        )}
                        <div className="flex flex-wrap gap-4 pt-4 border-t border-border/60">
                          {selectedApplication.technical_details.startedAt && (
                            <div>
                              <p className="text-xs text-foreground/80 font-semibold mb-1">Started</p>
                              <p className="text-sm text-foreground">
                                {format(new Date(selectedApplication.technical_details.startedAt), 'PPp')}
                              </p>
                            </div>
                          )}
                          {selectedApplication.technical_details.completedAt && (
                            <div>
                              <p className="text-xs text-foreground/80 font-semibold mb-1">Completed</p>
                              <p className="text-sm text-foreground">
                                {format(new Date(selectedApplication.technical_details.completedAt), 'PPp')}
                              </p>
                            </div>
                          )}
                          {selectedApplication.technical_details.submissionUrl && (
                            <div className="flex-1">
                              <Button
                                size="sm"
                                onClick={() => window.open(selectedApplication.technical_details.submissionUrl, '_blank')}
                                className="mt-2 bg-blue-600 hover:bg-blue-700 text-white border-0"
                              >
                                <ExternalLink className="mr-2 h-4 w-4 text-white" />
                                View Submission
                              </Button>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                  <Separator />
                </>
              )}

              {/* Interview Details */}
              {selectedApplication.interview_details && (
                <>
                  <div className="space-y-4">
                    <h3 className="text-lg font-bold flex items-center gap-2">
                      <Video className="h-5 w-5 text-blue-600" />
                      Final Interview Details
                    </h3>
                    <Card className="border-2 border-border/60 bg-card/50">
                      <CardContent className="pt-6 space-y-4">
                        {selectedApplication.interview_details.date && (
                          <div>
                            <p className="text-sm font-semibold text-foreground mb-1">Interview Date</p>
                            <p className="text-sm text-foreground/80">
                              {format(new Date(selectedApplication.interview_details.date), 'PPp')}
                            </p>
                          </div>
                        )}
                        {selectedApplication.interview_details.duration && (
                          <div>
                            <p className="text-sm font-semibold text-foreground mb-1">Duration</p>
                            <p className="text-sm text-foreground/80">
                              {selectedApplication.interview_details.duration} minutes
                            </p>
                          </div>
                        )}
                        {selectedApplication.interview_details.status && (
                          <div>
                            <p className="text-sm font-semibold text-foreground mb-1">Status</p>
                            <div className="inline-block">
                              {getStatusBadge(selectedApplication.interview_details.status, selectedApplication.interview_details.status)}
                            </div>
                          </div>
                        )}
                        {selectedApplication.interview_details.result && (
                          <div>
                            <p className="text-sm font-semibold text-foreground mb-1">Result</p>
                            <p className="text-sm text-foreground/80">
                              {selectedApplication.interview_details.result}
                            </p>
                          </div>
                        )}
                        {selectedApplication.interview_details.feedback && (
                          <div className="pt-4 border-t border-border/60">
                            <p className="text-sm font-semibold text-foreground mb-2">Interview Feedback</p>
                            <p className="text-sm text-foreground/80 whitespace-pre-wrap">
                              {selectedApplication.interview_details.feedback}
                            </p>
                          </div>
                        )}
                        {selectedApplication.interview_details.hireRecommendation && (
                          <div className="pt-4 border-t border-border/60">
                            <p className="text-sm font-semibold text-foreground mb-1">Hire Recommendation</p>
                            <p className="text-sm font-bold text-blue-600">
                              {selectedApplication.interview_details.hireRecommendation}
                            </p>
                            {selectedApplication.interview_details.hireConfidence && (
                              <p className="text-xs text-foreground/80 mt-1">
                                Confidence: {selectedApplication.interview_details.hireConfidence}%
                              </p>
                            )}
                          </div>
                        )}
                        {selectedApplication.interview_details.transcript && (
                          <div className="pt-4 border-t border-border/60">
                            <p className="text-sm font-semibold text-foreground mb-2">Interview Transcript</p>
                            <div className="max-h-60 overflow-y-auto p-3 bg-background/50 rounded-lg border border-border/60">
                              <p className="text-xs text-foreground/80 whitespace-pre-wrap font-mono">
                                {selectedApplication.interview_details.transcript}
                              </p>
                            </div>
                          </div>
                        )}
                        <div className="flex flex-wrap gap-2 pt-4 border-t border-border/60">
                          {selectedApplication.interview_details.screenRecordingUrl && (
                            <Button
                              size="sm"
                              onClick={() => window.open(selectedApplication.interview_details.screenRecordingUrl, '_blank')}
                              className="bg-blue-600 hover:bg-blue-700 text-white border-0"
                            >
                              <Video className="mr-2 h-4 w-4 text-white" />
                              View Screen Recording
                            </Button>
                          )}
                          {selectedApplication.interview_details.recordingUrl && (
                            <Button
                              size="sm"
                              onClick={() => window.open(selectedApplication.interview_details.recordingUrl, '_blank')}
                              className="bg-blue-600 hover:bg-blue-700 text-white border-0"
                            >
                              <Video className="mr-2 h-4 w-4 text-white" />
                              View Interview Recording
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                  <Separator />
                </>
              )}

              {/* Application Timeline */}
              <div className="space-y-4">
                <h3 className="text-lg font-bold flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-blue-600" />
                  Timeline
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center gap-3 p-3 rounded-lg border-2 border-border/60 bg-card/50">
                    <Calendar className="h-4 w-4 text-blue-600" />
                    <div>
                      <p className="text-sm font-semibold text-foreground">Applied</p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(selectedApplication.applied_at || selectedApplication.created_at), 'PPp')}
                      </p>
                    </div>
                  </div>
                  {selectedApplication.mcq_details?.takenAt && (
                    <div className="flex items-center gap-3 p-3 rounded-lg border-2 border-border/60 bg-card/50">
                      <FileText className="h-4 w-4 text-blue-600" />
                      <div>
                        <p className="text-sm font-semibold text-foreground">MCQ Test Completed</p>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(selectedApplication.mcq_details.takenAt), 'PPp')}
                        </p>
                      </div>
                    </div>
                  )}
                  {selectedApplication.technical_details?.completedAt && (
                    <div className="flex items-center gap-3 p-3 rounded-lg border-2 border-border/60 bg-card/50">
                      <Code2 className="h-4 w-4 text-blue-600" />
                      <div>
                        <p className="text-sm font-semibold text-foreground">Technical Test Completed</p>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(selectedApplication.technical_details.completedAt), 'PPp')}
                        </p>
                      </div>
                    </div>
                  )}
                  {selectedApplication.interview_details?.date && (
                    <div className="flex items-center gap-3 p-3 rounded-lg border-2 border-border/60 bg-card/50">
                      <Video className="h-4 w-4 text-blue-600" />
                      <div>
                        <p className="text-sm font-semibold text-foreground">Final Interview</p>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(selectedApplication.interview_details.date), 'PPp')}
                        </p>
                      </div>
                    </div>
                  )}
                  {selectedApplication.updated_at && (
                    <div className="flex items-center gap-3 p-3 rounded-lg border-2 border-border/60 bg-card/50">
                      <Clock className="h-4 w-4 text-blue-600" />
                      <div>
                        <p className="text-sm font-semibold text-foreground">Last Updated</p>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(selectedApplication.updated_at), 'PPp')}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ApplicantDashboard;
