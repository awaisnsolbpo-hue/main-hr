import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Sparkles, ArrowLeft, Building2, Save, Loader2, Camera } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { profileApi, storageApi } from "@/services/api";
import DashboardLayout from "@/components/DashboardLayout";

const Profile = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [profile, setProfile] = useState({
    full_name: "",
    email: "",
    profile_picture_url: "",
    company_name: "",
    company_description: "",
    company_website: "",
    company_size: "",
    company_industry: "",
    company_founded_year: "",
    company_email: "",
    company_phone: "",
    company_address: "",
    company_city: "",
    company_country: "",
    company_linkedin_url: "",
    company_instagram_url: "",
    company_facebook_url: "",
    privacy_policy_url: "",
  });

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/login");
        return;
      }

      const { profile } = await profileApi.get();

      if (profile) {
        setProfile({
          full_name: profile.full_name || "",
          email: profile.email || "",
          profile_picture_url: profile.profile_picture_url || "",
          company_name: profile.company_name || "",
          company_description: profile.company_description || "",
          company_website: profile.company_website || "",
          company_size: profile.company_size || "",
          company_industry: profile.company_industry || "",
          company_founded_year: profile.company_founded_year || "",
          company_email: profile.company_email || "",
          company_phone: profile.company_phone || "",
          company_address: profile.company_address || "",
          company_city: profile.company_city || "",
          company_country: profile.company_country || "",
          company_linkedin_url: profile.company_linkedin_url || "",
          company_instagram_url: profile.company_instagram_url || "",
          company_facebook_url: profile.company_facebook_url || "",
          privacy_policy_url: profile.privacy_policy_url || "",
        });
      }
    } catch (error: any) {
      console.error("Error loading profile:", error);
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleProfilePictureUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setUploading(true);
      const file = event.target.files?.[0];
      if (!file) return;

      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast({
          title: "Invalid file type",
          description: "Please upload an image file",
          variant: "destructive",
        });
        return;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "Please upload an image smaller than 5MB",
          variant: "destructive",
        });
        return;
      }

      // Upload file to backend - use profile-photos bucket
      const { publicUrl } = await storageApi.upload(file, 'profile-photos', `${Date.now()}_${file.name}`);

      // Update profile with new picture URL
      await profileApi.update({ profile_picture_url: publicUrl });

      setProfile({ ...profile, profile_picture_url: publicUrl });

      toast({
        title: "Success!",
        description: "Profile picture updated successfully",
      });
    } catch (error: any) {
      console.error("Error uploading profile picture:", error);
      toast({
        title: "Upload Error",
        description: error.message || "Failed to upload profile picture",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
      // Reset the file input
      event.target.value = '';
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const updateData: any = { ...profile };
      
      // Convert founded year to number if provided
      if (updateData.company_founded_year) {
        updateData.company_founded_year = parseInt(updateData.company_founded_year);
      } else {
        updateData.company_founded_year = null;
      }

      await profileApi.update(updateData);

      toast({
        title: "Success!",
        description: "Profile updated successfully",
      });
    } catch (error: any) {
      console.error("Error saving profile:", error);
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const getCompanyInitials = (name?: string) => {
    if (!name) return "CO";
    return name
      .split(" ")
      .map((word) => word[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="min-h-screen bg-[var(--gradient-subtle)] flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-[var(--gradient-subtle)]">
        {/* Main Content */}
        <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="max-w-3xl mx-auto space-y-6">
          <div>
            <h1 className="text-3xl font-bold mb-2">Company Profile</h1>
            <p className="text-muted-foreground">
              Manage your company information and branding
            </p>
          </div>

          {/* Profile Header */}
          <Card className="shadow-elegant">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="relative">
                  <Avatar className="h-20 w-20">
                    {profile.profile_picture_url ? (
                      <AvatarImage src={profile.profile_picture_url} alt={profile.full_name || "Profile"} />
                    ) : null}
                    <AvatarFallback className="bg-gradient-to-br from-primary to-accent text-white text-2xl">
                      {getCompanyInitials(profile.company_name)}
                    </AvatarFallback>
                  </Avatar>
                  <label htmlFor="profile-picture-upload" className="absolute bottom-0 right-0 p-1.5 rounded-full bg-primary text-primary-foreground cursor-pointer hover:bg-primary/90 transition-colors shadow-lg">
                    {uploading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Camera className="h-4 w-4" />
                    )}
                  </label>
                  <input
                    id="profile-picture-upload"
                    type="file"
                    accept="image/*"
                    onChange={handleProfilePictureUpload}
                    disabled={uploading}
                    className="hidden"
                  />
                </div>
                <div>
                  <h2 className="text-xl font-semibold">{profile.company_name || "Your Company"}</h2>
                  <p className="text-sm text-muted-foreground">{profile.email}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Personal Information */}
          <Card className="shadow-elegant">
            <CardHeader>
              <CardTitle>Personal Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="full_name">Full Name</Label>
                  <Input
                    id="full_name"
                    value={profile.full_name}
                    onChange={(e) => setProfile({ ...profile, full_name: e.target.value })}
                    placeholder="Enter your full name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input 
                    id="email"
                    value={profile.email}
                    onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                    placeholder="Enter your email"
                    type="email"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Company Information */}
          <Card className="shadow-elegant">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Company Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="company_name">Company Name *</Label>
                <Input
                  id="company_name"
                  value={profile.company_name}
                  onChange={(e) => setProfile({ ...profile, company_name: e.target.value })}
                  placeholder="Enter your company name"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="company_description">Company Description</Label>
                <Textarea
                  id="company_description"
                  value={profile.company_description}
                  onChange={(e) => setProfile({ ...profile, company_description: e.target.value })}
                  placeholder="Tell candidates about your company..."
                  rows={4}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="company_website">Website</Label>
                  <Input
                    id="company_website"
                    value={profile.company_website}
                    onChange={(e) => setProfile({ ...profile, company_website: e.target.value })}
                    placeholder="https://example.com"
                    type="url"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="company_industry">Industry</Label>
                  <Input
                    id="company_industry"
                    value={profile.company_industry}
                    onChange={(e) => setProfile({ ...profile, company_industry: e.target.value })}
                    placeholder="e.g., Technology, Healthcare"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="company_size">Company Size</Label>
                  <Input
                    id="company_size"
                    value={profile.company_size}
                    onChange={(e) => setProfile({ ...profile, company_size: e.target.value })}
                    placeholder="e.g., 1-10, 11-50, 50+"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="company_founded_year">Founded Year</Label>
                  <Input
                    id="company_founded_year"
                    value={profile.company_founded_year}
                    onChange={(e) => setProfile({ ...profile, company_founded_year: e.target.value })}
                    placeholder="e.g., 2020"
                    type="number"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="privacy_policy_url">Privacy Policy URL</Label>
                <Input
                  id="privacy_policy_url"
                  value={profile.privacy_policy_url}
                  onChange={(e) => setProfile({ ...profile, privacy_policy_url: e.target.value })}
                  placeholder="https://example.com/privacy"
                  type="url"
                />
              </div>
            </CardContent>
          </Card>

          {/* Contact Information */}
          <Card className="shadow-elegant">
            <CardHeader>
              <CardTitle>Contact Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="company_email">Company Email</Label>
                  <Input
                    id="company_email"
                    value={profile.company_email}
                    onChange={(e) => setProfile({ ...profile, company_email: e.target.value })}
                    placeholder="contact@company.com"
                    type="email"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="company_phone">Company Phone</Label>
                  <Input
                    id="company_phone"
                    value={profile.company_phone}
                    onChange={(e) => setProfile({ ...profile, company_phone: e.target.value })}
                    placeholder="+1 234 567 8900"
                    type="tel"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="company_address">Address</Label>
                <Input
                  id="company_address"
                  value={profile.company_address}
                  onChange={(e) => setProfile({ ...profile, company_address: e.target.value })}
                  placeholder="Street address"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="company_city">City</Label>
                  <Input
                    id="company_city"
                    value={profile.company_city}
                    onChange={(e) => setProfile({ ...profile, company_city: e.target.value })}
                    placeholder="City"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="company_country">Country</Label>
                  <Input
                    id="company_country"
                    value={profile.company_country}
                    onChange={(e) => setProfile({ ...profile, company_country: e.target.value })}
                    placeholder="Country"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Social Media */}
          <Card className="shadow-elegant">
            <CardHeader>
              <CardTitle>Social Media</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="company_linkedin_url">LinkedIn URL</Label>
                <Input
                  id="company_linkedin_url"
                  value={profile.company_linkedin_url}
                  onChange={(e) => setProfile({ ...profile, company_linkedin_url: e.target.value })}
                  placeholder="https://linkedin.com/company/..."
                  type="url"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="company_instagram_url">Instagram URL</Label>
                  <Input
                    id="company_instagram_url"
                    value={profile.company_instagram_url}
                    onChange={(e) => setProfile({ ...profile, company_instagram_url: e.target.value })}
                    placeholder="https://instagram.com/..."
                    type="url"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="company_facebook_url">Facebook URL</Label>
                  <Input
                    id="company_facebook_url"
                    value={profile.company_facebook_url}
                    onChange={(e) => setProfile({ ...profile, company_facebook_url: e.target.value })}
                    placeholder="https://facebook.com/..."
                    type="url"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Save Button */}
          <div className="flex justify-end gap-4">
            <Button 
              variant="outline" 
              onClick={() => navigate("/recruiter/dashboard")}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleSave} 
              disabled={saving} 
              size="lg"
              className="min-w-[150px]"
            >
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save Changes
                </>
              )}
            </Button>
          </div>
        </div>
      </main>
    </div>
    </DashboardLayout>
  );
};

export default Profile;