import { type ReactNode, useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import type { UserRole } from '../../types';
import { LoadingScreen } from '../ui/LoadingScreen';

// =============================================================================
// PROTECTED ROUTE COMPONENT
// =============================================================================

interface ProtectedRouteProps {
  children: ReactNode;
  requiredRoles?: UserRole[];
  fallbackPath?: string;
}

/**
 * ProtectedRoute - Guards routes requiring authentication
 * 
 * Features:
 * - Redirects unauthenticated users to login
 * - Enforces role-based access control
 * - Shows loading state while verifying auth
 * - Preserves intended destination for redirect after login
 */
export function ProtectedRoute({ 
  children, 
  requiredRoles,
  fallbackPath = '/login',
}: ProtectedRouteProps): React.ReactElement {
  const location = useLocation();
  const { isAuthenticated, isLoading, user, refreshAuth } = useAuthStore();

  // Attempt to restore auth state on mount
  useEffect(() => {
    if (!isAuthenticated && !isLoading) {
      refreshAuth();
    }
  }, [isAuthenticated, isLoading, refreshAuth]);

  // Show loading state while checking authentication
  if (isLoading) {
    return <LoadingScreen message="Verifying authentication..." />;
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated || !user) {
    // Save the intended destination for redirect after login
    return (
      <Navigate 
        to={fallbackPath} 
        state={{ from: location.pathname }} 
        replace 
      />
    );
  }

  // Check role-based access if roles are specified
  if (requiredRoles && requiredRoles.length > 0) {
    const hasRequiredRole = requiredRoles.includes(user.role);
    
    if (!hasRequiredRole) {
      // User is authenticated but doesn't have required role
      // Redirect to appropriate dashboard based on their role
      const roleRedirects: Record<UserRole, string> = {
        GREETER: '/greeter',
        TELLER: '/teller',
        CONSULTOR: '/consultor',
        MANAGER: '/admin',
        ADMIN: '/admin',
      };
      
      return <Navigate to={roleRedirects[user.role] || '/'} replace />;
    }
  }

  // User is authenticated and has required role (if specified)
  return <>{children}</>;
}

// =============================================================================
// GUEST ROUTE - Only accessible when NOT authenticated
// =============================================================================

interface GuestRouteProps {
  children: ReactNode;
  redirectPath?: string;
}

/**
 * GuestRoute - For pages like login that should only be accessible
 * when the user is NOT authenticated
 */
export function GuestRoute({ 
  children, 
  redirectPath,
}: GuestRouteProps): React.ReactElement {
  const location = useLocation();
  const { isAuthenticated, isLoading, user } = useAuthStore();

  if (isLoading) {
    return <LoadingScreen message="Loading..." />;
  }

  if (isAuthenticated && user) {
    // Redirect authenticated users to their intended destination
    // or to the appropriate dashboard based on role
    const from = (location.state as { from?: string })?.from;
    
    if (from && from !== '/login') {
      return <Navigate to={from} replace />;
    }
    
    // Default redirects based on role
    const roleRedirects: Record<UserRole, string> = {
      GREETER: '/greeter',
      TELLER: '/teller',
      CONSULTOR: '/consultor',
      MANAGER: '/admin',
      ADMIN: '/admin',
    };
    
    const defaultPath = redirectPath || roleRedirects[user.role] || '/';
    return <Navigate to={defaultPath} replace />;
  }

  return <>{children}</>;
}
