import { useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: 'recruiter' | 'applicant';
}

const ProtectedRoute = ({ children, requiredRole }: ProtectedRouteProps) => {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [userRoles, setUserRoles] = useState<string[]>([]);
  const location = useLocation();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          setLoading(false);
          return;
        }

        setUser(user);

        // Get all user roles - use backend API for faster response
        if (requiredRole) {
          try {
            const { authApi } = await import('@/services/api');
            const userData = await authApi.getMe();
            const role = userData.role;
            setUserRoles(role ? [role] : []);
          } catch (error) {
            console.error('Error fetching user role:', error);
            // Fallback to direct query
            const { data: roleData } = await (supabase
              .from('user_roles' as any)
              .select('role')
              .eq('user_id', user.id) as any);
            const roles = roleData?.map((r: any) => r.role) || [];
            setUserRoles(roles);
          }
        }

        setLoading(false);
      } catch (error) {
        console.error("Auth check error:", error);
        setLoading(false);
      }
    };

    checkAuth();
  }, [requiredRole]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!user) {
    // Redirect to appropriate login page based on required role
    const loginPath = requiredRole === 'applicant' 
      ? '/applicant/login' 
      : '/recruiter/login';
    return <Navigate to={`${loginPath}?redirect=${encodeURIComponent(location.pathname)}`} replace />;
  }

  if (requiredRole && !userRoles.includes(requiredRole)) {
    // User doesn't have required role - redirect to their appropriate dashboard
    if (userRoles.includes('applicant')) {
      return <Navigate to="/applicant/dashboard" replace />;
    } else if (userRoles.includes('recruiter')) {
      return <Navigate to="/recruiter/dashboard" replace />;
    }
    // No role or unknown role - redirect to home
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;

