import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent } from "@/components/ui/card";
import { Upload, X, FileText, CheckCircle2, AlertCircle, Loader2, Trash2, User, Mail, MapPin, Briefcase, BookOpen } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { formatFileSize } from "@/lib/numberFormat";

interface FileUploadModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    jobId: string;
}

interface ExtractedCandidate {
    first_name: string;
    last_name: string;
    email: string;
    phone?: string;
    location?: string;
    skills?: string[];
    experience_years?: number;
    education?: {
        degree: string;
        field: string;
        school?: string;
    };
    full_name?: string;
}

export const FileUploadModal = ({ open, onOpenChange, jobId }: FileUploadModalProps) => {
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [uploading, setUploading] = useState(false);
    const [uploadSuccess, setUploadSuccess] = useState(false);
    const [uploadedCount, setUploadedCount] = useState(0);
    const [dragActive, setDragActive] = useState(false);
    const [uploadError, setUploadError] = useState("");
    const { toast } = useToast();

    const handleDrag = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === "dragenter" || e.type === "dragover") {
            setDragActive(true);
        } else if (e.type === "dragleave") {
            setDragActive(false);
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
        const files = e.dataTransfer.files;
        if (files && files[0]) {
            validateAndSetFile(files[0]);
        }
    };

    const validateAndSetFile = (file: File) => {
        // Accept any document type
        // Common document extensions
        const allowedExtensions = [
            '.pdf', '.doc', '.docx', '.txt', '.rtf',
            '.odt', '.pages', '.wps', '.xls', '.xlsx',
            '.ppt', '.pptx', '.csv', '.html', '.htm'
        ];
        
        const ext = file.name.substring(file.name.lastIndexOf(".")).toLowerCase();

        // Allow any file type, but warn if it's not a common document type
        if (file.size > 10 * 1024 * 1024) {
            setUploadError("File size exceeds 10MB limit");
            toast({
                title: "File Too Large",
                description: "Maximum file size is 10MB",
                variant: "destructive",
            });
            return;
        }

        setSelectedFile(file);
        setUploadSuccess(false);
        setUploadError("");
    };

    const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            validateAndSetFile(e.target.files[0]);
        }
    };

    const handleUpload = async () => {
        if (!selectedFile || !jobId) {
            toast({
                title: "Missing Information",
                description: "Please select a file",
                variant: "destructive",
            });
            return;
        }

        setUploading(true);
        setUploadError("");

        try {
            const { data: { session } } = await supabase.auth.getSession();

            if (!session) {
                throw new Error("Not authenticated");
            }

            const formData = new FormData();
            formData.append("cv", selectedFile);
            formData.append("job_id", jobId);

            const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api';
            const response = await fetch(
                `${apiBaseUrl}/candidates/upload`,
                {
                    method: "POST",
                    headers: {
                        Authorization: `Bearer ${session.access_token}`,
                    },
                    body: formData,
                }
            );

            const data = await response.json();

            if (!response.ok) {
                setUploadError(data.error || "Failed to upload CV");
                toast({
                    title: "Upload Failed",
                    description: data.error || "Failed to upload CV",
                    variant: "destructive",
                });
                return;
            }

            setUploadedCount(uploadedCount + 1);
            setUploadSuccess(true);
            toast({
                title: "File Uploaded!",
                description: `File "${selectedFile.name}" has been uploaded and sent to webhook successfully`,
            });

            // Reset form after 3 seconds
            setTimeout(() => {
                setSelectedFile(null);
                setUploadSuccess(false);
            }, 3000);
        } catch (error: any) {
            const errorMsg = error.message || "Failed to upload CV";
            setUploadError(errorMsg);
            toast({
                title: "Upload Failed",
                description: errorMsg,
                variant: "destructive",
            });
        } finally {
            setUploading(false);
        }
    };

    const handleClose = () => {
        setSelectedFile(null);
        setUploadSuccess(false);
        setUploadError("");
        setUploadedCount(0);
        onOpenChange(false);
    };

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Upload Candidate CVs</DialogTitle>
                    <DialogDescription>
                        Upload any document type - Files will be sent to the webhook
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-6">
                    {/* Supported Formats Info */}
                    <Alert className="bg-blue-50/80 border-2 border-blue-200/60 backdrop-blur-sm">
                        <AlertCircle className="h-4 w-4 text-blue-600" />
                        <AlertDescription className="text-blue-900 font-medium">
                            All document types accepted (PDF, DOC, DOCX, TXT, XLS, XLSX, PPT, PPTX, etc.) - Max 10MB. Files will be sent to webhook.
                        </AlertDescription>
                    </Alert>

                    {/* File Upload Area */}
                    {!uploadSuccess && (
                        <div
                            className={`border-2 border-dashed rounded-xl p-8 text-center transition-all duration-300 ${
                                dragActive
                                    ? "border-primary bg-primary/10 shadow-lg scale-[1.02]"
                                    : "border-border/60 bg-background/50 hover:border-primary/40 hover:bg-primary/5"
                            }`}
                            onDragEnter={handleDrag}
                            onDragLeave={handleDrag}
                            onDragOver={handleDrag}
                            onDrop={handleDrop}
                        >
                            <input
                                type="file"
                                id="cv-upload"
                                onChange={handleFileInput}
                                accept="*/*"
                                className="hidden"
                                disabled={uploading}
                            />
                            <label htmlFor="cv-upload" className="cursor-pointer block">
                                <Upload className="h-12 w-12 mx-auto mb-3 text-primary" />
                                <p className="text-lg font-medium mb-1">
                                    Drag and drop your CV here
                                </p>
                                <p className="text-sm text-muted-foreground mb-4">
                                    or click to browse your computer
                                </p>
                            </label>
                            {selectedFile && (
                                <div className="mt-4 p-4 bg-gradient-to-r from-primary/10 to-accent/10 rounded-xl border border-primary/20 flex items-center justify-between shadow-sm">
                                    <div className="flex items-center gap-3">
                                        <FileText className="h-5 w-5 text-primary" />
                                        <div className="text-left">
                                            <p className="font-medium text-sm">{selectedFile.name}</p>
                                            <p className="text-xs text-muted-foreground">
                                                {formatFileSize(selectedFile.size)}
                                            </p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => {
                                            setSelectedFile(null);
                                            setUploadError("");
                                        }}
                                        className="text-destructive hover:text-destructive/80"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </button>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Error Alert */}
                    {uploadError && !uploadSuccess && (
                        <Alert variant="destructive">
                            <AlertCircle className="h-4 w-4" />
                            <AlertDescription>{uploadError}</AlertDescription>
                        </Alert>
                    )}

                    {/* Success Message */}
                    {uploadSuccess && (
                        <Alert className="bg-green-50/80 border-2 border-green-200/60 backdrop-blur-sm">
                            <CheckCircle2 className="h-4 w-4 text-green-600" />
                            <AlertDescription className="text-green-900 font-medium">
                                ✓ File uploaded successfully and sent to webhook!
                            </AlertDescription>
                        </Alert>
                    )}

                    {/* Upload Summary */}
                    {uploadedCount > 0 && !uploading && uploadSuccess && (
                        <Alert className="bg-green-50/80 border-2 border-green-200/60 backdrop-blur-sm">
                            <CheckCircle2 className="h-4 w-4 text-green-600" />
                            <AlertDescription className="text-green-900 font-medium">
                                ✓ {uploadedCount} file{uploadedCount !== 1 ? "s" : ""}{" "}
                                uploaded successfully
                            </AlertDescription>
                        </Alert>
                    )}

                    {/* Action Buttons */}
                    <div className="flex gap-2">
                        {!uploadSuccess ? (
                            <>
                                <Button
                                    variant="outline"
                                    onClick={handleClose}
                                    disabled={uploading}
                                >
                                    Close
                                </Button>
                                <Button
                                    onClick={handleUpload}
                                    disabled={!selectedFile || uploading}
                                    className="flex-1"
                                >
                                    {uploading ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Uploading...
                                        </>
                                    ) : (
                                        <>
                                            <Upload className="mr-2 h-4 w-4" />
                                            Upload File
                                        </>
                                    )}
                                </Button>
                            </>
                        ) : (
                            <>
                                <Button
                                    variant="outline"
                                    onClick={() => {
                                        setSelectedFile(null);
                                        setUploadSuccess(false);
                                        setUploadError("");
                                    }}
                                >
                                    Upload Another
                                </Button>
                                <Button onClick={handleClose} className="flex-1">
                                    Done
                                </Button>
                            </>
                        )}
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
};