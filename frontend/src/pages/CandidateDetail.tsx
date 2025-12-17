import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { candidatesApi } from "@/services/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import {
    ArrowLeft,
    Mail,
    Phone,
    MapPin,
    Briefcase,
    Star,
    Download,
    FileText,
    Linkedin,
    Github,
    Globe,
    Award,
    TrendingUp,
    User,
    Code,
    Building,
    Loader2,
} from "lucide-react";
import { format } from "date-fns";
import DashboardLayout from "@/components/DashboardLayout";

interface Candidate {
    id: string;
    first_name?: string | null;
    last_name?: string | null;
    full_name?: string | null;
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
    education?: any;
    linkedin_url?: string | null;
    github_url?: string | null;
    portfolio_url?: string | null;
    website_url?: string | null;
    cv_file_url?: string | null;
    cv_file_name?: string | null;
    status?: string | null;
    interview_status?: string | null;
    ats_score?: number | null;
    ats_breakdown?: any;
    ats_recommendation?: string | null;
    source?: string | null;
    Work_Experience?: string | null;
    Projects?: string | null;
    ats_Weekness?: string | null;
    ats_strength?: string | null;
    matching_summary?: string | null;
    Stage?: string | null;
    created_at?: string | null;
    updated_at?: string | null;
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

const CandidateDetail = () => {
    const { candidateId } = useParams<{ candidateId: string }>();
    const navigate = useNavigate();
    const { toast } = useToast();
    const [candidate, setCandidate] = useState<Candidate | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (candidateId) {
            fetchCandidate();
        }
    }, [candidateId]);

    const fetchCandidate = async () => {
        try {
            setLoading(true);
            const { candidate: data } = await candidatesApi.getById(candidateId!);
            setCandidate(data);
        } catch (error: any) {
            console.error("Error fetching candidate:", error);
            toast({
                title: "Error",
                description: error.message || "Failed to load candidate details",
                variant: "destructive",
            });
            navigate("/candidates");
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <DashboardLayout>
                <div className="flex items-center justify-center min-h-screen">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
            </DashboardLayout>
        );
    }

    if (!candidate) {
        return (
            <DashboardLayout>
                <div className="container mx-auto px-4 py-8">
                    <Card>
                        <CardContent className="pt-6">
                            <p className="text-center text-muted-foreground">Candidate not found</p>
                            <Button onClick={() => navigate("/candidates")} className="mt-4">
                                Back to Candidates
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            </DashboardLayout>
        );
    }

    const name = candidate.full_name || 
                 (candidate.first_name && candidate.last_name 
                   ? `${candidate.first_name} ${candidate.last_name}` 
                   : candidate.first_name || candidate.last_name || candidate.email);

    const getInitials = (name: string) => {
        return name
            .split(" ")
            .map((n) => n[0])
            .join("")
            .toUpperCase()
            .slice(0, 2);
    };

    const getScore = () => {
        if (candidate.ats_score != null) return Number(candidate.ats_score);
        return null;
    };

    const locationString = [candidate.city, candidate.state, candidate.country]
        .filter(Boolean)
        .join(', ') || candidate.location || 'Not specified';

    return (
        <DashboardLayout>
            <div className="container mx-auto px-4 py-8">
                <Button
                    variant="ghost"
                    onClick={() => navigate("/candidates")}
                    className="mb-4"
                >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back to Candidates
                </Button>

                <Card>
                    <CardHeader>
                        <div className="flex items-center gap-4">
                            <Avatar className="h-20 w-20">
                                <AvatarFallback className="bg-gradient-to-br from-primary to-accent text-primary-foreground text-2xl">
                                    {getInitials(name)}
                                </AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                                <CardTitle className="text-3xl">{name}</CardTitle>
                                <p className="text-muted-foreground mt-1">{candidate.email}</p>
                            </div>
                            <div className="flex flex-col gap-2">
                                {candidate.Stage && (
                                    <Badge variant="outline" className="text-sm">{candidate.Stage}</Badge>
                                )}
                                {getScore() !== null && (
                                    <Badge variant="secondary" className="gap-1 text-sm">
                                        <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                                        {getScore()}% Match
                                    </Badge>
                                )}
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-6">
                            {/* Contact Information */}
                            <div>
                                <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                                    <User className="h-5 w-5" />
                                    Contact Information
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="flex items-center gap-2 text-sm">
                                        <Mail className="h-4 w-4 text-muted-foreground" />
                                        <a href={`mailto:${candidate.email}`} className="hover:text-primary">
                                            {candidate.email}
                                        </a>
                                    </div>
                                    {candidate.phone && (
                                        <div className="flex items-center gap-2 text-sm">
                                            <Phone className="h-4 w-4 text-muted-foreground" />
                                            {candidate.phone}
                                        </div>
                                    )}
                                    <div className="flex items-center gap-2 text-sm">
                                        <MapPin className="h-4 w-4 text-muted-foreground" />
                                        {locationString}
                                    </div>
                                    {candidate.jobs?.title && (
                                        <div className="flex items-center gap-2 text-sm">
                                            <Briefcase className="h-4 w-4 text-muted-foreground" />
                                            {candidate.jobs.title}
                                        </div>
                                    )}
                                </div>
                            </div>

                            <Separator />

                            {/* Professional Links */}
                            {(candidate.linkedin_url || candidate.github_url || candidate.portfolio_url || candidate.website_url) && (
                                <div>
                                    <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                                        <Globe className="h-5 w-5" />
                                        Professional Links
                                    </h3>
                                    <div className="flex flex-wrap gap-2">
                                        {candidate.linkedin_url && (
                                            <Button variant="outline" size="sm" asChild>
                                                <a href={candidate.linkedin_url} target="_blank" rel="noopener noreferrer">
                                                    <Linkedin className="h-4 w-4 mr-2" />
                                                    LinkedIn
                                                </a>
                                            </Button>
                                        )}
                                        {candidate.github_url && (
                                            <Button variant="outline" size="sm" asChild>
                                                <a href={candidate.github_url} target="_blank" rel="noopener noreferrer">
                                                    <Github className="h-4 w-4 mr-2" />
                                                    GitHub
                                                </a>
                                            </Button>
                                        )}
                                        {candidate.portfolio_url && (
                                            <Button variant="outline" size="sm" asChild>
                                                <a href={candidate.portfolio_url} target="_blank" rel="noopener noreferrer">
                                                    <Globe className="h-4 w-4 mr-2" />
                                                    Portfolio
                                                </a>
                                            </Button>
                                        )}
                                        {candidate.website_url && (
                                            <Button variant="outline" size="sm" asChild>
                                                <a href={candidate.website_url} target="_blank" rel="noopener noreferrer">
                                                    <Globe className="h-4 w-4 mr-2" />
                                                    Website
                                                </a>
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Skills & Experience */}
                            <div>
                                <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                                    <Code className="h-5 w-5" />
                                    Skills & Experience
                                </h3>
                                <div className="space-y-3">
                                    {candidate.skills && candidate.skills.length > 0 && (
                                        <div>
                                            <p className="text-sm font-medium mb-2">Skills</p>
                                            <div className="flex flex-wrap gap-2">
                                                {candidate.skills.map((skill, idx) => (
                                                    <Badge key={idx} variant="outline">{skill}</Badge>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                    {(candidate.experience_years !== null || candidate.total_experience_months !== null) && (
                                        <div>
                                            <p className="text-sm font-medium mb-1">Experience</p>
                                            <p className="text-sm text-muted-foreground">
                                                {candidate.experience_years !== null && `${candidate.experience_years} ${candidate.experience_years === 1 ? 'year' : 'years'}`}
                                                {candidate.total_experience_months !== null && candidate.total_experience_months > 0 && 
                                                    ` ${candidate.total_experience_months} ${candidate.total_experience_months === 1 ? 'month' : 'months'}`
                                                }
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Summary */}
                            {candidate.summary && (
                                <>
                                    <Separator />
                                    <div>
                                        <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                                            <FileText className="h-5 w-5" />
                                            Summary
                                        </h3>
                                        <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                                            {candidate.summary}
                                        </p>
                                    </div>
                                </>
                            )}

                            {/* Work Experience */}
                            {candidate.Work_Experience && (
                                <>
                                    <Separator />
                                    <div>
                                        <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                                            <Building className="h-5 w-5" />
                                            Work Experience
                                        </h3>
                                        <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                                            {candidate.Work_Experience}
                                        </p>
                                    </div>
                                </>
                            )}

                            {/* Projects */}
                            {candidate.Projects && (
                                <>
                                    <Separator />
                                    <div>
                                        <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                                            <Award className="h-5 w-5" />
                                            Projects
                                        </h3>
                                        <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                                            {candidate.Projects}
                                        </p>
                                    </div>
                                </>
                            )}

                            {/* ATS Analysis */}
                            {(candidate.ats_strength || candidate.ats_Weekness || candidate.ats_recommendation || candidate.matching_summary) && (
                                <>
                                    <Separator />
                                    <div>
                                        <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                                            <TrendingUp className="h-5 w-5" />
                                            ATS Analysis
                                        </h3>
                                        <div className="space-y-3">
                                            {candidate.ats_strength && (
                                                <div>
                                                    <p className="text-sm font-medium text-green-700 mb-1">Strengths</p>
                                                    <p className="text-sm text-muted-foreground">{candidate.ats_strength}</p>
                                                </div>
                                            )}
                                            {candidate.ats_Weekness && (
                                                <div>
                                                    <p className="text-sm font-medium text-orange-700 mb-1">Areas for Improvement</p>
                                                    <p className="text-sm text-muted-foreground">{candidate.ats_Weekness}</p>
                                                </div>
                                            )}
                                            {candidate.ats_recommendation && (
                                                <div>
                                                    <p className="text-sm font-medium mb-1">Recommendation</p>
                                                    <p className="text-sm text-muted-foreground">{candidate.ats_recommendation}</p>
                                                </div>
                                            )}
                                            {candidate.matching_summary && (
                                                <div>
                                                    <p className="text-sm font-medium mb-1">Matching Summary</p>
                                                    <p className="text-sm text-muted-foreground">{candidate.matching_summary}</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </>
                            )}

                            {/* CV Download */}
                            {candidate.cv_file_url && (
                                <>
                                    <Separator />
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-sm font-medium">Resume</p>
                                            <p className="text-xs text-muted-foreground">
                                                {candidate.cv_file_name || 'CV File'}
                                            </p>
                                        </div>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => window.open(candidate.cv_file_url!, '_blank')}
                                        >
                                            <Download className="h-4 w-4 mr-2" />
                                            View CV
                                        </Button>
                                    </div>
                                </>
                            )}

                            {/* Metadata */}
                            <Separator />
                            <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                    <p className="text-muted-foreground">Applied</p>
                                    <p className="font-medium">
                                        {candidate.created_at ? format(new Date(candidate.created_at), 'PPp') : 'N/A'}
                                    </p>
                                </div>
                                {candidate.updated_at && (
                                    <div>
                                        <p className="text-muted-foreground">Last Updated</p>
                                        <p className="font-medium">
                                            {format(new Date(candidate.updated_at), 'PPp')}
                                        </p>
                                    </div>
                                )}
                                {candidate.source && (
                                    <div>
                                        <p className="text-muted-foreground">Source</p>
                                        <Badge variant="outline">{candidate.source}</Badge>
                                    </div>
                                )}
                                {candidate.status && (
                                    <div>
                                        <p className="text-muted-foreground">Status</p>
                                        <Badge variant="secondary">{candidate.status}</Badge>
                                    </div>
                                )}
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </DashboardLayout>
    );
};

export default CandidateDetail;

