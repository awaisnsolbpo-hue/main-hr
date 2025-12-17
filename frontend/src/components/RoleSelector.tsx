import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Briefcase, User, Sparkles } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface RoleSelectorProps {
  onRoleSelected?: (role: 'applicant' | 'recruiter') => void;
}

/**
 * Component to allow users with multiple roles to select which role they want to use
 */
const RoleSelector = ({ onRoleSelected }: RoleSelectorProps) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [roles, setRoles] = useState<('applicant' | 'recruiter')[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRoles = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          navigate('/');
          return;
        }

        const { data: roleData, error } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id);

        if (error) throw error;

        const userRoles = (roleData || []).map(r => r.role as 'applicant' | 'recruiter');
        setRoles(userRoles);
      } catch (error) {
        console.error('Error fetching roles:', error);
        toast({
          title: 'Error',
          description: 'Failed to load your roles. Please try again.',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    fetchRoles();
  }, [navigate, toast]);

  const handleRoleSelect = (role: 'applicant' | 'recruiter') => {
    const dashboardPath = role === 'applicant' 
      ? '/applicant/dashboard' 
      : '/recruiter/dashboard';
    
    // Store selected role in session storage for this session
    sessionStorage.setItem('selectedRole', role);
    
    if (onRoleSelected) {
      onRoleSelected(role);
    } else {
      navigate(dashboardPath);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Sparkles className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // If user only has one role, redirect automatically
  if (roles.length === 1) {
    handleRoleSelect(roles[0]);
    return null;
  }

  // If user has no roles, redirect to home
  if (roles.length === 0) {
    navigate('/');
    return null;
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-background via-background to-secondary/20">
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Select Your Role</CardTitle>
          <CardDescription>
            You have access to multiple roles. Please select which dashboard you'd like to access.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {roles.includes('recruiter') && (
            <Card className="border-2 hover:border-primary transition-colors cursor-pointer" onClick={() => handleRoleSelect('recruiter')}>
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="p-3 rounded-lg bg-primary/10">
                    <Briefcase className="h-6 w-6 text-primary" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg mb-1">Recruiter Dashboard</h3>
                    <p className="text-sm text-muted-foreground">
                      Manage jobs, candidates, interviews, and your hiring pipeline.
                    </p>
                  </div>
                  <Button variant="outline" size="sm">
                    Access
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {roles.includes('applicant') && (
            <Card className="border-2 hover:border-primary transition-colors cursor-pointer" onClick={() => handleRoleSelect('applicant')}>
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="p-3 rounded-lg bg-accent/10">
                    <User className="h-6 w-6 text-accent" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg mb-1">Applicant Dashboard</h3>
                    <p className="text-sm text-muted-foreground">
                      Browse jobs, track your applications, and manage your profile.
                    </p>
                  </div>
                  <Button variant="outline" size="sm">
                    Access
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="text-center text-sm text-muted-foreground pt-4">
            You can switch between roles at any time from the navigation menu.
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default RoleSelector;

