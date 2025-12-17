import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { authApi } from '@/services/api';
import { Loader2 } from 'lucide-react';

interface UseRoleVerificationOptions {
  requiredRole?: 'recruiter' | 'applicant';
  redirectTo?: string;
}

/**
 * Hook to verify user role on page navigation
 * Redirects if user doesn't have required role
 */
export const useRoleVerification = (options: UseRoleVerificationOptions = {}) => {
  const { requiredRole, redirectTo } = options;
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(true);
  const [hasAccess, setHasAccess] = useState(false);
  const [userRoles, setUserRoles] = useState<string[]>([]);

  useEffect(() => {
    const verifyRole = async () => {
      try {
        // Check if user is authenticated
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        
        if (userError || !user) {
          // Not authenticated - redirect to appropriate login
          const loginPath = requiredRole === 'applicant' 
            ? '/applicant/login' 
            : '/recruiter/login';
          navigate(`${loginPath}?redirect=${encodeURIComponent(location.pathname)}`, { replace: true });
          return;
        }

        // Get user roles from API (includes role verification)
        try {
          const { roles } = await authApi.getMe();
          setUserRoles(roles || []);

          if (requiredRole) {
            // Check if user has required role
            if (!roles || !roles.includes(requiredRole)) {
              // User doesn't have required role - redirect to their dashboard
              if (roles?.includes('applicant')) {
                navigate(redirectTo || '/applicant/dashboard', { replace: true });
              } else if (roles?.includes('recruiter')) {
                navigate(redirectTo || '/recruiter/dashboard', { replace: true });
              } else {
                // No roles - redirect to home
                navigate(redirectTo || '/', { replace: true });
              }
              return;
            }
          }

          setHasAccess(true);
        } catch (apiError) {
          console.error('Error verifying role:', apiError);
          // If API fails, try direct Supabase query as fallback
          const { data: roleData } = await supabase
            .from('user_roles')
            .select('role')
            .eq('user_id', user.id);

          const roles = roleData?.map(r => r.role) || [];
          setUserRoles(roles);

          if (requiredRole && !roles.includes(requiredRole)) {
            if (roles.includes('applicant')) {
              navigate(redirectTo || '/applicant/dashboard', { replace: true });
            } else if (roles.includes('recruiter')) {
              navigate(redirectTo || '/recruiter/dashboard', { replace: true });
            } else {
              navigate(redirectTo || '/', { replace: true });
            }
            return;
          }

          setHasAccess(true);
        }
      } catch (error) {
        console.error('Role verification error:', error);
        navigate('/', { replace: true });
      } finally {
        setLoading(false);
      }
    };

    verifyRole();
  }, [requiredRole, navigate, location.pathname, redirectTo]);

  return { loading, hasAccess, userRoles };
};

/**
 * Component wrapper for role verification
 */
export const RoleVerificationGuard = ({ 
  children, 
  requiredRole,
  redirectTo 
}: { 
  children: React.ReactNode;
  requiredRole?: 'recruiter' | 'applicant';
  redirectTo?: string;
}) => {
  const { loading, hasAccess } = useRoleVerification({ requiredRole, redirectTo });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!hasAccess) {
    return null; // Redirect is happening
  }

  return <>{children}</>;
};

