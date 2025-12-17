import { useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { publicApi } from "@/services/api";
import { supabase } from "@/integrations/supabase/client";
import { Calendar, Clock, User, Building2, Briefcase, MessageSquare } from "lucide-react";
import { IconContainer } from "@/components/IconContainer";

interface BookDemoDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess?: () => void;
}

const BookDemoDialog = ({
    open,
    onOpenChange,
    onSuccess
}: BookDemoDialogProps) => {
    const { toast } = useToast();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        phone: "",
        company: "",
        role: "",
        about_me: "",
        meeting_date: "",
        meeting_time: "",
        meeting_duration: 30,
        additional_notes: "",
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            if (!formData.name || !formData.email || !formData.company || !formData.role) {
                throw new Error("Please fill in all required fields");
            }

            if (formData.meeting_date && formData.meeting_time) {
                const meetingDateTime = new Date(`${formData.meeting_date}T${formData.meeting_time}`);
                
                if (meetingDateTime <= new Date()) {
                    throw new Error("Meeting date must be in the future");
                }
            }

            const meetingDateTime = formData.meeting_date && formData.meeting_time 
                ? new Date(`${formData.meeting_date}T${formData.meeting_time}`).toISOString()
                : null;

            const demoBookingData: any = {
                name: formData.name,
                email: formData.email,
                phone: formData.phone || null,
                company: formData.company,
                role: formData.role,
                about_me: formData.about_me,
                additional_notes: formData.additional_notes || null,
                meeting_date: meetingDateTime,
                meeting_duration: formData.meeting_duration,
                status: "pending",
            };

            // Get user if authenticated (optional)
            try {
                const { data: { user } } = await supabase.auth.getUser();
                if (user) {
                    demoBookingData.user_id = user.id;
                }
            } catch {
                // User not authenticated, continue without user_id
            }

            // Submit through backend API
            await publicApi.createDemoBooking(demoBookingData);

            toast({
                title: "Demo Request Submitted! 🎉",
                description: formData.meeting_date && formData.meeting_time
                    ? `Your demo request has been submitted. We'll confirm the meeting for ${new Date(`${formData.meeting_date}T${formData.meeting_time}`).toLocaleDateString()} at ${formData.meeting_time}`
                    : "Your demo request has been submitted. Our team will contact you soon to schedule a convenient time.",
            });

            setFormData({
                name: "",
                email: "",
                phone: "",
                company: "",
                role: "",
                about_me: "",
                meeting_date: "",
                meeting_time: "",
                meeting_duration: 30,
                additional_notes: "",
            });

            onOpenChange(false);

            if (onSuccess) {
                onSuccess();
            }

        } catch (error: any) {
            toast({
                title: "Error",
                description: error.message || "Failed to submit demo request. Please try again.",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (field: string, value: string | number) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const getMinDate = () => {
        const today = new Date();
        return today.toISOString().split('T')[0];
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent 
                className="sm:max-w-[550px] max-h-[90vh] overflow-y-auto p-0 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden w-[calc(100vw-2rem)] sm:w-auto"
                style={{
                    maxWidth: 'min(550px, calc(100vw - 4rem))',
                    maxHeight: 'min(90vh, calc(100vh - 4rem))',
                }}
            >
                <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-accent/10 border-b-2 border-primary/20 px-6 pt-6 pb-4">
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-bold flex items-center gap-2">
                            <IconContainer size="sm" variant="default">
                                <Calendar className="h-5 w-5" />
                            </IconContainer>
                            Book a Demo
                        </DialogTitle>
                        <DialogDescription className="text-sm mt-2">
                            Schedule a personalized demo tailored to your needs
                        </DialogDescription>
                    </DialogHeader>
                </div>

                <form onSubmit={handleSubmit} className="px-6 py-5 space-y-5">
                    <div className="space-y-4">
                        <h3 className="text-sm font-bold text-foreground flex items-center gap-2 pb-2 border-b-2 border-border/60">
                            <User className="h-4 w-4 text-primary" />
                            Personal Information
                        </h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="name" className="text-sm font-medium">
                                    Full Name <span className="text-destructive">*</span>
                                </Label>
                                <Input
                                    id="name"
                                    type="text"
                                    required
                                    placeholder="John Doe"
                                    value={formData.name}
                                    onChange={(e) => handleChange("name", e.target.value)}
                                    className="h-10"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="email" className="text-sm font-medium">
                                    Email Address <span className="text-destructive">*</span>
                                </Label>
                                <Input
                                    id="email"
                                    type="email"
                                    required
                                    placeholder="john@company.com"
                                    value={formData.email}
                                    onChange={(e) => handleChange("email", e.target.value)}
                                    className="h-10"
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="phone" className="text-sm font-medium">
                                Phone Number <span className="text-xs text-muted-foreground">(Optional)</span>
                            </Label>
                            <Input
                                id="phone"
                                type="tel"
                                placeholder="+1 (555) 123-4567"
                                value={formData.phone}
                                onChange={(e) => handleChange("phone", e.target.value)}
                                className="h-10"
                            />
                        </div>
                    </div>

                    <div className="space-y-4">
                        <h3 className="text-sm font-bold text-foreground flex items-center gap-2 pb-2 border-b-2 border-border/60">
                            <Building2 className="h-4 w-4 text-primary" />
                            Company Information
                        </h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="company" className="text-sm font-medium">
                                    Company <span className="text-destructive">*</span>
                                </Label>
                                <Input
                                    id="company"
                                    type="text"
                                    required
                                    placeholder="Acme Corporation"
                                    value={formData.company}
                                    onChange={(e) => handleChange("company", e.target.value)}
                                    className="h-10"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="role" className="text-sm font-medium">
                                    Your Role <span className="text-destructive">*</span>
                                </Label>
                                <Input
                                    id="role"
                                    type="text"
                                    required
                                    placeholder="HR Manager"
                                    value={formData.role}
                                    onChange={(e) => handleChange("role", e.target.value)}
                                    className="h-10"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="about_me" className="text-sm font-semibold text-foreground flex items-center gap-2">
                            <MessageSquare className="h-4 w-4 text-primary" />
                            Tell Us About Yourself <span className="text-destructive">*</span>
                        </Label>
                        <Textarea
                            id="about_me"
                            placeholder="Share your hiring challenges, team size, and what you're looking for in a solution..."
                            value={formData.about_me}
                            onChange={(e) => handleChange("about_me", e.target.value)}
                            rows={4}
                            required
                            className="resize-none text-sm"
                        />
                    </div>

                    <div className="space-y-4 pt-2">
                        <h3 className="text-sm font-bold text-foreground flex items-center gap-2 pb-2 border-b-2 border-border/60">
                            <Clock className="h-4 w-4 text-primary" />
                            Meeting Preferences <span className="text-xs font-normal text-muted-foreground">(Optional)</span>
                        </h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="meeting_date" className="text-sm font-medium">
                                    Preferred Date
                                </Label>
                                <Input
                                    id="meeting_date"
                                    type="date"
                                    min={getMinDate()}
                                    value={formData.meeting_date}
                                    onChange={(e) => handleChange("meeting_date", e.target.value)}
                                    className="h-10"
                                />
                            </div>
                            {formData.meeting_date && (
                                <div className="space-y-2">
                                    <Label htmlFor="meeting_time" className="text-sm font-medium">
                                        Preferred Time
                                    </Label>
                                    <Input
                                        id="meeting_time"
                                        type="time"
                                        value={formData.meeting_time}
                                        onChange={(e) => handleChange("meeting_time", e.target.value)}
                                        className="h-10"
                                    />
                                </div>
                            )}
                        </div>
                        {formData.meeting_date && (
                            <div className="space-y-2">
                                <Label htmlFor="meeting_duration" className="text-sm font-medium">
                                    Duration
                                </Label>
                                <select
                                    id="meeting_duration"
                                    value={formData.meeting_duration}
                                    onChange={(e) => handleChange("meeting_duration", parseInt(e.target.value))}
                                    className="w-full h-11 px-4 rounded-xl border-2 border-border/60 bg-background/95 backdrop-blur-sm text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:border-primary/80 transition-all hover:border-primary/50"
                                >
                                    <option value={15}>15 minutes</option>
                                    <option value={30}>30 minutes</option>
                                    <option value={45}>45 minutes</option>
                                    <option value={60}>60 minutes</option>
                                </select>
                            </div>
                        )}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="additional_notes" className="text-sm font-medium">
                            Additional Notes <span className="text-xs text-muted-foreground">(Optional)</span>
                        </Label>
                        <Textarea
                            id="additional_notes"
                            placeholder="Anything else you'd like us to know..."
                            value={formData.additional_notes}
                            onChange={(e) => handleChange("additional_notes", e.target.value)}
                            rows={2}
                            className="resize-none text-sm"
                        />
                    </div>

                    <div className="flex gap-3 pt-4 border-t-2 border-border/60">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                            className="flex-1"
                            disabled={loading}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            className="flex-1 bg-gradient-to-r from-primary to-accent hover:opacity-90"
                            disabled={loading}
                        >
                            {loading ? "Submitting..." : "Request Demo"}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
};

export default BookDemoDialog;

