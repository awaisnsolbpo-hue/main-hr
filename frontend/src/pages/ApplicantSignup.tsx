import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Sparkles, ArrowRight, ArrowLeft, Eye, EyeOff, Upload, FileText, CheckCircle2, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { authApi, applicantsApi } from "@/services/api";
import { formatFileSize } from "@/lib/numberFormat";

type Step = 1 | 2 | 3 | 4;

const ApplicantSignup = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState<Step>(1);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [cvFile, setCvFile] = useState<File | null>(null);
  const [cvUploading, setCvUploading] = useState(false);
  const [cvUrl, setCvUrl] = useState<string>("");

  const [formData, setFormData] = useState({
    // Step 1: Basic Info
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
    
    // Step 2: Professional Info
    profession: "",
    industry: "",
    experienceLevel: "mid" as "entry" | "mid" | "senior" | "executive",
    
    // Step 3: CV (handled separately)
    
    // Step 4: Additional Info
    phone: "",
    bio: "",
    location: "",
    city: "",
    country: "",
    skills: [] as string[],
  });

  const [newSkill, setNewSkill] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const totalSteps = 4;
  const progress = (currentStep / totalSteps) * 100;

  const validateStep = (step: Step): boolean => {
    const newErrors: Record<string, string> = {};

    if (step === 1) {
      if (!formData.firstName.trim()) newErrors.firstName = "First name is required";
      if (!formData.lastName.trim()) newErrors.lastName = "Last name is required";
      if (!formData.email.trim()) newErrors.email = "Email is required";
      else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
        newErrors.email = "Invalid email format";
      }
      if (!formData.password) newErrors.password = "Password is required";
      else if (formData.password.length < 8) {
        newErrors.password = "Password must be at least 8 characters";
      }
      if (formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = "Passwords do not match";
      }
    }

    if (step === 2) {
      if (!formData.profession.trim()) newErrors.profession = "Profession is required";
      if (!formData.industry.trim()) newErrors.industry = "Industry is required";
    }

    if (step === 3) {
      if (!cvFile && !cvUrl) {
        newErrors.cv = "CV upload is required";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      if (currentStep < totalSteps) {
        setCurrentStep((prev) => (prev + 1) as Step);
      } else {
        handleSubmit();
      }
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => (prev - 1) as Step);
    }
  };

  const handleAddSkill = () => {
    if (newSkill.trim() && !formData.skills.includes(newSkill.trim())) {
      setFormData({
        ...formData,
        skills: [...formData.skills, newSkill.trim()],
      });
      setNewSkill("");
    }
  };

  const handleRemoveSkill = (skill: string) => {
    setFormData({
      ...formData,
      skills: formData.skills.filter((s) => s !== skill),
    });
  };

  const handleCvUpload = async (file: File) => {
    if (file.type !== "application/pdf") {
      toast({
        title: "Invalid file type",
        description: "Please upload a PDF file",
        variant: "destructive",
      });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "CV must be less than 5MB",
        variant: "destructive",
      });
      return;
    }

    setCvUploading(true);
    setCvFile(file);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        // User not logged in yet, will upload after signup
        setCvFile(file);
        setCvUploading(false);
        return;
      }

      const fileExt = file.name.split(".").pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;

      const { data, error } = await supabase.storage
        .from("applicant-cv")
        .upload(fileName, file, {
          cacheControl: "3600",
          upsert: false,
        });

      if (error) throw error;

      const { data: { publicUrl } } = supabase.storage
        .from("applicant-cv")
        .getPublicUrl(fileName);

      setCvUrl(publicUrl);
      toast({
        title: "CV uploaded successfully",
        description: "Your CV has been uploaded",
      });
    } catch (error: any) {
      toast({
        title: "Upload failed",
        description: error.message || "Failed to upload CV",
        variant: "destructive",
      });
    } finally {
      setCvUploading(false);
    }
  };

  const handleSubmit = async () => {
    if (!validateStep(4)) return;

    setLoading(true);

    try {
      // Step 1: Upload CV if not already uploaded (need user ID, so do this after signup)
      let finalCvUrl = cvUrl;
      let cvFileName = cvFile?.name || null;

      // Step 2: Use API to sign up - this creates auth user, applicant profile, and role
      const signupResponse = await authApi.signupApplicant({
        email: formData.email,
        password: formData.password,
        firstName: formData.firstName,
        lastName: formData.lastName,
        phone: formData.phone || undefined,
        profession: formData.profession,
        industry: formData.industry || undefined,
        experienceLevel: formData.experienceLevel,
        bio: formData.bio || undefined,
        location: formData.location || undefined,
        city: formData.city || undefined,
        country: formData.country || undefined,
        skills: formData.skills,
        cvUrl: finalCvUrl || undefined,
        cvFileName: cvFileName || undefined,
      });

      // Step 3: If CV wasn't uploaded before, upload it now via backend API
      if (cvFile && !cvUrl) {
        // Get user ID from auth after signup
        const { data: { user } } = await supabase.auth.getUser();
        
        if (user) {
          // Get applicant profile to get applicant ID
          try {
            const applicantProfile = await applicantsApi.getMyProfile();
            if (applicantProfile.applicant?.id) {
              // Use uploadCV API endpoint
              await applicantsApi.uploadCV(applicantProfile.applicant.id, cvFile);
            }
          } catch (cvError) {
            console.error("Error uploading CV:", cvError);
            // Non-critical error, continue with signup
          }
        }
      }

      // Step 4: Sign in the user after signup
      const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password,
      });

      if (loginError) throw loginError;

      // STRICT: Verify applicant role before redirecting
      try {
        const userData = await authApi.getMe();
        
        if (userData.role === "applicant") {
          toast({
            title: "Account created!",
            description: "Welcome! Redirecting to your dashboard...",
          });

          // STRICT: Only redirect to applicant dashboard
          setTimeout(() => {
            navigate("/applicant/dashboard", { replace: true });
          }, 1500);
        } else {
          throw new Error("Role verification failed. Please contact support.");
        }
      } catch (roleError: any) {
        console.error("Role verification error:", roleError);
        toast({
          title: "Account created but verification failed",
          description: "Please log in manually.",
          variant: "destructive",
        });
        navigate("/applicant/login", { replace: true });
      }
    } catch (error: any) {
      toast({
        title: "Signup failed",
        description: error.message || "Failed to create account",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-background to-muted/20">
      <div className="w-full max-w-2xl">
        <Card className="shadow-xl">
          <CardHeader>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <div className="p-2 rounded-lg bg-gradient-to-br from-primary to-accent">
                  <Sparkles className="h-5 w-5 text-white" />
                </div>
                <span className="text-xl font-bold">Applicant Signup</span>
              </div>
              <Link to="/">
                <Button variant="ghost" size="sm">Cancel</Button>
              </Link>
            </div>
            <Progress value={progress} className="h-2" />
            <p className="text-sm text-muted-foreground mt-2">
              Step {currentStep} of {totalSteps}
            </p>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Step 1: Basic Info */}
            {currentStep === 1 && (
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold mb-4">Basic Information</h3>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="firstName">First Name *</Label>
                      <Input
                        id="firstName"
                        value={formData.firstName}
                        onChange={(e) =>
                          setFormData({ ...formData, firstName: e.target.value })
                        }
                        className={errors.firstName ? "border-red-500" : ""}
                      />
                      {errors.firstName && (
                        <p className="text-xs text-red-500">{errors.firstName}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="lastName">Last Name *</Label>
                      <Input
                        id="lastName"
                        value={formData.lastName}
                        onChange={(e) =>
                          setFormData({ ...formData, lastName: e.target.value })
                        }
                        className={errors.lastName ? "border-red-500" : ""}
                      />
                      {errors.lastName && (
                        <p className="text-xs text-red-500">{errors.lastName}</p>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2 mt-4">
                    <Label htmlFor="email">Email *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) =>
                        setFormData({ ...formData, email: e.target.value })
                      }
                      className={errors.email ? "border-red-500" : ""}
                    />
                    {errors.email && (
                      <p className="text-xs text-red-500">{errors.email}</p>
                    )}
                  </div>

                  <div className="space-y-2 mt-4">
                    <Label htmlFor="password">Password *</Label>
                    <div className="relative">
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        value={formData.password}
                        onChange={(e) =>
                          setFormData({ ...formData, password: e.target.value })
                        }
                        className={errors.password ? "border-red-500" : ""}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2"
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    {errors.password && (
                      <p className="text-xs text-red-500">{errors.password}</p>
                    )}
                  </div>

                  <div className="space-y-2 mt-4">
                    <Label htmlFor="confirmPassword">Confirm Password *</Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      value={formData.confirmPassword}
                      onChange={(e) =>
                        setFormData({ ...formData, confirmPassword: e.target.value })
                      }
                      className={errors.confirmPassword ? "border-red-500" : ""}
                    />
                    {errors.confirmPassword && (
                      <p className="text-xs text-red-500">{errors.confirmPassword}</p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Professional Info */}
            {currentStep === 2 && (
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold mb-4">Professional Information</h3>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="profession">Profession *</Label>
                      <Input
                        id="profession"
                        placeholder="e.g., Software Engineer, Marketing Manager"
                        value={formData.profession}
                        onChange={(e) =>
                          setFormData({ ...formData, profession: e.target.value })
                        }
                        className={errors.profession ? "border-red-500" : ""}
                      />
                      {errors.profession && (
                        <p className="text-xs text-red-500">{errors.profession}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="industry">Industry *</Label>
                      <Input
                        id="industry"
                        placeholder="e.g., Technology, Finance, Healthcare"
                        value={formData.industry}
                        onChange={(e) =>
                          setFormData({ ...formData, industry: e.target.value })
                        }
                        className={errors.industry ? "border-red-500" : ""}
                      />
                      {errors.industry && (
                        <p className="text-xs text-red-500">{errors.industry}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="experienceLevel">Experience Level *</Label>
                      <Select
                        value={formData.experienceLevel}
                        onValueChange={(value: "entry" | "mid" | "senior" | "executive") =>
                          setFormData({ ...formData, experienceLevel: value })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="entry">Entry Level</SelectItem>
                          <SelectItem value="mid">Mid Level</SelectItem>
                          <SelectItem value="senior">Senior</SelectItem>
                          <SelectItem value="executive">Executive</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: CV Upload */}
            {currentStep === 3 && (
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold mb-4">Upload Your CV</h3>
                  <div className="space-y-4">
                    {!cvFile && !cvUrl ? (
                      <div className="border-2 border-dashed rounded-lg p-8 text-center">
                        <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                        <Label htmlFor="cv-upload" className="cursor-pointer">
                          <Input
                            id="cv-upload"
                            type="file"
                            accept=".pdf"
                            className="hidden"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) handleCvUpload(file);
                            }}
                          />
                          <Button variant="outline" asChild>
                            <span>Choose PDF File</span>
                          </Button>
                        </Label>
                        <p className="text-sm text-muted-foreground mt-2">
                          PDF only, max 5MB
                        </p>
                        {errors.cv && (
                          <p className="text-xs text-red-500 mt-2">{errors.cv}</p>
                        )}
                      </div>
                    ) : (
                      <div className="border rounded-lg p-4 flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <FileText className="h-8 w-8 text-primary" />
                          <div>
                            <p className="font-medium">{cvFile?.name || "CV uploaded"}</p>
                            <p className="text-sm text-muted-foreground">
                              {cvFile ? formatFileSize(cvFile.size) : "Ready"}
                            </p>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setCvFile(null);
                            setCvUrl("");
                          }}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    )}

                    {cvUploading && (
                      <Alert>
                        <AlertDescription>Uploading CV...</AlertDescription>
                      </Alert>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Step 4: Additional Info */}
            {currentStep === 4 && (
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold mb-4">Additional Information</h3>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone Number</Label>
                      <Input
                        id="phone"
                        type="tel"
                        value={formData.phone}
                        onChange={(e) =>
                          setFormData({ ...formData, phone: e.target.value })
                        }
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="bio">Bio</Label>
                      <Textarea
                        id="bio"
                        rows={4}
                        placeholder="Tell us about yourself..."
                        value={formData.bio}
                        onChange={(e) =>
                          setFormData({ ...formData, bio: e.target.value })
                        }
                      />
                    </div>

                    <div className="grid md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="location">Location</Label>
                        <Input
                          id="location"
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
                          value={formData.country}
                          onChange={(e) =>
                            setFormData({ ...formData, country: e.target.value })
                          }
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Skills</Label>
                      <div className="flex gap-2">
                        <Input
                          placeholder="Add a skill..."
                          value={newSkill}
                          onChange={(e) => setNewSkill(e.target.value)}
                          onKeyPress={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              handleAddSkill();
                            }
                          }}
                        />
                        <Button type="button" onClick={handleAddSkill} variant="outline">
                          Add
                        </Button>
                      </div>
                      {formData.skills.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-2">
                          {formData.skills.map((skill) => (
                            <div
                              key={skill}
                              className="flex items-center gap-1 px-3 py-1 bg-primary/10 rounded-full text-sm"
                            >
                              {skill}
                              <button
                                type="button"
                                onClick={() => handleRemoveSkill(skill)}
                                className="ml-1 hover:text-red-500"
                              >
                                <X className="h-3 w-3" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex justify-between pt-4">
              <Button
                variant="outline"
                onClick={handleBack}
                disabled={currentStep === 1}
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Button>
              <Button
                variant="hero"
                onClick={handleNext}
                disabled={loading || cvUploading}
              >
                {currentStep === totalSteps ? (
                  loading ? (
                    "Creating Account..."
                  ) : (
                    "Create Account"
                  )
                ) : (
                  <>
                    Next
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            </div>

            <div className="text-center text-sm text-muted-foreground">
              Already have an account?{" "}
              <Link to="/applicant/login" className="text-primary hover:underline">
                Log in
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ApplicantSignup;

