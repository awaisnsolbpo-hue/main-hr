import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
    Sparkles,
    LogOut,
    Link as LinkIcon,
    FileText,
    ArrowRight,
    Linkedin,
    Loader2,
    AlertCircle,
    Plus,
    X,
    Wand2,
    CheckCircle,
    Mail,
    Globe,
    Search,
    Briefcase,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { isLinkedInConnected } from "@/lib/linkedinAuth";
import { getLinkedInOrganizations, shareJobPost } from "@/lib/linkedinApi";
import { getLinkedInJobDetails } from "@/lib/linkedinScraper";
import { jobsApi, profileApi } from "@/services/api";
import DashboardLayout from "@/components/DashboardLayout";

const PLATFORMS = [
    { id: "linkedin", name: "LinkedIn", icon: Linkedin, color: "text-blue-600" },
    { id: "indeed", name: "Indeed", icon: Briefcase, color: "text-blue-500" },
    { id: "google_jobs", name: "Google Jobs", icon: Search, color: "text-blue-400" },
    { id: "adzuna", name: "Adzuna", icon: Globe, color: "text-orange-600" },
    { id: "jooble", name: "Jooble", icon: Briefcase, color: "text-green-600" },
    { id: "careerjet", name: "CareerJet", icon: Briefcase, color: "text-red-600" },
    { id: "monster", name: "Monster", icon: Briefcase, color: "text-primary" },
    { id: "careerbuilder", name: "CareerBuilder", icon: Briefcase, color: "text-blue-700" },
    { id: "ziprecruiter", name: "ZipRecruiter", icon: Briefcase, color: "text-yellow-600" },
    { id: "stepstone", name: "StepStone", icon: Briefcase, color: "text-indigo-600" },
    { id: "email", name: "Email Blast", icon: Mail, color: "text-gray-600" },
    { id: "internal", name: "Internal Portal", icon: FileText, color: "text-primary" },
];

const CreateJob = () => {
    const navigate = useNavigate();
    const { toast } = useToast();
    const [importMethod, setImportMethod] = useState<"linkedin" | "ai" | "manual" | null>(null);
    const [currentStep, setCurrentStep] = useState<"method" | "job-details" | "ats-criteria" | "requirements" | "publish">("method");
    const [linkedinUrl, setLinkedinUrl] = useState("");
    const [scraping, setScraping] = useState(false);
    const [scrapingError, setScrapingError] = useState("");
    const [generatingJob, setGeneratingJob] = useState(false);
    const [jobTitle, setJobTitle] = useState("");
    const [aiGeneratedContent, setAiGeneratedContent] = useState(false);
    const [postToLinkedIn, setPostToLinkedIn] = useState(false);
    const [linkedinConnected, setLinkedinConnected] = useState(false);
    const [linkedinOrgs, setLinkedinOrgs] = useState<any[]>([]);
    const [selectedOrg, setSelectedOrg] = useState("");
    const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>(["internal"]);
    const [communityPostFlag, setCommunityPostFlag] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [customQuestions, setCustomQuestions] = useState<string[]>([]);
    const [newQuestion, setNewQuestion] = useState("");
    const [userLocation, setUserLocation] = useState<{ city?: string; country?: string }>({});

    // Job Details Form
    const [formData, setFormData] = useState({
        title: "",
        description: "",
        closeDate: "",
        city: "",
        country: "",
        salaryMin: "",
        salaryMax: "",
        location: "",
        locationType: "hybrid",
        jobLevel: "mid",
        company_about: "",
        responsibilities: "",
        benefits: "",
    });

    // ATS Criteria Form
    const [atsCriteria, setAtsCriteria] = useState({
        skills_importance: 8,
        experience_importance: 6,
        education_importance: 5,
        projects_importance: 4,
        certifications_importance: 3,
        languages_importance: 3,
        overall_strictness: 7,
    });

    // Requirements Form
    const [requirements, setRequirements] = useState({
        required_skills: [] as string[],
        preferred_skills: [] as string[],
        years_required: 0,
        education_required: "Bachelor",
        certifications: [] as string[],
        languages: [] as string[],
        other_requirements: "",
    });

    const [newSkill, setNewSkill] = useState("");

    useEffect(() => {
        checkLinkedInStatus();
        fetchUserLocation();
    }, []);

    // Fetch user location from profile or browser
    const fetchUserLocation = async () => {
        try {
            // First, try to get location from user profile
            try {
                const { profile } = await profileApi.get();
                if (profile?.company_city && profile?.company_country) {
                    setUserLocation({
                        city: profile.company_city,
                        country: profile.company_country,
                    });
                    return;
                }
            } catch (error) {
                console.log("Could not fetch profile location:", error);
            }

            // Fallback: Try browser geolocation API
            if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition(
                    async (position) => {
                        try {
                            // Reverse geocode to get city and country
                            const response = await fetch(
                                `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${position.coords.latitude}&longitude=${position.coords.longitude}&localityLanguage=en`
                            );
                            const data = await response.json();
                            
                            if (data.city && data.countryName) {
                                setUserLocation({
                                    city: data.city,
                                    country: data.countryName,
                                });
                            }
                        } catch (error) {
                            console.log("Could not reverse geocode location:", error);
                        }
                    },
                    (error) => {
                        console.log("Geolocation error:", error);
                    },
                    { timeout: 5000 }
                );
            }
        } catch (error) {
            console.error("Error fetching user location:", error);
        }
    };

    const checkLinkedInStatus = async () => {
        try {
            const connected = await isLinkedInConnected();
            setLinkedinConnected(connected);

            if (connected) {
                const orgs = await getLinkedInOrganizations();
                setLinkedinOrgs(orgs);
                if (orgs.length > 0) {
                    setSelectedOrg(orgs[0].id);
                }
            }
        } catch (error) {
            console.error("Error checking LinkedIn status:", error);
        }
    };

    const handleAddQuestion = () => {
        if (newQuestion.trim()) {
            setCustomQuestions([...customQuestions, newQuestion.trim()]);
            setNewQuestion("");
        }
    };

    const handleRemoveQuestion = (index: number) => {
        setCustomQuestions(customQuestions.filter((_, i) => i !== index));
    };

    // LinkedIn Import
    const handleLinkedInImport = async () => {
        if (!linkedinUrl) {
            toast({
                title: "Missing URL",
                description: "Please enter a LinkedIn job URL.",
                variant: "destructive",
            });
            return;
        }

        if (!linkedinUrl.includes('linkedin.com/jobs/view/')) {
            toast({
                title: "Invalid URL",
                description: "Please enter a valid LinkedIn job posting URL.",
                variant: "destructive",
            });
            return;
        }

        setScraping(true);
        setScrapingError("");

        try {
            toast({
                title: "Scraping Job Details",
                description: "Fetching job information from LinkedIn...",
            });

            const jobData = await getLinkedInJobDetails(linkedinUrl);

            setFormData({
                ...formData,
                title: jobData.title || "",
                city: jobData.city || "",
                country: jobData.country || "",
                salaryMin: jobData.salaryMin || "",
                salaryMax: jobData.salaryMax || "",
                locationType: jobData.locationType || "hybrid",
                jobLevel: jobData.jobLevel || "mid",
                description: jobData.description || "",
            });

            toast({
                title: "Import Successful!",
                description: "Job details have been imported. Please review and edit if needed.",
            });

            setImportMethod("manual");
            setCurrentStep("job-details");
        } catch (error: any) {
            console.error("Scraping error:", error);
            setScrapingError(error.message || "Failed to scrape job details");

            toast({
                title: "Import Failed",
                description: error.message || "Could not fetch job details. Please add manually.",
                variant: "destructive",
            });
        } finally {
            setScraping(false);
        }
    };

    // AI Generation
    const generateJobWithAI = async () => {
        if (!jobTitle.trim()) {
            toast({
                title: "Missing Title",
                description: "Please enter a job title first",
                variant: "destructive",
            });
            return;
        }

        setGeneratingJob(true);
        try {
            const data = await jobsApi.generate(jobTitle, userLocation);

            setFormData({
                ...formData,
                title: data.job_details.title || jobTitle,
                description: data.job_details.description || "",
                salaryMin: data.job_details.salary_min?.toString() || "",
                salaryMax: data.job_details.salary_max?.toString() || "",
                location: data.job_details.location || "",
                locationType: data.job_details.location_type || "hybrid",
                jobLevel: data.job_details.job_level || "mid",
                company_about: data.job_details.company_about || "",
                responsibilities: data.job_details.responsibilities || "",
                benefits: data.job_details.benefits || "",
            });

            setRequirements({
                required_skills: data.requirements.required_skills || [],
                preferred_skills: data.requirements.preferred_skills || [],
                years_required: data.requirements.years_required || 0,
                education_required: data.requirements.education_required || "Bachelor",
                certifications: data.requirements.certifications || [],
                languages: data.requirements.languages || [],
                other_requirements: data.requirements.other_requirements || "",
            });

            setAiGeneratedContent(true);

            toast({
                title: "Job Generated!",
                description: "Job details and requirements have been generated by AI",
            });

            setCurrentStep("job-details");
        } catch (error: any) {
            toast({
                title: "Generation Failed",
                description: error.message || "Failed to generate job details",
                variant: "destructive",
            });
        } finally {
            setGeneratingJob(false);
        }
    };

    // Fill with AI button
    const fillJobWithAI = async () => {
        if (!formData.title.trim()) {
            toast({
                title: "Missing Title",
                description: "Please enter a job title first",
                variant: "destructive",
            });
            return;
        }

        setGeneratingJob(true);
        try {
            const data = await jobsApi.generate(formData.title, userLocation);

            setFormData((prev) => ({
                ...prev,
                description: data.job_details.description || prev.description,
                salaryMin: data.job_details.salary_min?.toString() || prev.salaryMin,
                salaryMax: data.job_details.salary_max?.toString() || prev.salaryMax,
                location: data.job_details.location || prev.location,
                locationType: data.job_details.location_type || prev.locationType,
                jobLevel: data.job_details.job_level || prev.jobLevel,
                company_about: data.job_details.company_about || prev.company_about,
                responsibilities: data.job_details.responsibilities || prev.responsibilities,
                benefits: data.job_details.benefits || prev.benefits,
            }));

            setRequirements((prev) => ({
                ...prev,
                required_skills: data.requirements.required_skills || prev.required_skills,
                preferred_skills: data.requirements.preferred_skills || prev.preferred_skills,
                years_required: data.requirements.years_required || prev.years_required,
                education_required: data.requirements.education_required || prev.education_required,
                certifications: data.requirements.certifications || prev.certifications,
                languages: data.requirements.languages || prev.languages,
                other_requirements: data.requirements.other_requirements || prev.other_requirements,
            }));

            setAiGeneratedContent(true);

            toast({
                title: "Filled with AI!",
                description: "Form has been populated with AI-generated content",
            });
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.message || "Failed to generate content",
                variant: "destructive",
            });
        } finally {
            setGeneratingJob(false);
        }
    };

    // Submit job
    const handleSubmit = async () => {
        if (!formData.title || !formData.description) {
            toast({
                title: "Missing Fields",
                description: "Please fill in job title and description",
                variant: "destructive",
            });
            return;
        }

        setSubmitting(true);

        try {
            const { data: { user } } = await supabase.auth.getUser();

            if (!user) {
                navigate("/login");
                return;
            }

            const jobPayload = {
                title: formData.title,
                description: formData.description,
                city: formData.city || null,
                country: formData.country || null,
                salary_min: formData.salaryMin ? parseFloat(formData.salaryMin) : null,
                salary_max: formData.salaryMax ? parseFloat(formData.salaryMax) : null,
                location: formData.location || null,
                location_type: formData.locationType,
                job_level: formData.jobLevel,
                close_date: formData.closeDate || null,
                questions: customQuestions.length > 0 ? customQuestions : null,
                ats_criteria: atsCriteria,
                job_requirements: requirements,
                ai_generated: aiGeneratedContent,
                published_platforms: selectedPlatforms,
                community_post_flag: communityPostFlag,
                visible_to_applicants: communityPostFlag, // If posted to community, make visible to applicants
                status: "active",
            };

            const { job } = await jobsApi.create(jobPayload);

            // Post to LinkedIn if selected
            if (selectedPlatforms.includes("linkedin") && linkedinConnected && selectedOrg) {
                try {
                    toast({
                        title: "Posting to LinkedIn",
                        description: "Sharing your job on LinkedIn...",
                    });

                    const applyUrl = `${window.location.origin}/apply/${job.id}`;

                    const linkedinPostId = await shareJobPost(
                        selectedOrg,
                        formData.title,
                        formData.description,
                        applyUrl
                    );

                    await jobsApi.update(job.id, {
                        linkedin_post_id: linkedinPostId,
                        linkedin_posted_at: new Date().toISOString(),
                        linkedin_organization_id: selectedOrg,
                        posted_to_linkedin: true,
                    });

                    toast({
                        title: "Success!",
                        description: "Job created and posted to LinkedIn!",
                    });
                } catch (linkedinError: any) {
                    console.error("LinkedIn posting error:", linkedinError);
                    toast({
                        title: "Job Created",
                        description: "Job created but failed to post to LinkedIn. You can post it manually later.",
                        variant: "destructive",
                    });
                }
            } else {
                toast({
                    title: "Job Created!",
                    description: "Your job has been posted successfully",
                });
            }

            setTimeout(() => {
                navigate(`/jobs/${job.id}`);
            }, 1500);
        } catch (error: any) {
            console.error("Error creating job:", error);
            toast({
                title: "Error",
                description: error.message || "Failed to create job. Please try again.",
                variant: "destructive",
            });
        } finally {
            setSubmitting(false);
        }
    };

    const handleLogout = async () => {
        await supabase.auth.signOut();
        navigate("/login");
    };

    // Method Selection Screen
    if (currentStep === "method" && !importMethod) {
        return (
            <DashboardLayout>
                <div className="min-h-screen bg-[var(--gradient-subtle)]">
                    <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
                    <div className="max-w-4xl mx-auto space-y-8 animate-fade-in">
                        <div className="text-center space-y-4">
                            <h1 className="text-3xl font-bold">Create New Job</h1>
                            <p className="text-muted-foreground">
                                Choose how you'd like to create your job posting
                            </p>
                        </div>

                        <div className="grid md:grid-cols-3 gap-6">
                            {/* LinkedIn Import */}
                            <Card
                                className="hover-scale hover-glow cursor-pointer transition-all"
                                onClick={() => setImportMethod("linkedin")}
                            >
                                <CardHeader>
                                    <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 mb-4">
                                        <LinkIcon className="h-6 w-6 text-white" />
                                    </div>
                                    <CardTitle>Import from LinkedIn</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-sm text-muted-foreground">
                                        Paste a LinkedIn job URL and we'll automatically scrape and fill in all the details for you.
                                    </p>
                                </CardContent>
                            </Card>

                            {/* AI Generation */}
                            <Card
                                className="hover-scale hover-glow cursor-pointer transition-all"
                                onClick={() => setImportMethod("ai")}
                            >
                                <CardHeader>
                                    <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-gradient-to-br from-primary to-accent mb-4">
                                        <Sparkles className="h-6 w-6 text-white" />
                                    </div>
                                    <CardTitle>Generate with AI</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-sm text-muted-foreground">
                                        Enter a job title and let AI auto-generate complete job details, requirements, and more.
                                    </p>
                                </CardContent>
                            </Card>

                            {/* Manual Entry */}
                            <Card
                                className="hover-scale hover-glow cursor-pointer transition-all"
                                onClick={() => {
                                    setImportMethod("manual");
                                    setCurrentStep("job-details");
                                }}
                            >
                                <CardHeader>
                                    <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-gradient-to-br from-primary to-accent mb-4">
                                        <FileText className="h-6 w-6 text-primary-foreground" />
                                    </div>
                                    <CardTitle>Add Manually</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-sm text-muted-foreground">
                                        Enter all job details manually through our intuitive form interface with AI assist option.
                                    </p>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </main>
            </div>
            </DashboardLayout>
        );
    }

    // LinkedIn Import Screen
    if (importMethod === "linkedin" && currentStep === "method") {
        return (
            <DashboardLayout>
                <div className="min-h-screen bg-[var(--gradient-subtle)]">
                    <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
                    <div className="max-w-2xl mx-auto space-y-8 animate-fade-in">
                        <Button
                            variant="ghost"
                            onClick={() => {
                                setImportMethod(null);
                                setLinkedinUrl("");
                                setScrapingError("");
                            }}
                        >
                            ← Back
                        </Button>

                        <div className="text-center space-y-4">
                            <h1 className="text-3xl font-bold">Import from LinkedIn</h1>
                            <p className="text-muted-foreground">
                                Paste the LinkedIn job posting URL below to automatically extract job details
                            </p>
                        </div>

                        <Card>
                            <CardContent className="pt-6 space-y-6">
                                {scrapingError && (
                                    <Alert variant="destructive">
                                        <AlertCircle className="h-4 w-4" />
                                        <AlertDescription>{scrapingError}</AlertDescription>
                                    </Alert>
                                )}

                                <div className="space-y-2">
                                    <Label htmlFor="linkedin-url">LinkedIn Job URL *</Label>
                                    <Input
                                        id="linkedin-url"
                                        placeholder="https://www.linkedin.com/jobs/view/..."
                                        value={linkedinUrl}
                                        onChange={(e) => {
                                            setLinkedinUrl(e.target.value);
                                            setScrapingError("");
                                        }}
                                        disabled={scraping}
                                    />
                                    <p className="text-xs text-muted-foreground">
                                        Example: https://www.linkedin.com/jobs/view/1234567890/
                                    </p>
                                </div>

                                <Button
                                    variant="hero"
                                    size="lg"
                                    className="w-full"
                                    onClick={handleLinkedInImport}
                                    disabled={scraping || !linkedinUrl}
                                >
                                    {scraping ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Scraping Job Details...
                                        </>
                                    ) : (
                                        "Import Job Details"
                                    )}
                                </Button>

                                <div className="text-center">
                                    <Button
                                        variant="link"
                                        onClick={() => {
                                            setImportMethod("manual");
                                            setCurrentStep("job-details");
                                            setLinkedinUrl("");
                                            setScrapingError("");
                                        }}
                                        disabled={scraping}
                                    >
                                        Or add job details manually
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </main>
            </div>
            </DashboardLayout>
        );
    }

    // AI Generation Screen
    if (importMethod === "ai" && currentStep === "method") {
        return (
            <DashboardLayout>
                <div className="min-h-screen bg-[var(--gradient-subtle)]">
                    <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
                    <div className="max-w-2xl mx-auto space-y-8 animate-fade-in">
                        <Button
                            variant="ghost"
                            onClick={() => {
                                setImportMethod(null);
                                setJobTitle("");
                            }}
                        >
                            ← Back
                        </Button>

                        <div className="text-center space-y-4">
                            <h1 className="text-3xl font-bold">Generate with AI</h1>
                            <p className="text-muted-foreground">
                                Enter a job title and let AI create a complete job posting for you
                            </p>
                        </div>

                        <Card>
                            <CardContent className="pt-6 space-y-6">
                                <div className="space-y-2">
                                    <Label htmlFor="job-title">Job Title *</Label>
                                    <Input
                                        id="job-title"
                                        placeholder="e.g., Senior Full Stack Developer"
                                        value={jobTitle}
                                        onChange={(e) => setJobTitle(e.target.value)}
                                        disabled={generatingJob}
                                    />
                                </div>

                                <Button
                                    variant="hero"
                                    size="lg"
                                    className="w-full"
                                    onClick={generateJobWithAI}
                                    disabled={generatingJob || !jobTitle.trim()}
                                >
                                    {generatingJob ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Generating Job Details...
                                        </>
                                    ) : (
                                        <>
                                            <Sparkles className="mr-2 h-4 w-4" />
                                            Generate Job with AI
                                        </>
                                    )}
                                </Button>
                            </CardContent>
                        </Card>
                    </div>
                </main>
            </div>
            </DashboardLayout>
        );
    }

    // Main Form with Tabs
    return (
        <DashboardLayout>
            <div className="min-h-screen bg-[var(--gradient-subtle)]">
                <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <div className="max-w-4xl mx-auto space-y-8 animate-fade-in">
                    <Button variant="ghost" onClick={() => {
                        setCurrentStep("method");
                        setImportMethod(null);
                    }}>
                        ← Back
                    </Button>

                    <div>
                        <h1 className="text-3xl font-bold mb-2">Job Details</h1>
                        <p className="text-muted-foreground">
                            {currentStep === "job-details" && "Fill in the information about your job posting"}
                            {currentStep === "ats-criteria" && "Configure ATS scoring criteria"}
                            {currentStep === "requirements" && "Set job requirements and qualifications"}
                            {currentStep === "publish" && "Select where to publish this job"}
                        </p>
                    </div>

                    <Tabs value={currentStep} onValueChange={(v: any) => setCurrentStep(v)}>
                        <TabsList className="grid w-full grid-cols-3 mb-6">
                            <TabsTrigger value="job-details">Job Details</TabsTrigger>
                            <TabsTrigger value="ats-criteria">ATS Criteria</TabsTrigger>
                            <TabsTrigger value="requirements">Requirements</TabsTrigger>
                        </TabsList>

                        {/* TAB 1: Job Details */}
                        <TabsContent value="job-details" className="space-y-6">
                            <Card>
                                <CardHeader>
                                    <div className="flex items-center justify-between">
                                        <CardTitle>Job Details</CardTitle>
                                        {!aiGeneratedContent && (
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={fillJobWithAI}
                                                disabled={generatingJob || !formData.title}
                                                className="gap-2"
                                            >
                                                {generatingJob ? (
                                                    <Loader2 className="h-4 w-4 animate-spin" />
                                                ) : (
                                                    <Wand2 className="h-4 w-4" />
                                                )}
                                                Fill with AI
                                            </Button>
                                        )}
                                    </div>
                                </CardHeader>
                                <CardContent className="pt-6 space-y-6">
                                    <div className="grid md:grid-cols-2 gap-6">
                                        <div className="space-y-2 md:col-span-2">
                                            <Label htmlFor="title">Job Title *</Label>
                                            <Input
                                                id="title"
                                                placeholder="e.g., Senior Software Engineer"
                                                value={formData.title}
                                                onChange={(e) =>
                                                    setFormData({ ...formData, title: e.target.value })
                                                }
                                                required
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="jobLevel">Job Level</Label>
                                            <Select
                                                value={formData.jobLevel}
                                                onValueChange={(value) =>
                                                    setFormData({ ...formData, jobLevel: value })
                                                }
                                            >
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select job level" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="entry">Entry Level</SelectItem>
                                                    <SelectItem value="mid">Mid Level</SelectItem>
                                                    <SelectItem value="senior">Senior</SelectItem>
                                                    <SelectItem value="lead">Lead</SelectItem>
                                                    <SelectItem value="exec">Executive</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="locationType">Location Type</Label>
                                            <Select
                                                value={formData.locationType}
                                                onValueChange={(value) =>
                                                    setFormData({ ...formData, locationType: value })
                                                }
                                            >
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select location type" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="remote">Remote</SelectItem>
                                                    <SelectItem value="hybrid">Hybrid</SelectItem>
                                                    <SelectItem value="onsite">On-site</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="location">Location</Label>
                                            <Input
                                                id="location"
                                                placeholder="San Francisco, CA"
                                                value={formData.location}
                                                onChange={(e) =>
                                                    setFormData({ ...formData, location: e.target.value })
                                                }
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="city">City</Label>
                                            <Input
                                                id="city"
                                                placeholder="e.g., San Francisco"
                                                value={formData.city}
                                                onChange={(e) =>
                                                    setFormData({ ...formData, city: e.target.value })
                                                }
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="country">Country</Label>
                                            <Input
                                                id="country"
                                                placeholder="e.g., USA"
                                                value={formData.country}
                                                onChange={(e) =>
                                                    setFormData({ ...formData, country: e.target.value })
                                                }
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="salaryMin">Salary Range (Min)</Label>
                                            <Input
                                                id="salaryMin"
                                                type="number"
                                                placeholder="e.g., 80000"
                                                value={formData.salaryMin}
                                                onChange={(e) =>
                                                    setFormData({ ...formData, salaryMin: e.target.value })
                                                }
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="salaryMax">Salary Range (Max)</Label>
                                            <Input
                                                id="salaryMax"
                                                type="number"
                                                placeholder="e.g., 120000"
                                                value={formData.salaryMax}
                                                onChange={(e) =>
                                                    setFormData({ ...formData, salaryMax: e.target.value })
                                                }
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="closeDate">Close Date</Label>
                                            <Input
                                                id="closeDate"
                                                type="date"
                                                value={formData.closeDate}
                                                onChange={(e) =>
                                                    setFormData({ ...formData, closeDate: e.target.value })
                                                }
                                            />
                                        </div>

                                        <div className="space-y-2 md:col-span-2">
                                            <Label htmlFor="description">Full Job Description *</Label>
                                            <Textarea
                                                id="description"
                                                placeholder="Describe the role, responsibilities, requirements, and benefits..."
                                                rows={8}
                                                value={formData.description}
                                                onChange={(e) =>
                                                    setFormData({ ...formData, description: e.target.value })
                                                }
                                                required
                                            />
                                        </div>

                                        <div className="space-y-2 md:col-span-2">
                                            <Label htmlFor="responsibilities">Responsibilities</Label>
                                            <Textarea
                                                id="responsibilities"
                                                placeholder="List key responsibilities..."
                                                rows={4}
                                                value={formData.responsibilities}
                                                onChange={(e) =>
                                                    setFormData({ ...formData, responsibilities: e.target.value })
                                                }
                                            />
                                        </div>

                                        <div className="space-y-2 md:col-span-2">
                                            <Label htmlFor="benefits">Benefits</Label>
                                            <Textarea
                                                id="benefits"
                                                placeholder="Health insurance, remote work, equity, etc..."
                                                rows={4}
                                                value={formData.benefits}
                                                onChange={(e) =>
                                                    setFormData({ ...formData, benefits: e.target.value })
                                                }
                                            />
                                        </div>

                                        {/* Custom Questions */}
                                        <div className="space-y-4 md:col-span-2 border-t pt-4">
                                            <div>
                                                <Label className="text-base">Custom Questions (Optional)</Label>
                                                <p className="text-sm text-muted-foreground mt-1">
                                                    Add custom questions you want to ask candidates during application
                                                </p>
                                            </div>

                                            {customQuestions.length > 0 && (
                                                <div className="space-y-2">
                                                    {customQuestions.map((question, index) => (
                                                        <div
                                                            key={index}
                                                            className="flex items-center gap-2 p-3 bg-secondary rounded-lg"
                                                        >
                                                            <span className="flex-1 text-sm">{question}</span>
                                                            <Button
                                                                type="button"
                                                                variant="ghost"
                                                                size="sm"
                                                                onClick={() => handleRemoveQuestion(index)}
                                                            >
                                                                <X className="h-4 w-4" />
                                                            </Button>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}

                                            <div className="flex gap-2">
                                                <Input
                                                    placeholder="Enter a custom question..."
                                                    value={newQuestion}
                                                    onChange={(e) => setNewQuestion(e.target.value)}
                                                    onKeyPress={(e) => {
                                                        if (e.key === "Enter") {
                                                            e.preventDefault();
                                                            handleAddQuestion();
                                                        }
                                                    }}
                                                />
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    onClick={handleAddQuestion}
                                                    disabled={!newQuestion.trim()}
                                                >
                                                    <Plus className="h-4 w-4 mr-2" />
                                                    Add
                                                </Button>
                                            </div>
                                        </div>
                                    </div>

                                    <Button
                                        onClick={() => setCurrentStep("ats-criteria")}
                                        variant="hero"
                                        size="lg"
                                        className="w-full group"
                                    >
                                        Next: ATS Criteria
                                        <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                                    </Button>
                                </CardContent>
                            </Card>
                        </TabsContent>

                        {/* TAB 2: ATS Criteria */}
                        <TabsContent value="ats-criteria" className="space-y-6">
                            <Card>
                                <CardHeader>
                                    <CardTitle>ATS Scoring Criteria</CardTitle>
                                    <p className="text-sm text-muted-foreground mt-2">
                                        Set how strictly the AI should score candidates on each criterion (1-10)
                                    </p>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    {Object.entries(atsCriteria).map(([key, value]) => (
                                        <div key={key} className="space-y-3">
                                            <div className="flex items-center justify-between">
                                                <Label className="capitalize">
                                                    {key.replace(/_/g, " ")}
                                                </Label>
                                                <span className="text-sm font-bold text-primary">
                                                    {value}/10
                                                </span>
                                            </div>
                                            <input
                                                type="range"
                                                min="1"
                                                max="10"
                                                value={value}
                                                onChange={(e) =>
                                                    setAtsCriteria({
                                                        ...atsCriteria,
                                                        [key]: parseInt(e.target.value),
                                                    })
                                                }
                                                className="w-full h-2 bg-secondary rounded-lg appearance-none cursor-pointer"
                                            />
                                            <p className="text-xs text-muted-foreground">
                                                {value <= 3 && "Low priority"}
                                                {value > 3 && value <= 6 && "Medium priority"}
                                                {value > 6 && value <= 8 && "High priority"}
                                                {value > 8 && "Critical requirement"}
                                            </p>
                                        </div>
                                    ))}

                                    <div className="grid grid-cols-2 gap-4">
                                        <Button
                                            onClick={() => setCurrentStep("job-details")}
                                            variant="outline"
                                        >
                                            Back
                                        </Button>
                                        <Button
                                            onClick={() => setCurrentStep("requirements")}
                                            variant="hero"
                                        >
                                            Next: Requirements
                                            <ArrowRight className="ml-2 h-4 w-4" />
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        </TabsContent>

                        {/* TAB 3: Requirements */}
                        <TabsContent value="requirements" className="space-y-6">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Job Requirements</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    <div className="grid md:grid-cols-2 gap-6">
                                        {/* Required Skills */}
                                        <div className="space-y-3 md:col-span-2">
                                            <Label>Required Skills</Label>
                                            <div className="space-y-2">
                                                {requirements.required_skills.map((skill) => (
                                                    <div key={skill} className="flex items-center gap-2 p-2 bg-secondary rounded">
                                                        <span className="flex-1 text-sm">{skill}</span>
                                                        <button
                                                            onClick={() =>
                                                                setRequirements({
                                                                    ...requirements,
                                                                    required_skills: requirements.required_skills.filter((s) => s !== skill),
                                                                })
                                                            }
                                                            className="text-destructive hover:text-destructive/80"
                                                        >
                                                            <X className="h-4 w-4" />
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                            <div className="flex gap-2">
                                                <Input
                                                    value={newSkill}
                                                    onChange={(e) => setNewSkill(e.target.value)}
                                                    placeholder="Add skill..."
                                                    onKeyPress={(e) => {
                                                        if (e.key === "Enter") {
                                                            e.preventDefault();
                                                            if (newSkill.trim()) {
                                                                setRequirements({
                                                                    ...requirements,
                                                                    required_skills: [...requirements.required_skills, newSkill.trim()],
                                                                });
                                                                setNewSkill("");
                                                            }
                                                        }
                                                    }}
                                                />
                                                <Button
                                                    onClick={() => {
                                                        if (newSkill.trim()) {
                                                            setRequirements({
                                                                ...requirements,
                                                                required_skills: [...requirements.required_skills, newSkill.trim()],
                                                            });
                                                            setNewSkill("");
                                                        }
                                                    }}
                                                    size="sm"
                                                    variant="outline"
                                                >
                                                    <Plus className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </div>

                                        {/* Years Required */}
                                        <div className="space-y-2">
                                            <Label>Years of Experience Required</Label>
                                            <Input
                                                type="number"
                                                value={requirements.years_required}
                                                onChange={(e) =>
                                                    setRequirements({
                                                        ...requirements,
                                                        years_required: parseInt(e.target.value) || 0,
                                                    })
                                                }
                                            />
                                        </div>

                                        {/* Education */}
                                        <div className="space-y-2">
                                            <Label>Education Required</Label>
                                            <Select
                                                value={requirements.education_required}
                                                onValueChange={(value) =>
                                                    setRequirements({
                                                        ...requirements,
                                                        education_required: value,
                                                    })
                                                }
                                            >
                                                <SelectTrigger>
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="High School">High School</SelectItem>
                                                    <SelectItem value="Bachelor">Bachelor's Degree</SelectItem>
                                                    <SelectItem value="Master">Master's Degree</SelectItem>
                                                    <SelectItem value="PhD">PhD</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        {/* Other Requirements */}
                                        <div className="space-y-2 md:col-span-2">
                                            <Label>Other Requirements</Label>
                                            <Textarea
                                                value={requirements.other_requirements}
                                                onChange={(e) =>
                                                    setRequirements({
                                                        ...requirements,
                                                        other_requirements: e.target.value,
                                                    })
                                                }
                                                placeholder="Any other important requirements..."
                                                rows={3}
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <Button
                                            onClick={() => setCurrentStep("ats-criteria")}
                                            variant="outline"
                                        >
                                            Back
                                        </Button>
                                        <Button
                                            onClick={() => setCurrentStep("publish")}
                                            variant="hero"
                                        >
                                            Next: Publish
                                            <ArrowRight className="ml-2 h-4 w-4" />
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        </TabsContent>
                    </Tabs>

                    {/* Publish Step */}
                    {currentStep === "publish" && (
                        <Card>
                            <CardHeader>
                                <CardTitle>Select Publishing Platforms</CardTitle>
                                <p className="text-sm text-muted-foreground mt-2">
                                    Choose where to publish this job
                                </p>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {PLATFORMS.map((platform) => (
                                        <div
                                            key={platform.id}
                                            onClick={() => {
                                                setSelectedPlatforms((prev) =>
                                                    prev.includes(platform.id)
                                                        ? prev.filter((p) => p !== platform.id)
                                                        : [...prev, platform.id]
                                                );
                                            }}
                                            className={`p-4 rounded-lg border-2 cursor-pointer transition-all hover:border-primary/50 ${
                                                selectedPlatforms.includes(platform.id)
                                                    ? "border-primary bg-primary/10"
                                                    : "border-border bg-card"
                                            }`}
                                        >
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    <platform.icon className={`h-5 w-5 ${platform.color}`} />
                                                    <span className="font-medium">{platform.name}</span>
                                                </div>
                                                {selectedPlatforms.includes(platform.id) && (
                                                    <CheckCircle className="h-5 w-5 text-primary" />
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {linkedinConnected && selectedPlatforms.includes("linkedin") && (
                                    <div className="space-y-2">
                                        <Label htmlFor="linkedin-org">Select LinkedIn Organization</Label>
                                        <Select value={selectedOrg} onValueChange={setSelectedOrg}>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select organization" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {linkedinOrgs.map((org) => (
                                                    <SelectItem key={org.id} value={org.id}>
                                                        {org.name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                )}

                                {!linkedinConnected && selectedPlatforms.includes("linkedin") && (
                                    <Alert>
                                        <AlertCircle className="h-4 w-4" />
                                        <AlertDescription>
                                            <div className="flex items-center justify-between">
                                                <span>Connect LinkedIn to post jobs</span>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => navigate("/connect-linkedin")}
                                                >
                                                    Connect
                                                </Button>
                                            </div>
                                        </AlertDescription>
                                    </Alert>
                                )}

                                <div className="flex items-center space-x-2 p-4 rounded-lg border bg-secondary/50">
                                    <Checkbox
                                        id="community-post"
                                        checked={communityPostFlag}
                                        onCheckedChange={(checked) => setCommunityPostFlag(checked as boolean)}
                                    />
                                    <Label htmlFor="community-post" className="cursor-pointer flex-1">
                                        <div className="flex flex-col">
                                            <span className="font-medium">Post to HR Platform Community</span>
                                            <span className="text-sm text-muted-foreground">
                                                Make this job visible to all applicants in the community
                                            </span>
                                        </div>
                                    </Label>
                                </div>

                                <Alert>
                                    <AlertCircle className="h-4 w-4" />
                                    <AlertDescription>
                                        The job will always be available on your internal portal. Select additional platforms to expand reach.
                                    </AlertDescription>
                                </Alert>

                                <div className="grid grid-cols-2 gap-4">
                                    <Button
                                        onClick={() => setCurrentStep("requirements")}
                                        variant="outline"
                                    >
                                        Back
                                    </Button>
                                    <Button
                                        onClick={handleSubmit}
                                        variant="hero"
                                        size="lg"
                                        className="w-full group"
                                        disabled={submitting}
                                    >
                                        {submitting ? (
                                            <>
                                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                Creating Job...
                                            </>
                                        ) : (
                                            <>
                                                <CheckCircle className="mr-2 h-4 w-4" />
                                                Create Job
                                                <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                                            </>
                                        )}
                                    </Button>
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

export default CreateJob;
