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
import { Calendar } from "lucide-react";

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

            try {
                const { data: { user } } = await supabase.auth.getUser();
                if (user) {
                    demoBookingData.user_id = user.id;
                }
            } catch {
                // User not authenticated, continue without user_id
            }

            await publicApi.createDemoBooking(demoBookingData);

            toast({
                title: "Demo Request Submitted!",
                description: formData.meeting_date && formData.meeting_time
                    ? `We'll confirm the meeting for ${new Date(`${formData.meeting_date}T${formData.meeting_time}`).toLocaleDateString()}`
                    : "Our team will contact you soon to schedule a convenient time.",
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
            if (onSuccess) onSuccess();

        } catch (error: any) {
            toast({
                title: "Error",
                description: error.message || "Failed to submit demo request.",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (field: string, value: string | number) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const getMinDate = () => new Date().toISOString().split('T')[0];

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Calendar className="h-5 w-5" />
                        Book a Demo
                    </DialogTitle>
                    <DialogDescription>
                        Schedule a personalized demo tailored to your needs
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4 mt-4">
                    {/* Personal Info */}
                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                            <Label htmlFor="name" className="text-sm">Full Name *</Label>
                            <Input
                                id="name"
                                required
                                placeholder="John Doe"
                                value={formData.name}
                                onChange={(e) => handleChange("name", e.target.value)}
                            />
                        </div>
                        <div className="space-y-1">
                            <Label htmlFor="email" className="text-sm">Email *</Label>
                            <Input
                                id="email"
                                type="email"
                                required
                                placeholder="john@company.com"
                                value={formData.email}
                                onChange={(e) => handleChange("email", e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="space-y-1">
                        <Label htmlFor="phone" className="text-sm">Phone (Optional)</Label>
                        <Input
                            id="phone"
                            type="tel"
                            placeholder="+1 (555) 123-4567"
                            value={formData.phone}
                            onChange={(e) => handleChange("phone", e.target.value)}
                        />
                    </div>

                    {/* Company Info */}
                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                            <Label htmlFor="company" className="text-sm">Company *</Label>
                            <Input
                                id="company"
                                required
                                placeholder="Acme Corp"
                                value={formData.company}
                                onChange={(e) => handleChange("company", e.target.value)}
                            />
                        </div>
                        <div className="space-y-1">
                            <Label htmlFor="role" className="text-sm">Your Role *</Label>
                            <Input
                                id="role"
                                required
                                placeholder="HR Manager"
                                value={formData.role}
                                onChange={(e) => handleChange("role", e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="space-y-1">
                        <Label htmlFor="about_me" className="text-sm">Tell Us About Your Needs *</Label>
                        <Textarea
                            id="about_me"
                            placeholder="Share your hiring challenges and what you're looking for..."
                            value={formData.about_me}
                            onChange={(e) => handleChange("about_me", e.target.value)}
                            rows={3}
                            required
                        />
                    </div>

                    {/* Meeting Preferences */}
                    <div className="space-y-3 pt-2 border-t">
                        <p className="text-sm font-medium">Meeting Preferences (Optional)</p>
                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1">
                                <Label htmlFor="meeting_date" className="text-sm">Preferred Date</Label>
                                <Input
                                    id="meeting_date"
                                    type="date"
                                    min={getMinDate()}
                                    value={formData.meeting_date}
                                    onChange={(e) => handleChange("meeting_date", e.target.value)}
                                />
                            </div>
                            {formData.meeting_date && (
                                <div className="space-y-1">
                                    <Label htmlFor="meeting_time" className="text-sm">Preferred Time</Label>
                                    <Input
                                        id="meeting_time"
                                        type="time"
                                        value={formData.meeting_time}
                                        onChange={(e) => handleChange("meeting_time", e.target.value)}
                                    />
                                </div>
                            )}
                        </div>
                        {formData.meeting_date && (
                            <div className="space-y-1">
                                <Label htmlFor="meeting_duration" className="text-sm">Duration</Label>
                                <select
                                    id="meeting_duration"
                                    value={formData.meeting_duration}
                                    onChange={(e) => handleChange("meeting_duration", parseInt(e.target.value))}
                                    className="w-full h-10 px-3 rounded-md border bg-background text-sm"
                                >
                                    <option value={15}>15 minutes</option>
                                    <option value={30}>30 minutes</option>
                                    <option value={45}>45 minutes</option>
                                    <option value={60}>60 minutes</option>
                                </select>
                            </div>
                        )}
                    </div>

                    <div className="space-y-1">
                        <Label htmlFor="additional_notes" className="text-sm">Additional Notes (Optional)</Label>
                        <Textarea
                            id="additional_notes"
                            placeholder="Anything else you'd like us to know..."
                            value={formData.additional_notes}
                            onChange={(e) => handleChange("additional_notes", e.target.value)}
                            rows={2}
                        />
                    </div>

                    <div className="flex gap-3 pt-4">
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="flex-1" disabled={loading}>
                            Cancel
                        </Button>
                        <Button type="submit" className="flex-1" disabled={loading}>
                            {loading ? "Submitting..." : "Request Demo"}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
};

export default BookDemoDialog;
