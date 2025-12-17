import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';

type Role = 'recruiter' | 'applicant' | null;

interface RoleContextType {
  selectedRole: Role;
  setSelectedRole: (role: Role) => void;
  navigateToRole: (path: string) => void;
  getRolePath: (path: string) => string;
}

const RoleContext = createContext<RoleContextType | undefined>(undefined);

export const RoleProvider = ({ children }: { children: ReactNode }) => {
  const navigate = useNavigate();
  const [selectedRole, setSelectedRoleState] = useState<Role>(() => {
    // Get from localStorage on mount
    const stored = localStorage.getItem('selectedRole');
    return (stored === 'recruiter' || stored === 'applicant') ? stored : null;
  });

  const setSelectedRole = (role: Role) => {
    setSelectedRoleState(role);
    if (role) {
      localStorage.setItem('selectedRole', role);
    } else {
      localStorage.removeItem('selectedRole');
    }
  };

  const getRolePath = (path: string): string => {
    if (!selectedRole) return path;
    
    // Remove leading slash if present
    const cleanPath = path.startsWith('/') ? path.slice(1) : path;
    
    // If path already starts with role prefix, return as is
    if (cleanPath.startsWith('recruiter/') || cleanPath.startsWith('applicant/')) {
      return `/${cleanPath}`;
    }
    
    // If it's a public route, don't add role prefix
    const publicRoutes = ['/', '/community', '/jobs/public', '/upload', '/interview-landing', '/interview-room', '/mcqs-landing', '/mcqs-room', '/practical-test-landing', '/practical-test-room'];
    if (publicRoutes.some(route => path.startsWith(route))) {
      return path;
    }
    
    // Add role prefix
    return `/${selectedRole}/${cleanPath}`;
  };

  const navigateToRole = (path: string) => {
    const rolePath = getRolePath(path);
    navigate(rolePath);
  };

  return (
    <RoleContext.Provider value={{ selectedRole, setSelectedRole, navigateToRole, getRolePath }}>
      {children}
    </RoleContext.Provider>
  );
};

export const useRole = () => {
  const context = useContext(RoleContext);
  if (context === undefined) {
    throw new Error('useRole must be used within a RoleProvider');
  }
  return context;
};

