import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Upload, FileText, CheckCircle2, AlertCircle, Loader2, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { formatFileSize } from "@/lib/numberFormat";

interface FileUploadModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    jobId: string;
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

            const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;
            if (!apiBaseUrl) {
                throw new Error('API_BASE_URL is not configured');
            }

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
                description: `File "${selectedFile.name}" has been uploaded successfully`,
            });

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
            <DialogContent className="max-w-lg">
                <DialogHeader>
                    <DialogTitle>Upload Candidate CV</DialogTitle>
                    <DialogDescription>
                        Upload PDF, DOC, DOCX or other document files (max 10MB)
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 mt-4">
                    {/* File Upload Area */}
                    {!uploadSuccess && (
                        <div
                            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                                dragActive
                                    ? "border-primary bg-primary/5"
                                    : "border-muted-foreground/25 hover:border-primary/50"
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
                                <Upload className="h-10 w-10 mx-auto mb-3 text-muted-foreground" />
                                <p className="font-medium mb-1">
                                    Drag and drop your file here
                                </p>
                                <p className="text-sm text-muted-foreground">
                                    or click to browse
                                </p>
                            </label>
                            
                            {selectedFile && (
                                <div className="mt-4 p-3 bg-muted/50 rounded-lg flex items-center justify-between">
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
                                        onClick={(e) => {
                                            e.preventDefault();
                                            setSelectedFile(null);
                                            setUploadError("");
                                        }}
                                        className="text-muted-foreground hover:text-destructive"
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
                        <Alert className="border-green-200 bg-green-50 dark:bg-green-950/20">
                            <CheckCircle2 className="h-4 w-4 text-green-600" />
                            <AlertDescription className="text-green-800 dark:text-green-200">
                                File uploaded successfully!
                            </AlertDescription>
                        </Alert>
                    )}

                    {/* Upload Summary */}
                    {uploadedCount > 0 && uploadSuccess && (
                        <p className="text-sm text-muted-foreground text-center">
                            {uploadedCount} file{uploadedCount !== 1 ? "s" : ""} uploaded
                        </p>
                    )}

                    {/* Action Buttons */}
                    <div className="flex gap-2">
                        {!uploadSuccess ? (
                            <>
                                <Button variant="outline" onClick={handleClose} disabled={uploading}>
                                    Cancel
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
                                            Upload
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
