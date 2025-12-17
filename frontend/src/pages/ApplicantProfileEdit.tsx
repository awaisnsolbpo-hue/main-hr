import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { applicantsApi } from "@/services/api";
import { useUserRoleAndProfile } from "@/hooks/useUserRoleAndProfile";
import { ArrowLeft, Save, Loader2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

const ApplicantProfileEdit = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, applicantProfile, loading: profileLoading } = useUserRoleAndProfile(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    profession: "",
    industry: "",
    location: "",
    experience_level: "",
    skills: [] as string[],
    bio: "",
  });
  const [skillsInput, setSkillsInput] = useState("");

  useEffect(() => {
    if (applicantProfile) {
      setFormData({
        first_name: applicantProfile.first_name || "",
        last_name: applicantProfile.last_name || "",
        email: applicantProfile.email || "",
        phone: applicantProfile.phone || "",
        profession: applicantProfile.profession || "",
        industry: applicantProfile.industry || "",
        location: applicantProfile.location || "",
        experience_level: applicantProfile.experience_level || "",
        skills: applicantProfile.skills || [],
        bio: applicantProfile.bio || "",
      });
      setSkillsInput((applicantProfile.skills || []).join(", "));
    }
  }, [applicantProfile]);

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSkillsChange = (value: string) => {
    setSkillsInput(value);
    const skillsArray = value
      .split(",")
      .map(s => s.trim())
      .filter(s => s.length > 0);
    setFormData(prev => ({ ...prev, skills: skillsArray }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!applicantProfile?.id) {
      toast({
        title: "Error",
        description: "Profile not found. Please try again.",
        variant: "destructive",
      });
      return;
    }

    const oldEmail = applicantProfile.email;
    const newEmail = formData.email.trim();

    // Validate email
    if (!newEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newEmail)) {
      toast({
        title: "Validation Error",
        description: "Please enter a valid email address.",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);

    try {
      const updateData: any = {
        first_name: formData.first_name.trim(),
        last_name: formData.last_name.trim(),
        email: newEmail,
        phone: formData.phone.trim() || null,
        profession: formData.profession.trim() || null,
        industry: formData.industry.trim() || null,
        location: formData.location.trim() || null,
        experience_level: formData.experience_level || null,
        skills: formData.skills,
        bio: formData.bio.trim() || null,
      };

      const response = await applicantsApi.updateProfile(applicantProfile.id, updateData);

      if (response) {
        toast({
          title: "Profile Updated",
          description: newEmail !== oldEmail 
            ? "Your profile has been updated. Your email has been changed across all your records."
            : "Your profile has been updated successfully.",
        });
        
        // Navigate back to dashboard after a short delay
        setTimeout(() => {
          navigate("/applicant/dashboard");
        }, 1500);
      }
    } catch (error: any) {
      console.error("Error updating profile:", error);
      toast({
        title: "Update Failed",
        description: error?.message || "Failed to update profile. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-secondary/20">
        <Card className="max-w-md w-full shadow-xl border-2 border-border/60 bg-card/95 backdrop-blur-xl">
          <CardContent className="pt-6 text-center space-y-4">
            <p className="text-foreground/80 font-semibold">Please log in to edit your profile</p>
            <Button onClick={() => navigate("/applicant/login")} className="bg-gradient-to-r from-primary to-accent hover:opacity-90">
              Log In
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (profileLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/20">
        <div className="container mx-auto px-4 py-8">
          <Skeleton className="h-12 w-64 mb-6" />
          <Card className="max-w-4xl mx-auto">
            <CardContent className="pt-6 space-y-6">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-32 w-full" />
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/20">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/applicant/dashboard")}
              className="hover:bg-accent"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Dashboard
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-foreground">Edit Profile</h1>
              <p className="text-sm text-foreground/80 mt-1">Update your personal information and preferences</p>
            </div>
          </div>

          <form onSubmit={handleSubmit}>
            <Card className="shadow-xl border-2 border-border/60 bg-card/95 backdrop-blur-xl">
              <CardHeader>
                <CardTitle>Personal Information</CardTitle>
                <CardDescription>Update your basic information</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="first_name">First Name *</Label>
                    <Input
                      id="first_name"
                      value={formData.first_name}
                      onChange={(e) => handleInputChange("first_name", e.target.value)}
                      placeholder="Enter your first name"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="last_name">Last Name *</Label>
                    <Input
                      id="last_name"
                      value={formData.last_name}
                      onChange={(e) => handleInputChange("last_name", e.target.value)}
                      placeholder="Enter your last name"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email Address *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange("email", e.target.value)}
                    placeholder="Enter your email address"
                    required
                  />
                  <p className="text-xs text-foreground/70">
                    Changing your email will update it across all your applications and records.
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => handleInputChange("phone", e.target.value)}
                    placeholder="Enter your phone number"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="location">Location</Label>
                  <Input
                    id="location"
                    value={formData.location}
                    onChange={(e) => handleInputChange("location", e.target.value)}
                    placeholder="City, Country"
                  />
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-xl border-2 border-border/60 bg-card/95 backdrop-blur-xl mt-6">
              <CardHeader>
                <CardTitle>Professional Information</CardTitle>
                <CardDescription>Update your professional details</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="profession">Profession</Label>
                    <Input
                      id="profession"
                      value={formData.profession}
                      onChange={(e) => handleInputChange("profession", e.target.value)}
                      placeholder="e.g., Software Engineer"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="industry">Industry</Label>
                    <Input
                      id="industry"
                      value={formData.industry}
                      onChange={(e) => handleInputChange("industry", e.target.value)}
                      placeholder="e.g., Technology"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="experience_level">Experience Level</Label>
                  <select
                    id="experience_level"
                    value={formData.experience_level}
                    onChange={(e) => handleInputChange("experience_level", e.target.value)}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <option value="">Select experience level</option>
                    <option value="entry">Entry Level</option>
                    <option value="mid">Mid Level</option>
                    <option value="senior">Senior Level</option>
                    <option value="executive">Executive Level</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="skills">Skills</Label>
                  <Input
                    id="skills"
                    value={skillsInput}
                    onChange={(e) => handleSkillsChange(e.target.value)}
                    placeholder="Enter skills separated by commas (e.g., JavaScript, React, Node.js)"
                  />
                  <p className="text-xs text-foreground/70">
                    Separate multiple skills with commas
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bio">Bio</Label>
                  <Textarea
                    id="bio"
                    value={formData.bio}
                    onChange={(e) => handleInputChange("bio", e.target.value)}
                    placeholder="Tell us about yourself..."
                    rows={4}
                  />
                </div>
              </CardContent>
            </Card>

            <div className="flex justify-end gap-4 mt-6">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate("/applicant/dashboard")}
                disabled={saving}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={saving}
                className="bg-gradient-to-r from-primary to-accent hover:opacity-90"
              >
                {saving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Save Changes
                  </>
                )}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ApplicantProfileEdit;

