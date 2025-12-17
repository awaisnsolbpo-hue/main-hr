import React, { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
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
    Award,
    TrendingUp,
    User,
    GraduationCap,
    Code,
    Building,
    CalendarPlus,
} from "lucide-react";
import { format } from "date-fns";
import { formatFileSize, formatPercentage } from "@/lib/numberFormat";
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

    // Format experience properly
    const formatExperience = () => {
        const parts: string[] = [];
        if (candidate.experience_years !== null && candidate.experience_years !== undefined) {
            parts.push(`${candidate.experience_years} ${candidate.experience_years === 1 ? 'year' : 'years'}`);
        }
        if (candidate.total_experience_months !== null && candidate.total_experience_months !== undefined && candidate.total_experience_months > 0) {
            // Calculate remaining months after years
            const years = candidate.experience_years || 0;
            const totalMonths = candidate.total_experience_months;
            const remainingMonths = totalMonths - (years * 12);
            if (remainingMonths > 0) {
                parts.push(`${remainingMonths} ${remainingMonths === 1 ? 'month' : 'months'}`);
            }
        }
        return parts.length > 0 ? parts.join(' and ') : 'Not specified';
    };

    // Format JSON data into readable format
    const formatJSONData = (data: any): string => {
        if (!data) return '';
        
        // If it's already a string, try to parse it
        if (typeof data === 'string') {
            try {
                data = JSON.parse(data);
            } catch {
                // If it's not valid JSON, return as is
                return data;
            }
        }

        // If it's an array
        if (Array.isArray(data)) {
            return data.map((item, idx) => {
                if (typeof item === 'object' && item !== null) {
                    return `${idx + 1}. ${formatObject(item)}`;
                }
                return `• ${item}`;
            }).join('\n\n');
        }

        // If it's an object
        if (typeof data === 'object' && data !== null) {
            return formatObject(data);
        }

        return String(data);
    };

    const formatObject = (obj: any, indent = 0): string => {
        const indentStr = '  '.repeat(indent);
        const lines: string[] = [];

        for (const [key, value] of Object.entries(obj)) {
            const formattedKey = key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
            
            if (value === null || value === undefined) {
                continue;
            } else if (Array.isArray(value)) {
                if (value.length === 0) continue;
                lines.push(`${indentStr}${formattedKey}:`);
                value.forEach((item, idx) => {
                    if (typeof item === 'object' && item !== null) {
                        lines.push(`${indentStr}  ${idx + 1}. ${formatObject(item, indent + 2)}`);
                    } else {
                        lines.push(`${indentStr}  • ${item}`);
                    }
                });
            } else if (typeof value === 'object') {
                lines.push(`${indentStr}${formattedKey}:`);
                lines.push(formatObject(value, indent + 1));
            } else {
                lines.push(`${indentStr}${formattedKey}: ${value}`);
            }
        }

        return lines.join('\n');
    };

    // Format matching summary
    const formatMatchingSummary = (summary: any): React.ReactNode => {
        if (!summary) return null;

        let parsed: any;
        if (typeof summary === 'string') {
            try {
                parsed = JSON.parse(summary);
            } catch {
                return <p className="text-sm font-medium text-foreground whitespace-pre-wrap break-words leading-relaxed">{summary}</p>;
            }
        } else {
            parsed = summary;
        }

        if (typeof parsed === 'object' && parsed !== null) {
            return (
                <div className="space-y-3">
                    {Object.entries(parsed).map(([key, value]: [string, any]) => {
                        const formattedKey = key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
                        return (
                            <div key={key} className="space-y-2">
                                <h4 className="text-sm font-bold text-foreground">{formattedKey}</h4>
                                {Array.isArray(value) ? (
                                    <ul className="list-disc list-inside space-y-1 ml-2">
                                        {value.map((item: any, idx: number) => (
                                            <li key={idx} className="text-sm font-medium text-foreground/80">
                                                {typeof item === 'object' ? JSON.stringify(item) : String(item)}
                                            </li>
                                        ))}
                                    </ul>
                                ) : typeof value === 'object' ? (
                                    <div className="ml-2 space-y-1">
                                        {Object.entries(value).map(([k, v]: [string, any]) => (
                                            <p key={k} className="text-sm font-medium text-foreground/80">
                                                <span className="font-semibold">{k}:</span> {Array.isArray(v) ? v.join(', ') : String(v)}
                                            </p>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-sm font-medium text-foreground/80 ml-2">{String(value)}</p>
                                )}
                            </div>
                        );
                    })}
                </div>
            );
        }

        return <p className="text-sm font-medium text-foreground whitespace-pre-wrap break-words leading-relaxed">{String(summary)}</p>;
    };

    // Format Work Experience (could be JSON array or text)
    const formatWorkExperience = (workExp: any): React.ReactNode => {
        if (!workExp) return null;

        let parsed: any;
        if (typeof workExp === 'string') {
            try {
                parsed = JSON.parse(workExp);
            } catch {
                // If it's not JSON, treat as plain text with bullet points
                const lines = workExp.split('\n').filter((line: string) => line.trim());
                return (
                    <div className="space-y-3">
                        {lines.map((line: string, idx: number) => (
                            <div key={idx} className="flex items-start gap-3 p-3 rounded-lg border-l-4 border-l-primary bg-card/50">
                                <span className="text-primary mt-1.5 flex-shrink-0">•</span>
                                <p className="text-sm font-medium text-foreground leading-relaxed flex-1">{line.trim()}</p>
                            </div>
                        ))}
                    </div>
                );
            }
        } else {
            parsed = workExp;
        }

        if (Array.isArray(parsed) && parsed.length > 0) {
            return (
                <div className="space-y-4">
                    {parsed.map((exp: any, idx: number) => (
                        <div key={idx} className="group relative overflow-hidden rounded-xl border-2 border-border/60 bg-gradient-to-br from-card to-card/50 p-5 shadow-sm hover:shadow-md transition-all duration-300">
                            <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-primary via-primary/80 to-accent"></div>
                            {typeof exp === 'object' && exp !== null ? (
                                <div className="space-y-3 pl-4">
                                    {/* Job Title */}
                                    {(exp.title || exp['Job Title'] || exp.job_title) && (
                                        <div>
                                            <h4 className="font-bold text-lg text-foreground mb-1">
                                                {exp.title || exp['Job Title'] || exp.job_title}
                                            </h4>
                                        </div>
                                    )}
                                    
                                    {/* Company and Location */}
                                    <div className="flex flex-wrap items-center gap-3 text-sm">
                                        {(exp.company || exp['Company'] || exp.company_name) && (
                                            <div className="flex items-center gap-1.5">
                                                <Building className="h-4 w-4 text-muted-foreground" />
                                                <span className="font-semibold text-foreground/90">
                                                    {exp.company || exp['Company'] || exp.company_name}
                                                </span>
                                            </div>
                                        )}
                                        {(exp.location || exp['Location'] || exp.city) && (
                                            <div className="flex items-center gap-1.5">
                                                <MapPin className="h-4 w-4 text-muted-foreground" />
                                                <span className="text-foreground/70">
                                                    {exp.location || exp['Location'] || exp.city}
                                                </span>
                                            </div>
                                        )}
                                    </div>

                                    {/* Date Range */}
                                    {(exp.start_date || exp['Start Date'] || exp.startDate || exp.end_date || exp['End Date'] || exp.endDate || exp.duration || exp['Duration Months']) && (
                                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                            <Calendar className="h-3.5 w-3.5" />
                                            <span>
                                                {(() => {
                                                    const startDate = exp.start_date || exp['Start Date'] || exp.startDate;
                                                    const endDate = exp.end_date || exp['End Date'] || exp.endDate;
                                                    const duration = exp.duration || exp['Duration Months'] || exp.duration_months;
                                                    
                                                    if (startDate && endDate) {
                                                        return `${startDate} - ${endDate}`;
                                                    } else if (startDate) {
                                                        return `${startDate} - Present`;
                                                    } else if (duration) {
                                                        return `${duration} months`;
                                                    }
                                                    return startDate || endDate || duration;
                                                })()}
                                            </span>
                                        </div>
                                    )}

                                    {/* Description */}
                                    {(exp.description || exp['Description'] || exp.summary) && (
                                        <div className="pt-2 border-t border-border/40">
                                            <p className="text-sm font-medium text-foreground/80 leading-relaxed">
                                                {exp.description || exp['Description'] || exp.summary}
                                            </p>
                                        </div>
                                    )}

                                    {/* Responsibilities */}
                                    {(exp.responsibilities || exp['Responsibilities']) && Array.isArray(exp.responsibilities || exp['Responsibilities']) && (
                                        <div className="pt-2 border-t border-border/40">
                                            <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wide">Key Responsibilities</p>
                                            <ul className="list-none space-y-1.5">
                                                {(exp.responsibilities || exp['Responsibilities']).map((resp: string, respIdx: number) => (
                                                    <li key={respIdx} className="flex items-start gap-2 text-sm text-foreground/80">
                                                        <span className="text-primary mt-1.5 flex-shrink-0">▸</span>
                                                        <span className="leading-relaxed">{resp}</span>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}

                                    {/* Technologies/Skills */}
                                    {(exp.technologies || exp['Technologies'] || exp.skills) && Array.isArray(exp.technologies || exp['Technologies'] || exp.skills) && (
                                        <div className="pt-2 border-t border-border/40">
                                            <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wide">Technologies</p>
                                            <div className="flex flex-wrap gap-2">
                                                {(exp.technologies || exp['Technologies'] || exp.skills).map((tech: string, techIdx: number) => (
                                                    <Badge key={techIdx} variant="outline" className="text-xs font-medium">
                                                        {tech}
                                                    </Badge>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="flex items-start gap-3 pl-4">
                                    <span className="text-primary mt-1.5 flex-shrink-0">•</span>
                                    <p className="text-sm font-medium text-foreground leading-relaxed flex-1">{String(exp)}</p>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            );
        }

        // If it's an object but not an array - handle single work experience object
        if (typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed)) {
            // Check if it's a single experience object with common fields
            const hasExperienceFields = parsed.title || parsed['Job Title'] || parsed.job_title || 
                                      parsed.company || parsed['Company'] || parsed.company_name;
            
            if (hasExperienceFields) {
                // Treat as single experience object
                return (
                    <div className="group relative overflow-hidden rounded-xl border-2 border-border/60 bg-gradient-to-br from-card to-card/50 p-5 shadow-sm hover:shadow-md transition-all duration-300">
                        <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-primary via-primary/80 to-accent"></div>
                        <div className="space-y-3 pl-4">
                            {/* Job Title */}
                            {(parsed.title || parsed['Job Title'] || parsed.job_title) && (
                                <h4 className="font-bold text-lg text-foreground">
                                    {parsed.title || parsed['Job Title'] || parsed.job_title}
                                </h4>
                            )}
                            
                            {/* Company and Location */}
                            <div className="flex flex-wrap items-center gap-3 text-sm">
                                {(parsed.company || parsed['Company'] || parsed.company_name) && (
                                    <div className="flex items-center gap-1.5">
                                        <Building className="h-4 w-4 text-muted-foreground" />
                                        <span className="font-semibold text-foreground/90">
                                            {parsed.company || parsed['Company'] || parsed.company_name}
                                        </span>
                                    </div>
                                )}
                                {(parsed.location || parsed['Location'] || parsed.city) && (
                                    <div className="flex items-center gap-1.5">
                                        <MapPin className="h-4 w-4 text-muted-foreground" />
                                        <span className="text-foreground/70">
                                            {parsed.location || parsed['Location'] || parsed.city}
                                        </span>
                                    </div>
                                )}
                            </div>

                            {/* Date Range */}
                            {(parsed.start_date || parsed['Start Date'] || parsed.startDate || parsed.end_date || parsed['End Date'] || parsed.endDate || parsed.duration || parsed['Duration Months']) && (
                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                    <Calendar className="h-3.5 w-3.5" />
                                    <span>
                                        {(() => {
                                            const startDate = parsed.start_date || parsed['Start Date'] || parsed.startDate;
                                            const endDate = parsed.end_date || parsed['End Date'] || parsed.endDate;
                                            const duration = parsed.duration || parsed['Duration Months'] || parsed.duration_months;
                                            
                                            if (startDate && endDate) {
                                                return `${startDate} - ${endDate}`;
                                            } else if (startDate) {
                                                return `${startDate} - Present`;
                                            } else if (duration) {
                                                return `${duration} months`;
                                            }
                                            return startDate || endDate || duration;
                                        })()}
                                    </span>
                                </div>
                            )}

                            {/* Description */}
                            {(parsed.description || parsed['Description'] || parsed.summary) && (
                                <div className="pt-2 border-t border-border/40">
                                    <p className="text-sm font-medium text-foreground/80 leading-relaxed">
                                        {parsed.description || parsed['Description'] || parsed.summary}
                                    </p>
                                </div>
                            )}

                            {/* Responsibilities */}
                            {(parsed.responsibilities || parsed['Responsibilities']) && Array.isArray(parsed.responsibilities || parsed['Responsibilities']) && (
                                <div className="pt-2 border-t border-border/40">
                                    <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wide">Key Responsibilities</p>
                                    <ul className="list-none space-y-1.5">
                                        {(parsed.responsibilities || parsed['Responsibilities']).map((resp: string, respIdx: number) => (
                                            <li key={respIdx} className="flex items-start gap-2 text-sm text-foreground/80">
                                                <span className="text-primary mt-1.5 flex-shrink-0">▸</span>
                                                <span className="leading-relaxed">{resp}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            {/* Technologies */}
                            {(parsed.technologies || parsed['Technologies'] || parsed.skills) && Array.isArray(parsed.technologies || parsed['Technologies'] || parsed.skills) && (
                                <div className="pt-2 border-t border-border/40">
                                    <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wide">Technologies</p>
                                    <div className="flex flex-wrap gap-2">
                                        {(parsed.technologies || parsed['Technologies'] || parsed.skills).map((tech: string, techIdx: number) => (
                                            <Badge key={techIdx} variant="outline" className="text-xs font-medium">
                                                {tech}
                                            </Badge>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                );
            }

            // Otherwise, display as key-value pairs
            return (
                <div className="space-y-3">
                    {Object.entries(parsed).map(([key, value]: [string, any]) => {
                        // Skip null/undefined values
                        if (value === null || value === undefined || value === 'null') return null;
                        
                        return (
                            <div key={key} className="p-4 rounded-lg border-l-4 border-l-primary bg-card/50">
                                <h4 className="font-bold text-sm text-foreground mb-2 capitalize">{key.replace(/_/g, ' ')}</h4>
                                {Array.isArray(value) ? (
                                    <ul className="list-disc list-inside space-y-1 ml-2">
                                        {value.map((item: any, idx: number) => (
                                            <li key={idx} className="text-sm font-medium text-foreground/80">{String(item)}</li>
                                        ))}
                                    </ul>
                                ) : (
                                    <p className="text-sm font-medium text-foreground/80">{String(value)}</p>
                                )}
                            </div>
                        );
                    })}
                </div>
            );
        }

        return (
            <div className="p-4 rounded-lg border-l-4 border-l-primary bg-card/50">
                <p className="text-sm font-medium text-foreground whitespace-pre-wrap break-words leading-relaxed">
                    {String(workExp)}
                </p>
            </div>
        );
    };

    // Format Projects (could be JSON array)
    const formatProjects = (projects: any): React.ReactNode => {
        if (!projects) return null;

        let parsed: any;
        if (typeof projects === 'string') {
            try {
                parsed = JSON.parse(projects);
            } catch {
                return <p className="text-sm font-medium text-foreground whitespace-pre-wrap break-words leading-relaxed">{projects}</p>;
            }
        } else {
            parsed = projects;
        }

        if (Array.isArray(parsed) && parsed.length > 0) {
            return (
                <div className="space-y-4">
                    {parsed.map((project: any, idx: number) => (
                        <div key={idx} className="p-4 rounded-lg border-l-4 border-l-accent bg-card/50">
                            {typeof project === 'object' && project !== null ? (
                                <div className="space-y-2">
                                    {project.name && (
                                        <h4 className="font-bold text-base text-foreground">{project.name}</h4>
                                    )}
                                    {project.description && (
                                        <p className="text-sm font-medium text-foreground/80 leading-relaxed">{project.description}</p>
                                    )}
                                    {project.technologies && Array.isArray(project.technologies) && (
                                        <div className="flex flex-wrap gap-2 mt-2">
                                            {project.technologies.map((tech: string, techIdx: number) => (
                                                <Badge key={techIdx} variant="outline" className="text-xs">{tech}</Badge>
                                            ))}
                                        </div>
                                    )}
                                    {project.url && (
                                        <a href={project.url} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline flex items-center gap-1 mt-2">
                                            <ExternalLink className="h-3 w-3" />
                                            View Project
                                        </a>
                                    )}
                                </div>
                            ) : (
                                <p className="text-sm font-medium text-foreground">{String(project)}</p>
                            )}
                        </div>
                    ))}
                </div>
            );
        }

        return <p className="text-sm font-medium text-foreground whitespace-pre-wrap break-words leading-relaxed">{String(projects)}</p>;
    };

    // Format Education (could be JSON array or text)
    const formatEducation = (education: any): React.ReactNode => {
        if (!education) return null;

        let parsed: any;
        if (typeof education === 'string') {
            try {
                parsed = JSON.parse(education);
            } catch {
                // If it's not JSON, treat as plain text with bullet points
                const lines = education.split('\n').filter((line: string) => line.trim());
                return (
                    <div className="space-y-3">
                        {lines.map((line: string, idx: number) => (
                            <div key={idx} className="group relative overflow-hidden rounded-xl border-2 border-border/60 bg-gradient-to-br from-card to-card/50 p-4 shadow-sm hover:shadow-md transition-all duration-300">
                                <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-blue-500 via-blue-400 to-indigo-500"></div>
                                <div className="flex items-start gap-3 pl-4">
                                    <GraduationCap className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                                    <p className="text-sm font-medium text-foreground leading-relaxed flex-1">{line.trim()}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                );
            }
        } else {
            parsed = education;
        }

        if (Array.isArray(parsed) && parsed.length > 0) {
            return (
                <div className="space-y-4">
                    {parsed.map((edu: any, idx: number) => (
                        <div key={idx} className="group relative overflow-hidden rounded-xl border-2 border-border/60 bg-gradient-to-br from-card to-card/50 p-5 shadow-sm hover:shadow-md transition-all duration-300">
                            <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-blue-500 via-blue-400 to-indigo-500"></div>
                            {typeof edu === 'object' && edu !== null ? (
                                <div className="space-y-3 pl-4">
                                    {/* Degree */}
                                    {(edu.degree || edu['Degree'] || edu.degree_name || edu.title) && (
                                        <h4 className="font-bold text-lg text-foreground">
                                            {edu.degree || edu['Degree'] || edu.degree_name || edu.title}
                                        </h4>
                                    )}
                                    
                                    {/* Institution */}
                                    {(edu.institution || edu['Institution'] || edu.school || edu.university || edu.college) && (
                                        <div className="flex items-center gap-2 text-sm">
                                            <Building className="h-4 w-4 text-muted-foreground" />
                                            <span className="font-semibold text-foreground/90">
                                                {edu.institution || edu['Institution'] || edu.school || edu.university || edu.college}
                                            </span>
                                        </div>
                                    )}

                                    {/* Date Range */}
                                    {(edu.start_date || edu['Start Date'] || edu.startDate || edu.end_date || edu['End Date'] || edu.endDate || edu.year || edu['Year'] || edu.graduation_year) && (
                                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                            <Calendar className="h-3.5 w-3.5" />
                                            <span>
                                                {(() => {
                                                    const startDate = edu.start_date || edu['Start Date'] || edu.startDate;
                                                    const endDate = edu.end_date || edu['End Date'] || edu.endDate;
                                                    const year = edu.year || edu['Year'] || edu.graduation_year;
                                                    
                                                    if (startDate && endDate) {
                                                        return `${startDate} - ${endDate}`;
                                                    } else if (year) {
                                                        return year;
                                                    } else if (startDate) {
                                                        return `${startDate} - Present`;
                                                    }
                                                    return startDate || endDate || year;
                                                })()}
                                            </span>
                                        </div>
                                    )}

                                    {/* Field of Study */}
                                    {(edu.field || edu['Field'] || edu.field_of_study || edu.major || edu.specialization) && (
                                        <div className="pt-2 border-t border-border/40">
                                            <p className="text-xs font-semibold text-muted-foreground mb-1 uppercase tracking-wide">Field of Study</p>
                                            <p className="text-sm font-medium text-foreground/80">
                                                {edu.field || edu['Field'] || edu.field_of_study || edu.major || edu.specialization}
                                            </p>
                                        </div>
                                    )}

                                    {/* GPA */}
                                    {(edu.gpa || edu['GPA'] || edu.grade) && (
                                        <div className="pt-2 border-t border-border/40">
                                            <p className="text-xs font-semibold text-muted-foreground mb-1 uppercase tracking-wide">Grade</p>
                                            <p className="text-sm font-medium text-foreground/80">
                                                {edu.gpa || edu['GPA'] || edu.grade}
                                            </p>
                                        </div>
                                    )}

                                    {/* Description */}
                                    {(edu.description || edu['Description'] || edu.notes) && (
                                        <div className="pt-2 border-t border-border/40">
                                            <p className="text-sm font-medium text-foreground/80 leading-relaxed">
                                                {edu.description || edu['Description'] || edu.notes}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="flex items-start gap-3 pl-4">
                                    <GraduationCap className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                                    <p className="text-sm font-medium text-foreground leading-relaxed flex-1">{String(edu)}</p>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            );
        }

        // If it's an object but not an array - handle single education object
        if (typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed)) {
            // Check if it's a single education object with common fields
            const hasEducationFields = parsed.degree || parsed['Degree'] || parsed.degree_name || 
                                      parsed.institution || parsed['Institution'] || parsed.school;
            
            if (hasEducationFields) {
                // Treat as single education object
                return (
                    <div className="group relative overflow-hidden rounded-xl border-2 border-border/60 bg-gradient-to-br from-card to-card/50 p-5 shadow-sm hover:shadow-md transition-all duration-300">
                        <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-blue-500 via-blue-400 to-indigo-500"></div>
                        <div className="space-y-3 pl-4">
                            {/* Degree */}
                            {(parsed.degree || parsed['Degree'] || parsed.degree_name || parsed.title) && (
                                <h4 className="font-bold text-lg text-foreground">
                                    {parsed.degree || parsed['Degree'] || parsed.degree_name || parsed.title}
                                </h4>
                            )}
                            
                            {/* Institution */}
                            {(parsed.institution || parsed['Institution'] || parsed.school || parsed.university || parsed.college) && (
                                <div className="flex items-center gap-2 text-sm">
                                    <Building className="h-4 w-4 text-muted-foreground" />
                                    <span className="font-semibold text-foreground/90">
                                        {parsed.institution || parsed['Institution'] || parsed.school || parsed.university || parsed.college}
                                    </span>
                                </div>
                            )}

                            {/* Date Range */}
                            {(parsed.start_date || parsed['Start Date'] || parsed.startDate || parsed.end_date || parsed['End Date'] || parsed.endDate || parsed.year || parsed['Year'] || parsed.graduation_year) && (
                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                    <Calendar className="h-3.5 w-3.5" />
                                    <span>
                                        {(() => {
                                            const startDate = parsed.start_date || parsed['Start Date'] || parsed.startDate;
                                            const endDate = parsed.end_date || parsed['End Date'] || parsed.endDate;
                                            const year = parsed.year || parsed['Year'] || parsed.graduation_year;
                                            
                                            if (startDate && endDate) {
                                                return `${startDate} - ${endDate}`;
                                            } else if (year) {
                                                return year;
                                            } else if (startDate) {
                                                return `${startDate} - Present`;
                                            }
                                            return startDate || endDate || year;
                                        })()}
                                    </span>
                                </div>
                            )}

                            {/* Field of Study */}
                            {(parsed.field || parsed['Field'] || parsed.field_of_study || parsed.major || parsed.specialization) && (
                                <div className="pt-2 border-t border-border/40">
                                    <p className="text-xs font-semibold text-muted-foreground mb-1 uppercase tracking-wide">Field of Study</p>
                                    <p className="text-sm font-medium text-foreground/80">
                                        {parsed.field || parsed['Field'] || parsed.field_of_study || parsed.major || parsed.specialization}
                                    </p>
                                </div>
                            )}

                            {/* GPA */}
                            {(parsed.gpa || parsed['GPA'] || parsed.grade) && (
                                <div className="pt-2 border-t border-border/40">
                                    <p className="text-xs font-semibold text-muted-foreground mb-1 uppercase tracking-wide">Grade</p>
                                    <p className="text-sm font-medium text-foreground/80">
                                        {parsed.gpa || parsed['GPA'] || parsed.grade}
                                    </p>
                                </div>
                            )}

                            {/* Description */}
                            {(parsed.description || parsed['Description'] || parsed.notes) && (
                                <div className="pt-2 border-t border-border/40">
                                    <p className="text-sm font-medium text-foreground/80 leading-relaxed">
                                        {parsed.description || parsed['Description'] || parsed.notes}
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                );
            }

            // Otherwise, display as key-value pairs
            return (
                <div className="space-y-3">
                    {Object.entries(parsed).map(([key, value]: [string, any]) => {
                        // Skip null/undefined values
                        if (value === null || value === undefined || value === 'null') return null;
                        
                        return (
                            <div key={key} className="p-4 rounded-lg border-l-4 border-l-blue-500 bg-card/50">
                                <h4 className="font-bold text-sm text-foreground mb-2 capitalize">{key.replace(/_/g, ' ')}</h4>
                                {Array.isArray(value) ? (
                                    <ul className="list-disc list-inside space-y-1 ml-2">
                                        {value.map((item: any, idx: number) => (
                                            <li key={idx} className="text-sm font-medium text-foreground/80">{String(item)}</li>
                                        ))}
                                    </ul>
                                ) : (
                                    <p className="text-sm font-medium text-foreground/80">{String(value)}</p>
                                )}
                            </div>
                        );
                    })}
                </div>
            );
        }

        return (
            <div className="group relative overflow-hidden rounded-xl border-2 border-border/60 bg-gradient-to-br from-card to-card/50 p-4 shadow-sm hover:shadow-md transition-all duration-300">
                <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-blue-500 via-blue-400 to-indigo-500"></div>
                <div className="pl-4">
                    <p className="text-sm font-medium text-foreground whitespace-pre-wrap break-words leading-relaxed">
                        {String(education)}
                    </p>
                </div>
            </div>
        );
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-card border border-border/60 shadow-xl">
                <DialogHeader className="pb-4">
                    <div className="flex items-start gap-4">
                        <Avatar className="h-16 w-16 flex-shrink-0">
                            <AvatarFallback className="bg-gradient-to-br from-primary to-accent text-primary-foreground text-xl">
                                {getInitials(name)}
                            </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                            <DialogTitle className="text-2xl font-bold mb-2 break-words">{name}</DialogTitle>
                            <DialogDescription className="text-base font-medium text-foreground/80 break-words">
                                {candidate.email}
                            </DialogDescription>
                        </div>
                        <div className="flex flex-col gap-2 flex-shrink-0">
                            {candidate.Stage && (
                                <Badge variant="outline" className="whitespace-nowrap">{candidate.Stage}</Badge>
                            )}
                            {getScore() !== null && (
                                <Badge variant="secondary" className="whitespace-nowrap">
                                    {getScore()}% Match
                                </Badge>
                            )}
                        </div>
                    </div>
                </DialogHeader>

                <div className="space-y-6 mt-4">
                    {/* Contact Information */}
                    <div className="space-y-3">
                        <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                            <User className="h-5 w-5 flex-shrink-0" />
                            Contact Information
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="flex items-start gap-3 p-3 rounded-lg border bg-card">
                                <Mail className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                                <div className="min-w-0 flex-1">
                                    <p className="text-xs text-muted-foreground mb-1">Email</p>
                                    <a href={`mailto:${candidate.email}`} className="text-sm font-medium text-foreground hover:text-primary break-all">
                                        {candidate.email}
                                    </a>
                                </div>
                            </div>
                            {candidate.phone && (
                                <div className="flex items-start gap-3 p-3 rounded-lg border bg-card">
                                    <Phone className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                                    <div className="min-w-0 flex-1">
                                        <p className="text-xs text-muted-foreground mb-1">Phone</p>
                                        <p className="text-sm font-medium text-foreground break-all">{candidate.phone}</p>
                                    </div>
                                </div>
                            )}
                            <div className="flex items-start gap-3 p-3 rounded-lg border bg-card">
                                <MapPin className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                                <div className="min-w-0 flex-1">
                                    <p className="text-xs text-muted-foreground mb-1">Location</p>
                                    <p className="text-sm font-medium text-foreground break-words">{locationString}</p>
                                </div>
                            </div>
                            {candidate.jobs?.title && (
                                <div className="flex items-start gap-3 p-3 rounded-lg border bg-card">
                                    <Briefcase className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                                    <div className="min-w-0 flex-1">
                                        <p className="text-xs text-muted-foreground mb-1">Job</p>
                                        <p className="text-sm font-medium text-foreground break-words">{candidate.jobs.title}</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Schedule Meeting Button */}
                    <div className="flex justify-end">
                        <Button
                            onClick={() => setScheduleMeetingOpen(true)}
                            className="gap-2"
                        >
                            <CalendarPlus className="h-4 w-4" />
                            Schedule Meeting
                        </Button>
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
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        asChild
                                    >
                                        <a href={candidate.linkedin_url} target="_blank" rel="noopener noreferrer">
                                            <Linkedin className="h-4 w-4 mr-2" />
                                            LinkedIn
                                        </a>
                                    </Button>
                                )}
                                {candidate.github_url && (
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        asChild
                                    >
                                        <a href={candidate.github_url} target="_blank" rel="noopener noreferrer">
                                            <Github className="h-4 w-4 mr-2" />
                                            GitHub
                                        </a>
                                    </Button>
                                )}
                                {candidate.portfolio_url && (
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        asChild
                                    >
                                        <a href={candidate.portfolio_url} target="_blank" rel="noopener noreferrer">
                                            <Globe className="h-4 w-4 mr-2" />
                                            Portfolio
                                        </a>
                                    </Button>
                                )}
                                {candidate.website_url && (
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        asChild
                                    >
                                        <a href={candidate.website_url} target="_blank" rel="noopener noreferrer">
                                            <ExternalLink className="h-4 w-4 mr-2" />
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
                                <div className="p-3 rounded-lg border bg-card">
                                    <p className="text-xs text-muted-foreground mb-1">Experience</p>
                                    <p className="text-sm font-semibold text-foreground">
                                        {formatExperience()}
                                    </p>
                                </div>
                            )}
                            {/* Education */}
                            {candidate.education && (
                                <div>
                                    <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                                        <GraduationCap className="h-5 w-5 flex-shrink-0" />
                                        Education
                                    </h3>
                                    <div className="space-y-2">
                                        {formatEducation(candidate.education)}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Summary */}
                    {candidate.summary && (
                        <>
                            <Separator />
                            <div className="space-y-3">
                                <h3 className="text-lg font-bold flex items-center gap-2">
                                    <FileText className="h-5 w-5 flex-shrink-0" />
                                    Summary
                                </h3>
                                <div className="p-4 rounded-lg border bg-card">
                                    <p className="text-sm font-medium text-foreground whitespace-pre-wrap break-words leading-relaxed">
                                        {candidate.summary}
                                    </p>
                                </div>
                            </div>
                        </>
                    )}

                    {/* Work Experience */}
                    {candidate.Work_Experience && (
                        <>
                            <Separator />
                            <div className="space-y-4">
                                <h3 className="text-lg font-bold flex items-center gap-2">
                                    <Building className="h-5 w-5 flex-shrink-0" />
                                    Work Experience
                                </h3>
                                <div className="space-y-2">
                                    {formatWorkExperience(candidate.Work_Experience)}
                                </div>
                            </div>
                        </>
                    )}

                    {/* Projects */}
                    {candidate.Projects && (
                        <>
                            <Separator />
                            <div className="space-y-3">
                                <h3 className="text-lg font-bold flex items-center gap-2">
                                    <Award className="h-5 w-5 flex-shrink-0" />
                                    Projects
                                </h3>
                                <div className="p-4 rounded-lg border bg-card">
                                    {formatProjects(candidate.Projects)}
                                </div>
                            </div>
                        </>
                    )}

                    {/* ATS Analysis */}
                    {(candidate.ats_strength || candidate.ats_Weekness || candidate.ats_recommendation || candidate.matching_summary) && (
                        <>
                            <Separator />
                            <div className="space-y-4">
                                <h3 className="text-lg font-bold flex items-center gap-2">
                                    <TrendingUp className="h-5 w-5 flex-shrink-0" />
                                    ATS Analysis
                                </h3>
                                <div className="space-y-4">
                                    {candidate.ats_strength && (
                                        <div className="p-4 rounded-lg border bg-green-50 border-green-200">
                                            <p className="text-sm font-bold text-green-800 mb-2">Strengths</p>
                                            {Array.isArray(candidate.ats_strength) ? (
                                                <ul className="list-disc list-inside space-y-1 ml-2">
                                                    {candidate.ats_strength.map((item: string, idx: number) => (
                                                        <li key={idx} className="text-sm font-medium text-foreground">
                                                            {item}
                                                        </li>
                                                    ))}
                                                </ul>
                                            ) : typeof candidate.ats_strength === 'string' && candidate.ats_strength.startsWith('[') ? (
                                                (() => {
                                                    try {
                                                        const parsed = JSON.parse(candidate.ats_strength);
                                                        if (Array.isArray(parsed)) {
                                                            return (
                                                                <ul className="list-disc list-inside space-y-1 ml-2">
                                                                    {parsed.map((item: string, idx: number) => (
                                                                        <li key={idx} className="text-sm font-medium text-foreground">
                                                                            {item}
                                                                        </li>
                                                                    ))}
                                                                </ul>
                                                            );
                                                        }
                                                    } catch {}
                                                    return <p className="text-sm font-medium text-foreground whitespace-pre-wrap break-words leading-relaxed">{candidate.ats_strength}</p>;
                                                })()
                                            ) : (
                                                <p className="text-sm font-medium text-foreground whitespace-pre-wrap break-words leading-relaxed">
                                                    {candidate.ats_strength}
                                                </p>
                                            )}
                                        </div>
                                    )}
                                    {candidate.ats_Weekness && (
                                        <div className="p-4 rounded-lg border bg-orange-50 border-orange-200">
                                            <p className="text-sm font-bold text-orange-800 mb-2">Areas for Improvement</p>
                                            {Array.isArray(candidate.ats_Weekness) ? (
                                                <ul className="list-disc list-inside space-y-1 ml-2">
                                                    {candidate.ats_Weekness.map((item: string, idx: number) => (
                                                        <li key={idx} className="text-sm font-medium text-foreground">
                                                            {item}
                                                        </li>
                                                    ))}
                                                </ul>
                                            ) : typeof candidate.ats_Weekness === 'string' && candidate.ats_Weekness.startsWith('[') ? (
                                                (() => {
                                                    try {
                                                        const parsed = JSON.parse(candidate.ats_Weekness);
                                                        if (Array.isArray(parsed)) {
                                                            return (
                                                                <ul className="list-disc list-inside space-y-1 ml-2">
                                                                    {parsed.map((item: string, idx: number) => (
                                                                        <li key={idx} className="text-sm font-medium text-foreground">
                                                                            {item}
                                                                        </li>
                                                                    ))}
                                                                </ul>
                                                            );
                                                        }
                                                    } catch {}
                                                    return <p className="text-sm font-medium text-foreground whitespace-pre-wrap break-words leading-relaxed">{candidate.ats_Weekness}</p>;
                                                })()
                                            ) : (
                                                <p className="text-sm font-medium text-foreground whitespace-pre-wrap break-words leading-relaxed">
                                                    {candidate.ats_Weekness}
                                                </p>
                                            )}
                                        </div>
                                    )}
                                    {candidate.ats_recommendation && (
                                        <div className="p-4 rounded-lg border-l-4 border-l-blue-500 bg-blue-50/50 border-blue-200">
                                            <h4 className="text-sm font-bold text-blue-900 mb-3 flex items-center gap-2">
                                                <TrendingUp className="h-4 w-4" />
                                                Recommendation
                                            </h4>
                                            {typeof candidate.ats_recommendation === 'string' && candidate.ats_recommendation.includes('\n') ? (
                                                <ul className="space-y-2">
                                                    {candidate.ats_recommendation.split('\n').filter((line: string) => line.trim()).map((line: string, idx: number) => (
                                                        <li key={idx} className="flex items-start gap-2">
                                                            <span className="text-blue-600 mt-1.5 flex-shrink-0">•</span>
                                                            <p className="text-sm font-medium text-foreground leading-relaxed flex-1">{line.trim()}</p>
                                                        </li>
                                                    ))}
                                                </ul>
                                            ) : Array.isArray(candidate.ats_recommendation) ? (
                                                <ul className="space-y-2">
                                                    {candidate.ats_recommendation.map((item: string, idx: number) => (
                                                        <li key={idx} className="flex items-start gap-2">
                                                            <span className="text-blue-600 mt-1.5 flex-shrink-0">•</span>
                                                            <p className="text-sm font-medium text-foreground leading-relaxed flex-1">{item}</p>
                                                        </li>
                                                    ))}
                                                </ul>
                                            ) : (
                                                <p className="text-sm font-medium text-foreground whitespace-pre-wrap break-words leading-relaxed">
                                                    {candidate.ats_recommendation}
                                                </p>
                                            )}
                                        </div>
                                    )}
                                    {candidate.matching_summary && (
                                        <div className="p-4 rounded-lg border bg-card">
                                            <p className="text-sm font-bold text-foreground mb-3">Matching Summary</p>
                                            {formatMatchingSummary(candidate.matching_summary)}
                                        </div>
                                    )}
                                    {/* ATS Breakdown */}
                                    {candidate.ats_breakdown && (
                                        <div className="p-4 rounded-lg border bg-blue-50 border-blue-200">
                                            <p className="text-sm font-bold text-blue-800 mb-3">ATS Breakdown</p>
                                            <div className="text-sm font-medium text-foreground whitespace-pre-wrap break-words leading-relaxed">
                                                {formatJSONData(candidate.ats_breakdown)}
                                            </div>
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
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="p-3 rounded-lg border bg-card">
                            <p className="text-xs text-muted-foreground mb-1">Applied</p>
                            <p className="text-sm font-semibold text-foreground">
                                {candidate.created_at ? format(new Date(candidate.created_at), 'PPp') : 'N/A'}
                            </p>
                        </div>
                        {candidate.updated_at && (
                            <div className="p-3 rounded-lg border bg-card">
                                <p className="text-xs text-muted-foreground mb-1">Last Updated</p>
                                <p className="text-sm font-semibold text-foreground">
                                    {format(new Date(candidate.updated_at), 'PPp')}
                                </p>
                            </div>
                        )}
                        {candidate.source && (
                            <div className="p-3 rounded-lg border bg-card">
                                <p className="text-xs text-muted-foreground mb-2">Source</p>
                                <Badge variant="outline" className="font-semibold">{candidate.source}</Badge>
                            </div>
                        )}
                        {candidate.status && (
                            <div className="p-3 rounded-lg border bg-card">
                                <p className="text-xs text-muted-foreground mb-2">Status</p>
                                <Badge variant="secondary" className="font-semibold">{candidate.status}</Badge>
                            </div>
                        )}
                        {candidate.interview_status && (
                            <div className="p-3 rounded-lg border bg-card">
                                <p className="text-xs text-muted-foreground mb-2">Interview Status</p>
                                <Badge variant="outline" className="font-semibold">{candidate.interview_status}</Badge>
                            </div>
                        )}
                        {candidate.cv_file_size && (
                            <div className="p-3 rounded-lg border bg-card">
                                <p className="text-xs text-muted-foreground mb-1">CV Size</p>
                                <p className="text-sm font-semibold text-foreground">
                                    {formatFileSize(candidate.cv_file_size)}
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </DialogContent>
            
            {/* Schedule Meeting Dialog */}
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
                onSuccess={() => {
                    // Optionally refresh data or show success message
                }}
            />
        </Dialog>
    );
};

