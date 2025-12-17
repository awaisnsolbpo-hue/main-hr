import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useUserRoleAndProfile } from "@/hooks/useUserRoleAndProfile";
import {
  SidebarProvider,
  SidebarInset,
} from "@/components/ui/sidebar";
import DashboardSidebar from "@/components/DashboardSidebar";
import Chatbot from "@/components/Chatbot";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

interface Profile {
  id: string;
  full_name: string;
  email: string;
}

const DashboardLayout = ({ children }: DashboardLayoutProps) => {
  const navigate = useNavigate();
  const { user, role, recruiterProfile, loading } = useUserRoleAndProfile(true);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [hasUnviewedActivities, setHasUnviewedActivities] = useState(false);

  // Update profile from hook
  useEffect(() => {
    if (recruiterProfile) {
      setProfile({
        id: recruiterProfile.id,
        full_name: recruiterProfile.full_name,
        email: recruiterProfile.email,
      });
    }
  }, [recruiterProfile]);

  // Verify user has recruiter role
  useEffect(() => {
    if (!loading && user && role !== 'recruiter') {
      // User doesn't have recruiter role - redirect to appropriate page
      if (role === 'applicant') {
        navigate('/applicant/dashboard', { replace: true });
      } else {
        // No role or unknown role - redirect to login
        navigate('/recruiter/login', { replace: true });
      }
    }
  }, [loading, user, role, navigate]);

  const handleActivityClick = () => {
    if (user) {
      localStorage.setItem(`lastViewedActivity_${user.id}`, new Date().toISOString());
      setHasUnviewedActivities(false);
    }
    navigate("/recruiter/activity-logs");
  };

  const handleLogout = () => {
    // Logout is handled in DashboardSidebar
  };

  // Show loading state while checking auth and role
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto mb-4" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // Don't render if user doesn't have recruiter role (will redirect)
  if (!user || role !== 'recruiter') {
    return null;
  }

  return (
    <SidebarProvider defaultOpen={true}>
      <DashboardSidebar
        profile={profile}
        hasUnviewedActivities={hasUnviewedActivities}
        onActivityClick={handleActivityClick}
        onLogout={handleLogout}
      />
      <SidebarInset className="flex flex-col min-h-svh flex-1 overflow-hidden">
        <div className="flex-1 overflow-y-auto overflow-x-hidden">
          {children}
        </div>
      </SidebarInset>
      <Chatbot />
    </SidebarProvider>
  );
};

export default DashboardLayout;

