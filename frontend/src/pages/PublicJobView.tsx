import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import {
    Sparkles,
    MapPin,
    DollarSign,
    Briefcase,
    Calendar,
    Building2,
    ArrowRight,
    CheckCircle,
    Globe,
    Users,
    XCircle,
    Upload,
    CheckCircle2,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { publicApi } from "@/services/api";
import { formatFileSize, formatPercentage } from "@/lib/numberFormat";

interface Job {
    id: string;
    title: string;
    description?: string;
    city?: string;
    country?: string;
    salary_range?: string;
    location_type?: string;
    job_level?: string;
    status: string;
    created_at: string;
    user_id: string;
}

interface CompanyProfile {
    id: string;
    email: string;
    full_name?: string;
    company_name?: string;
    company_description?: string;
    company_website?: string;
    company_size?: string;
    industry?: string;
    profile_image_url?: string;
    created_at: string;
}

const PublicJobView = () => {
    const { jobId } = useParams();
    const { toast } = useToast();
    const [job, setJob] = useState<Job | null>(null);
    const [loading, setLoading] = useState(true);
    const [uploadLink, setUploadLink] = useState<string | null>(null);
    const [hasApplied, setHasApplied] = useState(false);
    const [checkingApplication, setCheckingApplication] = useState(true);
    const [companyProfile, setCompanyProfile] = useState<CompanyProfile | null>(null);
    const [linkExpired, setLinkExpired] = useState(false);
    
    // Form state
    const [uploading, setUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [uploadSuccess, setUploadSuccess] = useState(false);
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        phone: "",
    });
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [checkingEmail, setCheckingEmail] = useState(false);

    useEffect(() => {
        if (jobId) {
            fetchJobDetails();
            checkExistingApplication();
        }
    }, [jobId]);

    const checkExistingApplication = async (email?: string) => {
        try {
            // Check if user has already applied using email stored in localStorage or provided email
            const emailToCheck = email || localStorage.getItem(`applied_${jobId}`);
            
            if (emailToCheck && jobId) {
                // Verify the application exists in the database via backend
                const { hasApplied: applied } = await publicApi.checkApplication(jobId, emailToCheck);

                if (applied) {
                    setHasApplied(true);
                    if (!email) {
                        // Only show toast on initial load, not when checking email in real-time
                        toast({
                            title: "Already Applied",
                            description: "You have already submitted an application for this position.",
                        });
                    }
                    return true;
                }
            }
            return false;
        } catch (error) {
            // Error checking existing application
            return false;
        } finally {
            if (!email) {
                setCheckingApplication(false);
            }
        }
    };
    
    // Check email in real-time when user types
    const handleEmailChange = async (email: string) => {
        setFormData({ ...formData, email });
        
        if (email && email.includes('@')) {
            setCheckingEmail(true);
            const hasAppliedResult = await checkExistingApplication(email);
            if (hasAppliedResult) {
                setHasApplied(true);
            } else {
                setHasApplied(false);
            }
            setCheckingEmail(false);
        }
    };

    const fetchJobDetails = async () => {
        try {
            if (!jobId) return;

            // Fetch job details from backend
            const { job: jobData, profile: profileData } = await publicApi.getJob(jobId);

            setJob(jobData);
            if (profileData) {
                setCompanyProfile(profileData);
            }

            // Get or create upload link for this job (backend will create if it doesn't exist)
            try {
                const { link } = await publicApi.getJobLink(jobId);
                if (link && link.link_code) {
                    setUploadLink(link.link_code);
                    
                    // Check if link is expired
                    if (link.expires_at) {
                        const expiryDate = new Date(link.expires_at);
                        const now = new Date();
                        if (now > expiryDate) {
                            setLinkExpired(true);
                        }
                    }
                    
                    // Check if link is marked as expired or inactive
                    if (link.is_expired === true || link.is_active === false) {
                        setLinkExpired(true);
                    }
                }
            } catch (error: any) {
                // Error getting upload link - check if it's because link expired
                if (error.message?.includes('expired') || error.message?.includes('410')) {
                    setLinkExpired(true);
                } else {
                    // If link creation fails, show error but don't block the page
                    toast({
                        title: "Warning",
                        description: "Unable to set up application link. Please try refreshing the page.",
                        variant: "destructive",
                    });
                }
            }
        } catch (error: any) {
            // Error fetching job details
            const errorMessage = error.message || "Failed to load job details";
            
            // Check if it's a 404 (job not found/closed)
            if (errorMessage.includes("not found") || errorMessage.includes("closed") || errorMessage.includes("deadline")) {
                toast({
                    title: "Job Not Available",
                    description: errorMessage,
                    variant: "destructive",
                });
            } else {
                toast({
                    title: "Error",
                    description: errorMessage,
                    variant: "destructive",
                });
            }
            setJob(null);
        } finally {
            setLoading(false);
        }
    };


    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Accept any document type
        if (file.size > 10 * 1024 * 1024) {
            toast({
                title: "File too large",
                description: "File must be smaller than 10MB",
                variant: "destructive",
            });
            return;
        }

        setSelectedFile(file);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Check if already applied
        if (hasApplied) {
            toast({
                title: "Already Applied",
                description: "You have already submitted an application for this position.",
                variant: "destructive",
            });
            return;
        }

        // Check if link is expired
        if (linkExpired) {
            toast({
                title: "Link Expired",
                description: "This application link has expired and is no longer accepting applications.",
                variant: "destructive",
            });
            return;
        }

        if (!uploadLink) {
            toast({
                title: "Error",
                description: "Unable to process application. Please try again.",
                variant: "destructive",
            });
            return;
        }

        // Double-check link is still active before submitting
        const { data: linkCheck } = await supabase
            .from('upload_links')
            .select('is_active, is_expired, max_uploads, current_uploads, upload_count')
            .eq('link_code', uploadLink)
            .single();

        if (!linkCheck) {
            toast({
                title: "Link Not Found",
                description: "This upload link could not be found",
                variant: "destructive",
            });
            setLinkExpired(true);
            return;
        }

        if (linkCheck.is_active === false || linkCheck.is_expired === true) {
            toast({
                title: "Link No Longer Active",
                description: "This upload link has been deactivated or expired",
                variant: "destructive",
            });
            setLinkExpired(true);
            return;
        }

        const currentCount = linkCheck.current_uploads ?? linkCheck.upload_count ?? 0;
        if (linkCheck.max_uploads && currentCount >= linkCheck.max_uploads) {
            toast({
                title: "Upload Limit Reached",
                description: "This upload link has reached its maximum number of uploads",
                variant: "destructive",
            });
            setLinkExpired(true);
            return;
        }

        if (!selectedFile) {
            toast({
                title: "No file selected",
                description: "Please select a CV file to upload",
                variant: "destructive",
            });
            return;
        }

        if (!formData.name || !formData.email) {
            toast({
                title: "Missing information",
                description: "Please fill in all required fields",
                variant: "destructive",
            });
            return;
        }

        // Final check if this email has already applied
        const alreadyApplied = await checkExistingApplication(formData.email);
        if (alreadyApplied) {
            toast({
                title: "Already Applied",
                description: "You have already applied for this position. Each candidate can only apply once per job.",
                variant: "destructive",
            });
            return;
        }

        setUploading(true);
        setUploadProgress(0);

        try {
            // Upload file to storage
            const fileName = `public/${uploadLink}/${Date.now()}_${selectedFile.name}`;
            
            const progressInterval = setInterval(() => {
                setUploadProgress(prev => (prev < 90 ? prev + 10 : prev));
            }, 100);

            // Upload candidate with file via API
            const formDataForUpload = new FormData();
            formDataForUpload.append('file', selectedFile);
            formDataForUpload.append('linkCode', uploadLink);
            formDataForUpload.append('name', formData.name);
            formDataForUpload.append('email', formData.email);
            formDataForUpload.append('phone', formData.phone || '');

            try {
                await publicApi.uploadCandidateWithFile(formDataForUpload);
            } catch (error: any) {
                // Handle specific error cases
                if (error.message?.includes('already applied') || error.message?.includes('409')) {
                    setHasApplied(true);
                    toast({
                        title: "Already Applied",
                        description: "You have already applied for this position. Each candidate can only apply once per job.",
                        variant: "destructive",
                    });
                    throw error;
                } else if (error.message?.includes('expired') || error.message?.includes('410')) {
                    setLinkExpired(true);
                    toast({
                        title: "Link Expired",
                        description: "This upload link has expired and is no longer active.",
                        variant: "destructive",
                    });
                    throw error;
                }
                throw error;
            }

            clearInterval(progressInterval);
            setUploadProgress(100);
            setUploadSuccess(true);
            
            // Store email in localStorage for this job
            if (jobId && formData.email) {
                localStorage.setItem(`applied_${jobId}`, formData.email);
            }
            
            // Mark as applied
            setHasApplied(true);
            
            toast({
                title: "Success!",
                description: "Your CV has been uploaded successfully",
            });

            // Reset form after success
            setTimeout(() => {
                setFormData({ name: "", email: "", phone: "" });
                setSelectedFile(null);
            }, 3000);
        } catch (error: any) {
            console.error("Upload error:", error);
            if (!error.message?.includes('already applied')) {
                toast({
                    title: "Upload failed",
                    description: error.message || "There was an error uploading your CV",
                    variant: "destructive",
                });
            }
        } finally {
            setUploading(false);
        }
    };

    if (loading || checkingApplication) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center">
                <div className="text-center">
                    <Sparkles className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
                    <p className="text-muted-foreground">Loading job details...</p>
                </div>
            </div>
        );
    }

    if (!job) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center">
                <Card className="w-full max-w-md">
                    <CardContent className="pt-6 text-center">
                        <Building2 className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                        <h2 className="text-2xl font-bold mb-2">Job Not Available</h2>
                        <p className="text-muted-foreground">
                            This job posting is no longer accepting applications.
                        </p>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
            {/* Header */}
            <header className="bg-background/95 backdrop-blur-md border-b border-border">
                <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16">
                        <div className="flex items-center space-x-2">
                            <div className="p-2 rounded-lg bg-gradient-to-br from-primary to-accent">
                                <Sparkles className="h-5 w-5 text-primary-foreground" />
                            </div>
                            <span className="text-xl font-bold text-gradient">AI Hiring</span>
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <div className="max-w-4xl mx-auto space-y-6">
                    {/* Job Header */}
                    <Card className="shadow-elegant animate-fade-in">
                        <CardHeader>
                            <div className="space-y-4">
                                <div className="flex items-start justify-between">
                                    <div className="flex items-start gap-4">
                                        {/* Company Logo */}
                                        {companyProfile?.profile_image_url ? (
                                            <img
                                                src={companyProfile.profile_image_url}
                                                alt={companyProfile.company_name || "Company"}
                                                className="w-16 h-16 rounded-lg object-cover border-2 border-border flex-shrink-0"
                                            />
                                        ) : (
                                            <div className="w-16 h-16 rounded-lg bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center border-2 border-border flex-shrink-0">
                                                <Building2 className="h-8 w-8 text-primary" />
                                            </div>
                                        )}
                                        <div className="flex-1">
                                            <CardTitle className="text-3xl mb-1">{job.title}</CardTitle>
                                            {/* Company Name - Prominently Displayed */}
                                            {companyProfile && (
                                                <p className="text-lg text-muted-foreground font-medium mb-2">
                                                    {companyProfile.company_name || companyProfile.full_name || "Company"}
                                                    {companyProfile.industry && (
                                                        <span className="text-muted-foreground/70 font-normal"> • {companyProfile.industry}</span>
                                                    )}
                                                </p>
                                            )}
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <Badge variant="default" className="flex items-center gap-1">
                                                    <Building2 className="h-3 w-3" />
                                                    Now Hiring
                                                </Badge>
                                                {hasApplied && (
                                                    <Badge variant="secondary" className="flex items-center gap-1">
                                                        <CheckCircle className="h-3 w-3" />
                                                        Already Applied
                                                    </Badge>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Quick Info */}
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-4">
                                    {job.city && job.country && (
                                        <div className="flex items-center gap-2 text-muted-foreground">
                                            <MapPin className="h-4 w-4" />
                                            <span>{job.city}, {job.country}</span>
                                        </div>
                                    )}

                                    {job.location_type && (
                                        <div className="flex items-center gap-2 text-muted-foreground">
                                            <Briefcase className="h-4 w-4" />
                                            <span>{job.location_type}</span>
                                        </div>
                                    )}

                                    {job.salary_range && (
                                        <div className="flex items-center gap-2 text-muted-foreground">
                                            <DollarSign className="h-4 w-4" />
                                            <span>{job.salary_range}</span>
                                        </div>
                                    )}

                                    {job.job_level && (
                                        <div className="flex items-center gap-2 text-muted-foreground">
                                            <Badge variant="secondary">{job.job_level}</Badge>
                                        </div>
                                    )}

                                    <div className="flex items-center gap-2 text-muted-foreground">
                                        <Calendar className="h-4 w-4" />
                                        <span>Posted {new Date(job.created_at).toLocaleDateString()}</span>
                                    </div>
                                </div>
                            </div>
                        </CardHeader>
                    </Card>

                    {/* Company Profile */}
                    {companyProfile && (
                        <Card className="shadow-elegant animate-fade-in">
                            <CardHeader>
                                <CardTitle>About the Company</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-6">
                                    {/* Company Header with Logo */}
                                    <div className="flex items-start gap-4">
                                        {companyProfile.profile_image_url ? (
                                            <img
                                                src={companyProfile.profile_image_url}
                                                alt={companyProfile.company_name || "Company"}
                                                className="w-20 h-20 rounded-lg object-cover border-2 border-border"
                                            />
                                        ) : (
                                            <div className="w-20 h-20 rounded-lg bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center border-2 border-border">
                                                <Building2 className="h-10 w-10 text-primary" />
                                            </div>
                                        )}
                                        <div className="flex-1">
                                            <h3 className="text-2xl font-bold mb-1">
                                                {companyProfile.company_name || companyProfile.full_name || "Company"}
                                            </h3>
                                            {companyProfile.industry && (
                                                <p className="text-muted-foreground">
                                                    {companyProfile.industry}
                                                </p>
                                            )}
                                        </div>
                                    </div>

                                    {/* Company Description */}
                                    {companyProfile.company_description && (
                                        <div>
                                            <p className="text-muted-foreground whitespace-pre-wrap">
                                                {companyProfile.company_description}
                                            </p>
                                        </div>
                                    )}

                                    {/* Company Details */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {companyProfile.company_website && (
                                            <div className="flex items-center gap-2 text-muted-foreground">
                                                <Globe className="h-4 w-4" />
                                                <a
                                                    href={companyProfile.company_website}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-primary hover:underline"
                                                >
                                                    {companyProfile.company_website}
                                                </a>
                                            </div>
                                        )}

                                        {companyProfile.company_size && (
                                            <div className="flex items-center gap-2 text-muted-foreground">
                                                <Users className="h-4 w-4" />
                                                <span>{companyProfile.company_size} employees</span>
                                            </div>
                                        )}

                                        {companyProfile.email && (
                                            <div className="flex items-center gap-2 text-muted-foreground">
                                                <Building2 className="h-4 w-4" />
                                                <span>{companyProfile.email}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Job Description */}
                    <Card className="shadow-elegant animate-fade-in-up">
                        <CardHeader>
                            <CardTitle>Job Description</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {job.description ? (
                                <div className="prose prose-sm max-w-none">
                                    <p className="text-muted-foreground whitespace-pre-wrap">
                                        {job.description}
                                    </p>
                                </div>
                            ) : (
                                <p className="text-muted-foreground italic">
                                    No description provided for this position.
                                </p>
                            )}
                        </CardContent>
                    </Card>

                    {/* Apply Section with Embedded Form */}
                    <Card className={`shadow-elegant animate-fade-in-up ${hasApplied ? 'border-2 border-green-500/20' : linkExpired ? 'border-2 border-red-500/20' : 'border-2 border-primary/20'}`}>
                        <CardHeader>
                            <div className="text-center space-y-2">
                                <div className="flex justify-center">
                                    <div className="p-3 rounded-xl bg-gradient-to-br from-primary to-accent">
                                        <Sparkles className="h-8 w-8 text-primary-foreground" />
                                    </div>
                                </div>
                                <CardTitle className="text-3xl">Apply for this Position</CardTitle>
                                <CardDescription className="text-base">
                                    Submit your application by uploading your CV and filling in your details
                                </CardDescription>
                            </div>
                        </CardHeader>
                        <CardContent>
                            {uploadSuccess || hasApplied ? (
                                <div className="text-center py-12 space-y-4 animate-scale-in">
                                    <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto" />
                                    <h3 className="text-2xl font-semibold">Successfully Submitted!</h3>
                                    <p className="text-muted-foreground">
                                        Thank you for your application. Our AI is reviewing your application and we'll get back to you soon!
                                    </p>
                                </div>
                            ) : linkExpired ? (
                                <div className="text-center py-12 space-y-4">
                                    <XCircle className="h-16 w-16 text-red-500 mx-auto" />
                                    <h3 className="text-2xl font-bold">Application Link Expired</h3>
                                    <p className="text-muted-foreground">
                                        This application link has expired and is no longer accepting applications.
                                        Please contact the company directly if you're still interested in this position.
                                    </p>
                                </div>
                            ) : (
                                <form onSubmit={handleSubmit} className="space-y-6">
                                    <div className="space-y-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="name">Full Name *</Label>
                                            <Input
                                                id="name"
                                                value={formData.name}
                                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                                placeholder="John Doe"
                                                required
                                                disabled={hasApplied}
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="email">Email Address *</Label>
                                            <div className="relative">
                                                <Input
                                                    id="email"
                                                    type="email"
                                                    value={formData.email}
                                                    onChange={(e) => handleEmailChange(e.target.value)}
                                                    placeholder="john@example.com"
                                                    required
                                                    disabled={hasApplied}
                                                    className={hasApplied ? "border-green-500" : ""}
                                                />
                                                {checkingEmail && (
                                                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                                        <div className="animate-spin h-4 w-4 border-2 border-primary border-t-transparent rounded-full"></div>
                                                    </div>
                                                )}
                                                {hasApplied && formData.email && (
                                                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                                        <CheckCircle className="h-4 w-4 text-green-500" />
                                                    </div>
                                                )}
                                            </div>
                                            {hasApplied && formData.email && (
                                                <p className="text-sm text-green-600 dark:text-green-400 mt-1">
                                                    You have already applied with this email address.
                                                </p>
                                            )}
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="phone">Phone Number</Label>
                                            <Input
                                                id="phone"
                                                type="tel"
                                                value={formData.phone}
                                                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                                placeholder="+1 (555) 000-0000"
                                                disabled={hasApplied}
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="cv-file">Document File (Any Type) *</Label>
                                        <div className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-primary transition-colors">
                                            <Upload className="h-10 w-10 mx-auto mb-3 text-muted-foreground" />
                                            <input
                                                id="cv-file"
                                                type="file"
                                                accept="*/*"
                                                onChange={handleFileSelect}
                                                className="hidden"
                                                required
                                                disabled={hasApplied}
                                            />
                                            <label htmlFor="cv-file">
                                                <Button 
                                                    type="button" 
                                                    variant="outline" 
                                                    asChild
                                                    disabled={hasApplied}
                                                >
                                                    <span>
                                                        {selectedFile ? selectedFile.name : "Choose File"}
                                                    </span>
                                                </Button>
                                            </label>
                                            {selectedFile && (
                                                <p className="text-sm text-muted-foreground mt-2">
                                                    {formatFileSize(selectedFile.size)}
                                                </p>
                                            )}
                                        </div>
                                    </div>

                                    {uploading && (
                                        <div className="space-y-2">
                                            <Progress value={uploadProgress} />
                                            <p className="text-sm text-center text-muted-foreground">
                                                Uploading... {formatPercentage(uploadProgress)}
                                            </p>
                                        </div>
                                    )}

                                    <Button 
                                        type="submit" 
                                        className="w-full" 
                                        size="lg"
                                        disabled={uploading || hasApplied || linkExpired || !uploadLink}
                                    >
                                        {uploading ? "Uploading..." : hasApplied ? "Already Applied" : "Submit Application"}
                                    </Button>
                                </form>
                            )}
                        </CardContent>
                    </Card>

                    {/* Footer Note */}
                    <div className="text-center text-sm text-muted-foreground pt-4">
                        <p>
                            By applying, you agree to our terms and conditions.
                            We respect your privacy and will keep your information confidential.
                        </p>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default PublicJobView;