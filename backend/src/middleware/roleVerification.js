import { supabase } from '../config/supabase.js';

/**
 * Role verification middleware
 * Verifies that the user has the required role(s)
 * @param {string|string[]} requiredRoles - Single role or array of roles
 */
export const requireRole = (requiredRoles) => {
  return async (req, res, next) => {
    try {
      const userId = req.user.id;
      const roles = Array.isArray(requiredRoles) ? requiredRoles : [requiredRoles];

      // Get user roles
      const { data: userRoles, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId);

      if (error) {
        console.error('Error fetching user roles:', error);
        return res.status(500).json({ error: 'Failed to verify user role' });
      }

      const userRoleNames = (userRoles || []).map(r => r.role);

      // Check if user has at least one of the required roles
      const hasRequiredRole = roles.some(role => userRoleNames.includes(role));

      if (!hasRequiredRole) {
        return res.status(403).json({ 
          error: 'Forbidden - Insufficient permissions',
          requiredRoles: roles,
          userRoles: userRoleNames
        });
      }

      // Attach user roles to request for use in route handlers
      req.userRoles = userRoleNames;
      next();
    } catch (error) {
      console.error('Role verification error:', error);
      res.status(500).json({ error: 'Internal server error during role verification' });
    }
  };
};

/**
 * Get user roles (helper function)
 */
export const getUserRoles = async (userId) => {
  const { data, error } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', userId);

  if (error) {
    console.error('Error fetching user roles:', error);
    return [];
  }

  return (data || []).map(r => r.role);
};

