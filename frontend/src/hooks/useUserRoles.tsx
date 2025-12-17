import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export type UserRole = 'applicant' | 'recruiter';

interface UseUserRolesReturn {
  roles: UserRole[];
  hasRole: (role: UserRole) => boolean;
  hasAnyRole: (roles: UserRole[]) => boolean;
  loading: boolean;
  error: Error | null;
}

/**
 * Hook to get all roles for the current authenticated user
 * Supports users with multiple roles (e.g., both applicant and recruiter)
 */
export const useUserRoles = (): UseUserRolesReturn => {
  const [roles, setRoles] = useState<UserRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchRoles = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          setRoles([]);
          setLoading(false);
          return;
        }

        const { data: roleData, error: roleError } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id);

        if (roleError) throw roleError;

        const userRoles = (roleData || []).map(r => r.role as UserRole);
        setRoles(userRoles);
        setError(null);
      } catch (err) {
        console.error('Error fetching user roles:', err);
        setError(err as Error);
        setRoles([]);
      } finally {
        setLoading(false);
      }
    };

    fetchRoles();

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      fetchRoles();
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const hasRole = (role: UserRole): boolean => {
    return roles.includes(role);
  };

  const hasAnyRole = (requiredRoles: UserRole[]): boolean => {
    return requiredRoles.some(role => roles.includes(role));
  };

  return { roles, hasRole, hasAnyRole, loading, error };
};

/**
 * Get all roles for a specific user ID (for server-side or admin use)
 */
export const getUserRoles = async (userId: string): Promise<UserRole[]> => {
  const { data, error } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', userId);

  if (error) {
    console.error('Error fetching user roles:', error);
    return [];
  }

  return (data || []).map(r => r.role as UserRole);
};

