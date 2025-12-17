import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import DashboardLayout from "@/components/DashboardLayout";
import {
    ArrowLeft,
    Shield,
    Bell,
    Key,
    Trash2,
    Loader2,
    Mail,
    Linkedin,
    Globe,
    Moon,
    Sun,
    CheckCircle,
    Sparkles
} from "lucide-react";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const Settings = () => {
    const navigate = useNavigate();
    const { toast } = useToast();
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState<any>(null);
    const [emailNotifications, setEmailNotifications] = useState(true);
    const [pushNotifications, setPushNotifications] = useState(false);
    const [passwordData, setPasswordData] = useState({
        currentPassword: "",
        newPassword: "",
        confirmPassword: ""
    });
    const [changingPassword, setChangingPassword] = useState(false);
    const [deletingAccount, setDeletingAccount] = useState(false);
    const [profile, setProfile] = useState<any>(null);

    useEffect(() => {
        const checkAuth = async () => {
            const { data: { session }, error } = await supabase.auth.getSession();

            if (error || !session) {
                navigate("/login", { replace: true });
                return;
            }

            setUser(session.user);
            fetchProfile(session.user.id);
        };

        checkAuth();
    }, [navigate]);

    const fetchProfile = async (userId: string) => {
        try {
            const { data, error } = await supabase
                .from("profiles")
                .select("*")
                .eq("id", userId)
                .single();

            if (error) throw error;
            setProfile(data);
        } catch (error: any) {
            console.error("Error fetching profile:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleChangePassword = async () => {
        if (passwordData.newPassword !== passwordData.confirmPassword) {
            toast({
                title: "Error",
                description: "New passwords do not match",
                variant: "destructive"
            });
            return;
        }

        if (passwordData.newPassword.length < 6) {
            toast({
                title: "Error",
                description: "Password must be at least 6 characters",
                variant: "destructive"
            });
            return;
        }

        setChangingPassword(true);

        try {
            const { error } = await supabase.auth.updateUser({
                password: passwordData.newPassword
            });

            if (error) throw error;

            toast({
                title: "Success",
                description: "Password changed successfully",
            });

            setPasswordData({
                currentPassword: "",
                newPassword: "",
                confirmPassword: ""
            });
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.message || "Failed to change password",
                variant: "destructive"
            });
        } finally {
            setChangingPassword(false);
        }
    };

    const handleDeleteAccount = async () => {
        setDeletingAccount(true);

        try {
            // Note: In production, you'd want to handle this on the backend
            // This is a simplified version
            const { error } = await supabase.auth.signOut();

            if (error) throw error;

            toast({
                title: "Account Deletion Requested",
                description: "Please contact support to complete account deletion",
            });

            navigate("/login");
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.message || "Failed to delete account",
                variant: "destructive"
            });
            setDeletingAccount(false);
        }
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
                <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="max-w-4xl mx-auto">
                    <div className="mb-8">
                        <h1 className="text-3xl font-bold">Settings</h1>
                        <p className="text-muted-foreground mt-2">Manage your account settings and preferences</p>
                    </div>

                    <Tabs defaultValue="general" className="space-y-6">
                        <TabsList className="grid w-full grid-cols-4">
                            <TabsTrigger value="general">General</TabsTrigger>
                            <TabsTrigger value="notifications">Notifications</TabsTrigger>
                            <TabsTrigger value="security">Security</TabsTrigger>
                            <TabsTrigger value="integrations">Integrations</TabsTrigger>
                        </TabsList>

                        {/* General Settings */}
                        <TabsContent value="general">
                            <Card className="shadow-elegant">
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <Globe className="h-5 w-5" />
                                        General Settings
                                    </CardTitle>
                                    <CardDescription>
                                        Manage your general preferences
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    <div className="flex items-center justify-between">
                                        <div className="space-y-0.5">
                                            <Label className="text-base flex items-center gap-2">
                                                <Sun className="h-4 w-4" />
                                                Theme
                                            </Label>
                                            <p className="text-sm text-muted-foreground">
                                                Change theme using the theme toggle in the sidebar or navbar
                                            </p>
                                        </div>
                                        <div className="text-sm text-muted-foreground">
                                            Use Theme Toggle
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </TabsContent>

                        {/* Notifications */}
                        <TabsContent value="notifications">
                            <Card className="shadow-elegant">
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <Bell className="h-5 w-5" />
                                        Notification Settings
                                    </CardTitle>
                                    <CardDescription>
                                        Manage how you receive notifications
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    <div className="flex items-center justify-between">
                                        <div className="space-y-0.5">
                                            <Label className="text-base">Email Notifications</Label>
                                            <p className="text-sm text-muted-foreground">
                                                Receive email updates about candidates and interviews
                                            </p>
                                        </div>
                                        <Switch
                                            checked={emailNotifications}
                                            onCheckedChange={setEmailNotifications}
                                        />
                                    </div>

                                    <div className="flex items-center justify-between">
                                        <div className="space-y-0.5">
                                            <Label className="text-base">Push Notifications</Label>
                                            <p className="text-sm text-muted-foreground">
                                                Receive push notifications for important updates
                                            </p>
                                        </div>
                                        <Switch
                                            checked={pushNotifications}
                                            onCheckedChange={setPushNotifications}
                                        />
                                    </div>
                                </CardContent>
                            </Card>
                        </TabsContent>

                        {/* Security */}
                        <TabsContent value="security">
                            <div className="space-y-6">
                                {/* Change Password */}
                                <Card className="shadow-elegant">
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2">
                                            <Key className="h-5 w-5" />
                                            Change Password
                                        </CardTitle>
                                        <CardDescription>
                                            Update your password to keep your account secure
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="newPassword">New Password</Label>
                                            <Input
                                                id="newPassword"
                                                type="password"
                                                value={passwordData.newPassword}
                                                onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                                                placeholder="Enter new password"
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="confirmPassword">Confirm New Password</Label>
                                            <Input
                                                id="confirmPassword"
                                                type="password"
                                                value={passwordData.confirmPassword}
                                                onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                                                placeholder="Confirm new password"
                                            />
                                        </div>

                                        <Button
                                            onClick={handleChangePassword}
                                            disabled={changingPassword || !passwordData.newPassword || !passwordData.confirmPassword}
                                            className="w-full"
                                        >
                                            {changingPassword ? (
                                                <>
                                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                                    Changing Password...
                                                </>
                                            ) : (
                                                "Change Password"
                                            )}
                                        </Button>
                                    </CardContent>
                                </Card>

                                {/* Delete Account */}
                                <Card className="shadow-elegant border-destructive/50">
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2 text-destructive">
                                            <Trash2 className="h-5 w-5" />
                                            Delete Account
                                        </CardTitle>
                                        <CardDescription>
                                            Permanently delete your account and all associated data
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <AlertDialog>
                                            <AlertDialogTrigger asChild>
                                                <Button variant="destructive" className="w-full">
                                                    Delete My Account
                                                </Button>
                                            </AlertDialogTrigger>
                                            <AlertDialogContent>
                                                <AlertDialogHeader>
                                                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                                    <AlertDialogDescription>
                                                        This action cannot be undone. This will permanently delete your
                                                        account and remove all your data from our servers.
                                                    </AlertDialogDescription>
                                                </AlertDialogHeader>
                                                <AlertDialogFooter>
                                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                    <AlertDialogAction
                                                        onClick={handleDeleteAccount}
                                                        disabled={deletingAccount}
                                                        className="bg-destructive hover:bg-destructive/90"
                                                    >
                                                        {deletingAccount ? "Deleting..." : "Yes, Delete My Account"}
                                                    </AlertDialogAction>
                                                </AlertDialogFooter>
                                            </AlertDialogContent>
                                        </AlertDialog>
                                    </CardContent>
                                </Card>
                            </div>
                        </TabsContent>

                        {/* Integrations */}
                        <TabsContent value="integrations">
                            <Card className="shadow-elegant">
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <Shield className="h-5 w-5" />
                                        Connected Services
                                    </CardTitle>
                                    <CardDescription>
                                        Manage your connected accounts and integrations
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    {/* LinkedIn Integration */}
                                    <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                                                <Linkedin className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                                            </div>
                                            <div>
                                                <p className="font-medium">LinkedIn</p>
                                                <p className="text-sm text-muted-foreground">
                                                    {profile?.linkedin_connected 
                                                        ? "Connected" 
                                                        : "Post jobs and import candidates"}
                                                </p>
                                            </div>
                                        </div>
                                        {profile?.linkedin_connected ? (
                                            <div className="flex items-center gap-2">
                                                <CheckCircle className="h-5 w-5 text-green-500" />
                                                <Button variant="outline" size="sm">
                                                    Disconnect
                                                </Button>
                                            </div>
                                        ) : (
                                            <Button size="sm" onClick={() => navigate("/connect-linkedin")}>
                                                Connect
                                            </Button>
                                        )}
                                    </div>

                                    {/* Gmail Integration */}
                                    <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-red-100 dark:bg-red-900 rounded-lg">
                                                <Mail className="h-5 w-5 text-red-600 dark:text-red-400" />
                                            </div>
                                            <div>
                                                <p className="font-medium">Gmail</p>
                                                <p className="text-sm text-muted-foreground">
                                                    {profile?.gmail_connected_at 
                                                        ? "Connected" 
                                                        : "Import candidates from email"}
                                                </p>
                                            </div>
                                        </div>
                                        {profile?.gmail_connected_at ? (
                                            <div className="flex items-center gap-2">
                                                <CheckCircle className="h-5 w-5 text-green-500" />
                                                <Button variant="outline" size="sm">
                                                    Disconnect
                                                </Button>
                                            </div>
                                        ) : (
                                            <Button size="sm" onClick={() => navigate("/gmail-import")}>
                                                Connect
                                            </Button>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        </TabsContent>
                    </Tabs>
                </div>
            </main>
        </div>
        </DashboardLayout>
    );
};

export default Settings;