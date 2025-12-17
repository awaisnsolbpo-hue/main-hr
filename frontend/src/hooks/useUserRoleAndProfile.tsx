import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";
import { authApi } from "@/services/api";

interface RecruiterProfile {
  id: string;
  email: string;
  full_name: string;
  company_name?: string;
  company_logo_url?: string;
  is_company_profile_complete?: boolean;
}

interface ApplicantProfile {
  id: string;
  user_id: string;
  email: string;
  first_name: string;
  last_name: string;
  profession?: string;
  skills?: string[];
  cv_url?: string;
}

interface UseUserRoleAndProfileReturn {
  user: User | null;
  role: 'recruiter' | 'applicant' | null;
  recruiterProfile: RecruiterProfile | null;
  applicantProfile: ApplicantProfile | null;
  loading: boolean;
  error: string | null;
}

// Module-level cache to persist data across page navigations and component remounts
interface CachedProfileData {
  user: User | null;
  role: 'recruiter' | 'applicant' | null;
  recruiterProfile: RecruiterProfile | null;
  applicantProfile: ApplicantProfile | null;
  userId: string | null;
  timestamp: number;
}

let profileCache: CachedProfileData | null = null;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes cache

// Helper to check if cache is valid
const isCacheValid = (cache: CachedProfileData | null, currentUserId: string | null): boolean => {
  if (!cache) return false;
  if (cache.userId !== currentUserId) return false;
  if (Date.now() - cache.timestamp > CACHE_DURATION) return false;
  return true;
};

/**
 * Hook that:
 * 1. Gets authenticated user from Supabase auth
 * 2. Checks user_roles table
 * 3. Loads appropriate profile (profiles for recruiter, applicants for applicant)
 * 4. Returns user, role, and profile data
 */
export const useUserRoleAndProfile = (autoRedirect: boolean = true): UseUserRoleAndProfileReturn => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<'recruiter' | 'applicant' | null>(null);
  const [recruiterProfile, setRecruiterProfile] = useState<RecruiterProfile | null>(null);
  const [applicantProfile, setApplicantProfile] = useState<ApplicantProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Refs to track state and prevent unnecessary re-fetches
  const hasLoadedRef = useRef(false);
  const isLoadingRef = useRef(false);
  const currentUserIdRef = useRef<string | null>(null);
  const autoRedirectRef = useRef(autoRedirect);
  const navigateRef = useRef(navigate);
  
  // Update refs when props change (but don't trigger re-fetch)
  useEffect(() => {
    autoRedirectRef.current = autoRedirect;
    navigateRef.current = navigate;
  }, [autoRedirect, navigate]);

  useEffect(() => {
    const checkUserAndLoadProfile = async () => {
      // Prevent multiple simultaneous loads
      if (isLoadingRef.current) {
        return;
      }

      // Step 1: Get authenticated user from Supabase auth (lightweight check)
      const { data: { user: authUser }, error: userError } = await supabase.auth.getUser();

      // Check if we can use cached data
      if (isCacheValid(profileCache, authUser?.id || null)) {
        setUser(profileCache!.user);
        setRole(profileCache!.role);
        setRecruiterProfile(profileCache!.recruiterProfile);
        setApplicantProfile(profileCache!.applicantProfile);
        currentUserIdRef.current = profileCache!.userId;
        hasLoadedRef.current = true;
        setLoading(false);
        return;
      }

      // If we've already loaded in this instance and user hasn't changed, skip API call
      if (hasLoadedRef.current && authUser?.id === currentUserIdRef.current) {
        setLoading(false);
        return;
      }

      // If no user and we've already checked, skip
      if ((userError || !authUser) && hasLoadedRef.current) {
        setLoading(false);
        return;
      }

      try {
        isLoadingRef.current = true;
        setLoading(true);
        setError(null);

        if (userError || !authUser) {
          // Clear cache on logout
          profileCache = null;
          if (autoRedirectRef.current) {
            navigateRef.current("/", { replace: true });
          }
          setLoading(false);
          isLoadingRef.current = false;
          hasLoadedRef.current = true;
          currentUserIdRef.current = null;
          return;
        }

        // Only fetch if user changed or hasn't been loaded yet
        if (authUser.id === currentUserIdRef.current && hasLoadedRef.current) {
          setLoading(false);
          isLoadingRef.current = false;
          return;
        }

        // Update user reference
        setUser(authUser);
        currentUserIdRef.current = authUser.id;

        // Step 2 & 3: Get user role and profile from backend API (faster, single request)
        try {
          const userData = await authApi.getMe();
          
          if (!userData.role) {
            setError('User has no role assigned');
            if (autoRedirectRef.current) {
              navigateRef.current("/", { replace: true });
            }
            setLoading(false);
            isLoadingRef.current = false;
            hasLoadedRef.current = true;
            return;
          }

          setRole(userData.role);
          
          if (userData.role === 'recruiter') {
            setRecruiterProfile(userData.recruiterProfile);
            setApplicantProfile(null);
            
            // Update cache
            profileCache = {
              user: authUser,
              role: userData.role,
              recruiterProfile: userData.recruiterProfile,
              applicantProfile: null,
              userId: authUser.id,
              timestamp: Date.now(),
            };
            
            // Redirect to recruiter dashboard if autoRedirect is enabled
            if (autoRedirectRef.current) {
              const currentPath = window.location.pathname;
              if (!currentPath.startsWith('/recruiter')) {
                navigateRef.current("/recruiter/dashboard", { replace: true });
              }
            }
          } else if (userData.role === 'applicant') {
            setApplicantProfile(userData.applicantProfile);
            setRecruiterProfile(null);
            
            // Update cache
            profileCache = {
              user: authUser,
              role: userData.role,
              recruiterProfile: null,
              applicantProfile: userData.applicantProfile,
              userId: authUser.id,
              timestamp: Date.now(),
            };
            
            // Redirect to applicant dashboard if autoRedirect is enabled
            if (autoRedirectRef.current) {
              const currentPath = window.location.pathname;
              if (!currentPath.startsWith('/applicant')) {
                navigateRef.current("/applicant/dashboard", { replace: true });
              }
            }
          }
        } catch (apiError: any) {
          console.error('Error fetching user data from API:', apiError);
          setError(apiError.message || 'Failed to fetch user data');
          if (autoRedirectRef.current) {
            navigateRef.current("/", { replace: true });
          }
        }

        setLoading(false);
        isLoadingRef.current = false;
        hasLoadedRef.current = true;
      } catch (err: any) {
        console.error('Error in useUserRoleAndProfile:', err);
        setError(err.message || 'An error occurred');
        setLoading(false);
        isLoadingRef.current = false;
        hasLoadedRef.current = true;
      }
    };

    // Check if we need to load - only if not already loaded or user changed
    checkUserAndLoadProfile();

    // Listen for auth state changes - only SIGNED_OUT and SIGNED_IN events
    // Ignore TOKEN_REFRESHED, USER_UPDATED, and other events that fire on tab changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        // Only handle actual sign in/out events
        if (event === 'SIGNED_OUT') {
          // Clear cache and state
          profileCache = null;
          hasLoadedRef.current = false;
          isLoadingRef.current = false;
          currentUserIdRef.current = null;
          setUser(null);
          setRole(null);
          setRecruiterProfile(null);
          setApplicantProfile(null);
          if (autoRedirectRef.current) {
            navigateRef.current("/", { replace: true });
          }
        } else if (event === 'SIGNED_IN' && session?.user) {
          // Only reload if user actually changed (not just token refresh)
          if (session.user.id !== currentUserIdRef.current) {
            // Clear cache for different user
            profileCache = null;
            hasLoadedRef.current = false;
            isLoadingRef.current = false;
            checkUserAndLoadProfile();
          }
        }
        // Explicitly ignore: TOKEN_REFRESHED, USER_UPDATED, PASSWORD_RECOVERY, etc.
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []); // Empty dependency array - only run on mount

  return {
    user,
    role,
    recruiterProfile,
    applicantProfile,
    loading,
    error,
  };
};

/**
 * Component wrapper that shows loading state while checking user role and loading profile
 */
export const UserRoleAndProfileLoader = ({ 
  children, 
  requiredRole 
}: { 
  children: React.ReactNode;
  requiredRole?: 'recruiter' | 'applicant';
}) => {
  const { user, role, loading, error } = useUserRoleAndProfile(true);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-500 mb-4">{error}</p>
        </div>
      </div>
    );
  }

  if (!user || !role) {
    return null; // Will redirect via useUserRoleAndProfile
  }

  if (requiredRole && role !== requiredRole) {
    return null; // Will redirect via useUserRoleAndProfile
  }

  return <>{children}</>;
};

