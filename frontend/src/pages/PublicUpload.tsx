import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Upload, Sparkles, CheckCircle2, XCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { publicApi, storageApi } from "@/services/api";
import { formatFileSize, formatPercentage } from "@/lib/numberFormat";

const PublicUpload = () => {
  const { linkCode } = useParams();
  const { toast } = useToast();
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [linkValid, setLinkValid] = useState<boolean | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // Check if link is valid and active when component mounts
  useEffect(() => {
    const checkLinkValidity = async () => {
      if (!linkCode) {
        setLinkValid(false);
        return;
      }

      try {
        // Get upload link via API
        const response = await publicApi.getUploadLink(linkCode);
        const linkData = response.link;

        console.log("Link data:", linkData); // Debug log

        // Check if link is expired by date
        if (linkData.expires_at) {
          const expiryDate = new Date(linkData.expires_at);
          const now = new Date();
          if (now > expiryDate) {
            setLinkValid(false);
            toast({
              title: "Link Expired",
              description: "This upload link has expired",
              variant: "destructive",
            });
            return;
          }
        }

        // Check if link is marked as expired
        if (linkData.is_expired === true || response.expired === true) {
          setLinkValid(false);
          toast({
            title: "Link Expired",
            description: "This upload link has expired",
            variant: "destructive",
          });
          return;
        }

        // Check if link is inactive
        if (linkData.is_active === false) {
          setLinkValid(false);
          toast({
            title: "Link Inactive",
            description: "This upload link is no longer active. It may have been used already.",
            variant: "destructive",
          });
          return;
        }

        // Check max uploads - use whichever column exists
        const currentCount = linkData.current_uploads ?? linkData.upload_count ?? 0;
        if (linkData.max_uploads && currentCount >= linkData.max_uploads) {
          setLinkValid(false);
          toast({
            title: "Upload Limit Reached",
            description: "This upload link has reached its maximum number of uploads",
            variant: "destructive",
          });
          return;
        }

        setLinkValid(true);
      } catch (error) {
        console.error("Error checking link validity:", error);
        setLinkValid(false);
      }
    };

    checkLinkValidity();
  }, [linkCode, toast]);

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

    // Double-check link is still active before submitting
    const { data: linkCheck } = await supabase
      .from('upload_links')
      .select('is_active, is_expired, max_uploads, current_uploads, upload_count')
      .eq('link_code', linkCode)
      .single();

    if (!linkCheck) {
      toast({
        title: "Link Not Found",
        description: "This upload link could not be found",
        variant: "destructive",
      });
      setLinkValid(false);
      return;
    }

    if (linkCheck.is_active === false || linkCheck.is_expired === true) {
      toast({
        title: "Link No Longer Active",
        description: "This upload link has been deactivated or expired",
        variant: "destructive",
      });
      setLinkValid(false);
      return;
    }

    const currentCount = linkCheck.current_uploads ?? linkCheck.upload_count ?? 0;
    if (linkCheck.max_uploads && currentCount >= linkCheck.max_uploads) {
      toast({
        title: "Upload Limit Reached",
        description: "This upload link has reached its maximum number of uploads",
        variant: "destructive",
      });
      setLinkValid(false);
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

    setUploading(true);
    setUploadProgress(0);

    try {
      // Upload file to storage
      const fileName = `public/${linkCode}/${Date.now()}_${selectedFile.name}`;
      
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => (prev < 90 ? prev + 10 : prev));
      }, 100);

      // Upload candidate with file via API
      const formDataForUpload = new FormData();
      formDataForUpload.append('file', selectedFile);
      formDataForUpload.append('linkCode', linkCode!);
      formDataForUpload.append('name', formData.name);
      formDataForUpload.append('email', formData.email);
      formDataForUpload.append('phone', formData.phone || '');

      try {
        await publicApi.uploadCandidateWithFile(formDataForUpload);
        
        // Mark link as invalid after successful upload
        setLinkValid(false);
      } catch (error: any) {
        // Handle specific error cases
        if (error.message?.includes('already applied') || error.message?.includes('409')) {
          toast({
            title: "Already Applied",
            description: "You have already applied for this position. Each candidate can only apply once per job.",
            variant: "destructive",
          });
          setLinkValid(false);
          throw error;
        } else if (error.message?.includes('expired') || error.message?.includes('410')) {
          toast({
            title: "Link Expired",
            description: "This upload link has expired and is no longer active.",
            variant: "destructive",
          });
          setLinkValid(false);
          throw error;
        }
        throw error;
      }

      setUploadProgress(100);
      setUploadSuccess(true);
      
      // Store email in localStorage for this job (if jobId is available)
      const jobId = sessionStorage.getItem('applying_job_id');
      if (jobId && formData.email) {
        localStorage.setItem(`applied_${jobId}`, formData.email);
      }
      
      toast({
        title: "Success!",
        description: "Your CV has been uploaded successfully",
      });

      // Reset form
      setTimeout(() => {
        setFormData({ name: "", email: "", phone: "" });
        setSelectedFile(null);
        setUploadSuccess(false);
        setUploadProgress(0);
      }, 3000);
    } catch (error: any) {
      console.error("Upload error:", error);
      toast({
        title: "Upload failed",
        description: error.message || "There was an error uploading your CV",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  // Show loading state while checking link validity
  if (linkValid === null) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center p-4">
        <Card className="w-full max-w-lg shadow-elegant">
          <CardContent className="py-12 text-center">
            <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto"></div>
            <p className="mt-4 text-muted-foreground">Verifying upload link...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show error if link is invalid or inactive
  if (linkValid === false) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center p-4">
        <Card className="w-full max-w-lg shadow-elegant">
          <CardHeader className="text-center space-y-4">
            <div className="flex justify-center">
              <div className="p-3 rounded-xl bg-destructive/10">
                <XCircle className="h-8 w-8 text-destructive" />
              </div>
            </div>
            <CardTitle className="text-3xl">Invalid Link</CardTitle>
            <CardDescription className="text-base">
              This upload link is either invalid or no longer active. Please contact the organization for a new link.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center p-4">
      <Card className="w-full max-w-lg shadow-elegant animate-fade-in">
        <CardHeader className="text-center space-y-4">
          <div className="flex justify-center">
            <div className="p-3 rounded-xl bg-gradient-to-br from-primary to-accent">
              <Sparkles className="h-8 w-8 text-primary-foreground" />
            </div>
          </div>
          <CardTitle className="text-3xl">Upload Your CV</CardTitle>
          <CardDescription className="text-base">
            Submit your application by uploading your CV and filling in your details
          </CardDescription>
        </CardHeader>

        <CardContent>
          {uploadSuccess ? (
            <div className="text-center py-12 space-y-4 animate-scale-in">
              <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto" />
              <h3 className="text-2xl font-semibold">Successfully Submitted!</h3>
              <p className="text-muted-foreground">
                Thank you for your application. We'll be in touch soon.
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
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email Address *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="john@example.com"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+1 (555) 000-0000"
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
                  />
                  <label htmlFor="cv-file">
                    <Button type="button" variant="outline" asChild>
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
                disabled={uploading}
              >
                {uploading ? "Uploading..." : "Submit Application"}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default PublicUpload;