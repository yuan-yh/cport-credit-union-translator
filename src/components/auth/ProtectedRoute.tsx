import { type ReactNode, useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import { LoadingScreen } from '../ui/LoadingScreen';
import type { UserRole } from '../../types';

// =============================================================================
// PROTECTED ROUTE
// =============================================================================

interface ProtectedRouteProps {
  children: ReactNode;
  requiredRole?: UserRole;
}

export function ProtectedRoute({ children, requiredRole }: ProtectedRouteProps): React.ReactElement {
  const location = useLocation();
  const { isAuthenticated, isLoading, user, refreshAuth } = useAuthStore();

  useEffect(() => {
    if (!isAuthenticated && !isLoading) {
      refreshAuth();
    }
  }, [isAuthenticated, isLoading, refreshAuth]);

  if (isLoading) {
    return <LoadingScreen message="Verifying authentication..." />;
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  // Check role if required (case-insensitive)
  if (requiredRole && user.role?.toUpperCase() !== requiredRole.toUpperCase()) {
    // Redirect non-admin to translate page
    console.log('ProtectedRoute - role mismatch:', user.role, 'vs', requiredRole);
    return <Navigate to="/translate" replace />;
  }

  return <>{children}</>;
}

// =============================================================================
// GUEST ROUTE
// =============================================================================

interface GuestRouteProps {
  children: ReactNode;
}

export function GuestRoute({ children }: GuestRouteProps): React.ReactElement {
  const location = useLocation();
  const { isAuthenticated, isLoading, user } = useAuthStore();

  if (isLoading) {
    return <LoadingScreen message="Loading..." />;
  }

  if (isAuthenticated && user) {
    const from = (location.state as { from?: string })?.from;
    if (from && from !== '/login') {
      return <Navigate to={from} replace />;
    }
    // Role-based redirect (case-insensitive)
    if (user.role?.toUpperCase() === 'ADMIN') {
      return <Navigate to="/admin" replace />;
    }
    return <Navigate to="/translate" replace />;
  }

  return <>{children}</>;
}
