import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    Mail,
    Phone,
    MapPin,
    Briefcase,
    Calendar,
    ExternalLink,
    Download,
    FileText,
    Linkedin,
    Github,
    Globe,
    GraduationCap,
    Building,
    CalendarPlus,
    CheckCircle,
    AlertCircle,
} from "lucide-react";
import { format } from "date-fns";
import ScheduleMeetingDialog from "@/components/ScheduleMeetingDialog";

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

interface CandidateDetailModalProps {
    candidate: Candidate | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export const CandidateDetailModal = ({ candidate, open, onOpenChange }: CandidateDetailModalProps) => {
    const [scheduleMeetingOpen, setScheduleMeetingOpen] = useState(false);
    
    if (!candidate) return null;

    const name = candidate.full_name || 
                 (candidate.first_name && candidate.last_name 
                   ? `${candidate.first_name} ${candidate.last_name}` 
                   : candidate.first_name || candidate.last_name || candidate.email);

    const getScore = () => {
        if (candidate.ats_score != null) return Number(candidate.ats_score);
        return null;
    };

    const locationString = [candidate.city, candidate.state, candidate.country]
        .filter(Boolean)
        .join(', ') || candidate.location || 'Not specified';

    const formatExperience = () => {
        if (candidate.experience_years !== null && candidate.experience_years !== undefined) {
            return `${candidate.experience_years} ${candidate.experience_years === 1 ? 'year' : 'years'}`;
        }
        return 'Not specified';
    };

    const parseJSON = (data: any) => {
        if (!data) return null;
        if (typeof data === 'string') {
            try { return JSON.parse(data); } catch { return data; }
        }
        return data;
    };

    const renderList = (items: any) => {
        const parsed = parseJSON(items);
        if (!parsed) return null;
        if (Array.isArray(parsed)) {
            return (
                <ul className="list-disc list-inside space-y-1 text-sm">
                    {parsed.map((item, idx) => (
                        <li key={idx}>{typeof item === 'object' ? JSON.stringify(item) : item}</li>
                    ))}
                </ul>
            );
        }
        if (typeof parsed === 'string') {
            return <p className="text-sm">{parsed}</p>;
        }
        return null;
    };

    const workExperience = parseJSON(candidate.Work_Experience);
    const education = parseJSON(candidate.education);
    const projects = parseJSON(candidate.Projects);
    const strengths = parseJSON(candidate.ats_strength);
    const weaknesses = parseJSON(candidate.ats_Weekness);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
                <DialogHeader>
                    <div className="flex items-center justify-between gap-4">
                        <div>
                            <DialogTitle className="text-xl">{name}</DialogTitle>
                            <p className="text-sm text-muted-foreground mt-1">{candidate.email}</p>
                        </div>
                        <div className="flex flex-col gap-1 items-end">
                            {candidate.Stage && <Badge variant="outline">{candidate.Stage}</Badge>}
                            {getScore() !== null && (
                                <Badge variant="secondary">{getScore()}% Match</Badge>
                            )}
                        </div>
                    </div>
                </DialogHeader>

                <div className="space-y-6 mt-4">
                    {/* Contact Info */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        <div className="p-3 bg-muted/30 rounded-lg">
                            <p className="text-xs text-muted-foreground flex items-center gap-1"><Mail className="h-3 w-3" />Email</p>
                            <a href={`mailto:${candidate.email}`} className="text-sm hover:underline break-all">{candidate.email}</a>
                        </div>
                        {candidate.phone && (
                            <div className="p-3 bg-muted/30 rounded-lg">
                                <p className="text-xs text-muted-foreground flex items-center gap-1"><Phone className="h-3 w-3" />Phone</p>
                                <p className="text-sm">{candidate.phone}</p>
                            </div>
                        )}
                        <div className="p-3 bg-muted/30 rounded-lg">
                            <p className="text-xs text-muted-foreground flex items-center gap-1"><MapPin className="h-3 w-3" />Location</p>
                            <p className="text-sm">{locationString}</p>
                        </div>
                        {candidate.jobs?.title && (
                            <div className="p-3 bg-muted/30 rounded-lg">
                                <p className="text-xs text-muted-foreground flex items-center gap-1"><Briefcase className="h-3 w-3" />Job</p>
                                <p className="text-sm">{candidate.jobs.title}</p>
                            </div>
                        )}
                    </div>

                    {/* Schedule Meeting Button */}
                    <Button onClick={() => setScheduleMeetingOpen(true)} className="w-full gap-2">
                        <CalendarPlus className="h-4 w-4" />
                        Schedule Meeting
                    </Button>

                    {/* Professional Links */}
                    {(candidate.linkedin_url || candidate.github_url || candidate.portfolio_url || candidate.website_url) && (
                        <div className="flex flex-wrap gap-2">
                            {candidate.linkedin_url && (
                                <Button variant="outline" size="sm" asChild>
                                    <a href={candidate.linkedin_url} target="_blank" rel="noopener noreferrer">
                                        <Linkedin className="h-4 w-4 mr-2" />LinkedIn
                                    </a>
                                </Button>
                            )}
                            {candidate.github_url && (
                                <Button variant="outline" size="sm" asChild>
                                    <a href={candidate.github_url} target="_blank" rel="noopener noreferrer">
                                        <Github className="h-4 w-4 mr-2" />GitHub
                                    </a>
                                </Button>
                            )}
                            {candidate.portfolio_url && (
                                <Button variant="outline" size="sm" asChild>
                                    <a href={candidate.portfolio_url} target="_blank" rel="noopener noreferrer">
                                        <Globe className="h-4 w-4 mr-2" />Portfolio
                                    </a>
                                </Button>
                            )}
                            {candidate.website_url && (
                                <Button variant="outline" size="sm" asChild>
                                    <a href={candidate.website_url} target="_blank" rel="noopener noreferrer">
                                        <ExternalLink className="h-4 w-4 mr-2" />Website
                                    </a>
                                </Button>
                            )}
                        </div>
                    )}

                    {/* Skills & Experience */}
                    {(candidate.skills?.length || candidate.experience_years !== null) && (
                        <div className="space-y-3">
                            <p className="text-sm font-medium">Skills & Experience</p>
                            {candidate.skills && candidate.skills.length > 0 && (
                                <div className="flex flex-wrap gap-2">
                                    {candidate.skills.map((skill, idx) => (
                                        <Badge key={idx} variant="outline">{skill}</Badge>
                                    ))}
                                </div>
                            )}
                            {candidate.experience_years !== null && (
                                <p className="text-sm text-muted-foreground">Experience: {formatExperience()}</p>
                            )}
                        </div>
                    )}

                    {/* Summary */}
                    {candidate.summary && (
                        <div className="space-y-2">
                            <p className="text-sm font-medium">Summary</p>
                            <div className="p-3 bg-muted/30 rounded-lg">
                                <p className="text-sm whitespace-pre-wrap">{candidate.summary}</p>
                            </div>
                        </div>
                    )}

                    {/* Education */}
                    {education && (
                        <div className="space-y-2">
                            <p className="text-sm font-medium flex items-center gap-2">
                                <GraduationCap className="h-4 w-4" />Education
                            </p>
                            <div className="space-y-2">
                                {Array.isArray(education) ? education.map((edu: any, idx: number) => (
                                    <div key={idx} className="p-3 bg-muted/30 rounded-lg">
                                        {edu.degree && <p className="font-medium text-sm">{edu.degree}</p>}
                                        {(edu.institution || edu.school) && (
                                            <p className="text-sm text-muted-foreground">{edu.institution || edu.school}</p>
                                        )}
                                        {(edu.year || edu.graduation_year) && (
                                            <p className="text-xs text-muted-foreground">{edu.year || edu.graduation_year}</p>
                                        )}
                                    </div>
                                )) : (
                                    <div className="p-3 bg-muted/30 rounded-lg">
                                        <p className="text-sm">{typeof education === 'string' ? education : JSON.stringify(education)}</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Work Experience */}
                    {workExperience && (
                        <div className="space-y-2">
                            <p className="text-sm font-medium flex items-center gap-2">
                                <Building className="h-4 w-4" />Work Experience
                            </p>
                            <div className="space-y-2">
                                {Array.isArray(workExperience) ? workExperience.map((exp: any, idx: number) => (
                                    <div key={idx} className="p-3 bg-muted/30 rounded-lg">
                                        {(exp.title || exp['Job Title']) && (
                                            <p className="font-medium text-sm">{exp.title || exp['Job Title']}</p>
                                        )}
                                        {(exp.company || exp['Company']) && (
                                            <p className="text-sm text-muted-foreground">{exp.company || exp['Company']}</p>
                                        )}
                                        {exp.description && (
                                            <p className="text-sm mt-2">{exp.description}</p>
                                        )}
                                    </div>
                                )) : (
                                    <div className="p-3 bg-muted/30 rounded-lg">
                                        <p className="text-sm whitespace-pre-wrap">{typeof workExperience === 'string' ? workExperience : JSON.stringify(workExperience)}</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Projects */}
                    {projects && (
                        <div className="space-y-2">
                            <p className="text-sm font-medium">Projects</p>
                            <div className="space-y-2">
                                {Array.isArray(projects) ? projects.map((proj: any, idx: number) => (
                                    <div key={idx} className="p-3 bg-muted/30 rounded-lg">
                                        {proj.name && <p className="font-medium text-sm">{proj.name}</p>}
                                        {proj.description && <p className="text-sm">{proj.description}</p>}
                                        {proj.technologies && Array.isArray(proj.technologies) && (
                                            <div className="flex flex-wrap gap-1 mt-2">
                                                {proj.technologies.map((tech: string, i: number) => (
                                                    <Badge key={i} variant="outline" className="text-xs">{tech}</Badge>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                )) : (
                                    <div className="p-3 bg-muted/30 rounded-lg">
                                        <p className="text-sm">{typeof projects === 'string' ? projects : JSON.stringify(projects)}</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* ATS Analysis */}
                    {(strengths || weaknesses || candidate.ats_recommendation) && (
                        <div className="space-y-3">
                            <p className="text-sm font-medium">ATS Analysis</p>
                            
                            {strengths && (
                                <div className="p-3 bg-green-50 dark:bg-green-950/20 rounded-lg">
                                    <p className="text-sm font-medium flex items-center gap-2 mb-2">
                                        <CheckCircle className="h-4 w-4 text-green-600" />Strengths
                                    </p>
                                    {renderList(strengths)}
                                </div>
                            )}
                            
                            {weaknesses && (
                                <div className="p-3 bg-amber-50 dark:bg-amber-950/20 rounded-lg">
                                    <p className="text-sm font-medium flex items-center gap-2 mb-2">
                                        <AlertCircle className="h-4 w-4 text-amber-600" />Areas for Improvement
                                    </p>
                                    {renderList(weaknesses)}
                                </div>
                            )}
                            
                            {candidate.ats_recommendation && (
                                <div className="p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
                                    <p className="text-sm font-medium mb-2">Recommendation</p>
                                    <p className="text-sm whitespace-pre-wrap">{candidate.ats_recommendation}</p>
                                </div>
                            )}
                        </div>
                    )}

                    {/* CV Download */}
                    {candidate.cv_file_url && (
                        <Button variant="outline" onClick={() => window.open(candidate.cv_file_url!, '_blank')} className="w-full gap-2">
                            <Download className="h-4 w-4" />
                            View CV / Resume
                        </Button>
                    )}

                    {/* Metadata */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-4 border-t">
                        <div className="p-3 bg-muted/30 rounded-lg">
                            <p className="text-xs text-muted-foreground">Applied</p>
                            <p className="text-sm">{candidate.created_at ? format(new Date(candidate.created_at), 'PP') : 'N/A'}</p>
                        </div>
                        {candidate.source && (
                            <div className="p-3 bg-muted/30 rounded-lg">
                                <p className="text-xs text-muted-foreground">Source</p>
                                <Badge variant="outline" className="mt-1">{candidate.source}</Badge>
                            </div>
                        )}
                        {candidate.status && (
                            <div className="p-3 bg-muted/30 rounded-lg">
                                <p className="text-xs text-muted-foreground">Status</p>
                                <Badge variant="secondary" className="mt-1">{candidate.status}</Badge>
                            </div>
                        )}
                        {candidate.interview_status && (
                            <div className="p-3 bg-muted/30 rounded-lg">
                                <p className="text-xs text-muted-foreground">Interview</p>
                                <Badge 
                                    variant={candidate.interview_status.toLowerCase() === 'failed' ? 'destructive' : 'secondary'} 
                                    className="mt-1"
                                >
                                    {candidate.interview_status}
                                </Badge>
                            </div>
                        )}
                    </div>
                </div>
            </DialogContent>
            
            <ScheduleMeetingDialog
                candidate={{
                    id: candidate.id,
                    name: name,
                    email: candidate.email,
                    phone: candidate.phone || undefined,
                    cv_file_url: candidate.cv_file_url || undefined,
                    ai_score: getScore() || undefined,
                    job_id: candidate.jobs?.id || undefined,
                    source: candidate.source || 'candidates',
                }}
                open={scheduleMeetingOpen}
                onOpenChange={setScheduleMeetingOpen}
                onSuccess={() => {}}
            />
        </Dialog>
    );
};
